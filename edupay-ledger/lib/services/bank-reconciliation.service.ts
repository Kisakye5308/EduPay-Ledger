/**
 * Bank Reconciliation Service
 * Backend service for matching bank statements with recorded payments
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  BankTransaction,
  BankTransactionWithStatus,
  ReconciliationSession,
  ReconciliationMatch,
  ReconciliationSummary,
  ReconciliationStatus,
  BankImportConfig,
  PossibleMatch,
  ReconciliationAction,
  calculateMatchConfidence,
  parseAmount,
  UGANDA_BANK_CONFIGS,
} from '../../types/bank-reconciliation';

// ============================================
// IMPORT BANK STATEMENT
// ============================================

export async function createReconciliationSession(
  schoolId: string,
  bankAccountName: string,
  bankAccountNumber: string,
  fileName: string,
  transactions: BankTransaction[],
  userId: string
): Promise<ReconciliationSession> {
  const sessionsRef = collection(db, 'schools', schoolId, 'reconciliationSessions');
  
  // Calculate totals
  const credits = transactions.filter(t => t.type === 'credit');
  const debits = transactions.filter(t => t.type === 'debit');
  const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);

  // Find date range
  const dates = transactions.map(t => new Date(t.transactionDate).getTime());
  const periodStart = new Date(Math.min(...dates));
  const periodEnd = new Date(Math.max(...dates));

  const sessionData: Omit<ReconciliationSession, 'id'> = {
    schoolId,
    bankAccountName,
    bankAccountNumber,
    statementPeriodStart: periodStart,
    statementPeriodEnd: periodEnd,
    fileName,
    importedAt: new Date(),
    importedBy: userId,
    status: 'processing',
    totalTransactions: transactions.length,
    totalCredits,
    totalDebits,
    matchedCount: 0,
    unmatchedCount: 0,
    ignoredCount: 0,
  };

  const sessionRef = await addDoc(sessionsRef, {
    ...sessionData,
    statementPeriodStart: Timestamp.fromDate(periodStart),
    statementPeriodEnd: Timestamp.fromDate(periodEnd),
    importedAt: Timestamp.now(),
  });

  // Store transactions
  const batch = writeBatch(db);
  const txRef = collection(db, 'schools', schoolId, 'bankTransactions');
  
  transactions.forEach((tx) => {
    const docRef = doc(txRef);
    batch.set(docRef, {
      ...tx,
      sessionId: sessionRef.id,
      status: 'pending',
      transactionDate: Timestamp.fromDate(new Date(tx.transactionDate)),
      valueDate: Timestamp.fromDate(new Date(tx.valueDate)),
      createdAt: Timestamp.now(),
    });
  });

  await batch.commit();

  // Start auto-matching process
  await runAutoMatching(schoolId, sessionRef.id);

  return {
    id: sessionRef.id,
    ...sessionData,
  };
}

// ============================================
// AUTO-MATCHING
// ============================================

export async function runAutoMatching(
  schoolId: string,
  sessionId: string
): Promise<void> {
  // Get all pending transactions for this session
  const txRef = collection(db, 'schools', schoolId, 'bankTransactions');
  const txQuery = query(
    txRef,
    where('sessionId', '==', sessionId),
    where('status', '==', 'pending'),
    where('type', '==', 'credit')
  );
  const txSnap = await getDocs(txQuery);

  // Get payments in the same date range
  const sessionDoc = await getDoc(doc(db, 'schools', schoolId, 'reconciliationSessions', sessionId));
  const session = sessionDoc.data();
  
  const paymentsRef = collection(db, 'schools', schoolId, 'payments');
  const paymentsQuery = query(
    paymentsRef,
    where('date', '>=', session?.statementPeriodStart),
    where('date', '<=', session?.statementPeriodEnd),
    where('status', '==', 'completed')
  );
  const paymentsSnap = await getDocs(paymentsQuery);

  interface PaymentDoc {
    id: string;
    amount: number;
    date: Date;
    reference: string;
    studentName: string;
    [key: string]: unknown;
  }

  const payments: PaymentDoc[] = paymentsSnap.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      amount: data.amount || 0,
      date: data.date?.toDate() || new Date(),
      reference: data.reference || '',
      studentName: data.studentName || '',
    };
  });

  // Match transactions
  const batch = writeBatch(db);
  let matchedCount = 0;
  const usedPaymentIds = new Set<string>();

  for (const txDoc of txSnap.docs) {
    const tx = txDoc.data() as BankTransaction;
    
    // Find best matching payment
    let bestMatch: { payment: PaymentDoc; confidence: number } | null = null;
    
    for (const payment of payments) {
      if (usedPaymentIds.has(payment.id)) continue;
      
      const confidence = calculateMatchConfidence(tx, {
        amount: payment.amount,
        date: payment.date,
        reference: payment.reference,
        studentName: payment.studentName,
      });

      if (confidence >= 80 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = { payment, confidence };
      }
    }

    if (bestMatch) {
      // Create match record
      const matchRef = collection(db, 'schools', schoolId, 'reconciliationMatches');
      const matchData: Omit<ReconciliationMatch, 'id'> = {
        bankTransactionId: txDoc.id,
        paymentId: bestMatch.payment.id,
        matchType: 'auto',
        matchConfidence: bestMatch.confidence,
        matchReason: 'Auto-matched based on amount, date, and reference',
        matchedAt: new Date(),
      };
      
      await addDoc(matchRef, {
        ...matchData,
        matchedAt: Timestamp.now(),
      });

      // Update transaction status
      batch.update(txDoc.ref, { status: 'matched' });
      
      // Mark payment as reconciled
      batch.update(doc(paymentsRef, bestMatch.payment.id), { isReconciled: true });
      
      usedPaymentIds.add(bestMatch.payment.id);
      matchedCount++;
    } else {
      batch.update(txDoc.ref, { status: 'unmatched' });
    }
  }

  await batch.commit();

  // Update session counts
  const unmatchedCount = txSnap.size - matchedCount;
  await updateDoc(doc(db, 'schools', schoolId, 'reconciliationSessions', sessionId), {
    status: 'in_progress',
    matchedCount,
    unmatchedCount,
  });
}

// ============================================
// GET TRANSACTIONS
// ============================================

export async function getSessionTransactions(
  schoolId: string,
  sessionId: string,
  statusFilter?: ReconciliationStatus
): Promise<BankTransactionWithStatus[]> {
  const txRef = collection(db, 'schools', schoolId, 'bankTransactions');
  let txQuery = query(
    txRef,
    where('sessionId', '==', sessionId),
    orderBy('transactionDate', 'desc')
  );

  if (statusFilter) {
    txQuery = query(
      txRef,
      where('sessionId', '==', sessionId),
      where('status', '==', statusFilter),
      orderBy('transactionDate', 'desc')
    );
  }

  const txSnap = await getDocs(txQuery);
  
  const transactions: BankTransactionWithStatus[] = [];
  
  for (const txDoc of txSnap.docs) {
    const data = txDoc.data();
    const tx: BankTransactionWithStatus = {
      id: txDoc.id,
      transactionDate: data.transactionDate?.toDate() || new Date(),
      valueDate: data.valueDate?.toDate() || new Date(),
      reference: data.reference || '',
      description: data.description || '',
      amount: data.amount || 0,
      type: data.type || 'credit',
      balance: data.balance || 0,
      rawData: data.rawData || {},
      status: data.status || 'pending',
    };

    // Get match if exists
    if (tx.status === 'matched' || tx.status === 'manual_match') {
      const matchQuery = query(
        collection(db, 'schools', schoolId, 'reconciliationMatches'),
        where('bankTransactionId', '==', txDoc.id),
        limit(1)
      );
      const matchSnap = await getDocs(matchQuery);
      if (!matchSnap.empty) {
        const matchData = matchSnap.docs[0].data();
        tx.match = {
          id: matchSnap.docs[0].id,
          bankTransactionId: txDoc.id,
          paymentId: matchData.paymentId,
          matchType: matchData.matchType,
          matchConfidence: matchData.matchConfidence,
          matchReason: matchData.matchReason,
          matchedAt: matchData.matchedAt?.toDate() || new Date(),
          matchedBy: matchData.matchedBy,
          notes: matchData.notes,
        };
      }
    }

    // Get possible matches for unmatched
    if (tx.status === 'unmatched' || tx.status === 'pending') {
      tx.possibleMatches = await findPossibleMatches(schoolId, tx);
    }

    transactions.push(tx);
  }

  return transactions;
}

// ============================================
// FIND POSSIBLE MATCHES
// ============================================

export async function findPossibleMatches(
  schoolId: string,
  transaction: BankTransaction
): Promise<PossibleMatch[]> {
  const paymentsRef = collection(db, 'schools', schoolId, 'payments');
  
  // Get payments within a reasonable date range (±7 days)
  const txDate = new Date(transaction.transactionDate);
  const startDate = new Date(txDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(txDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const paymentsQuery = query(
    paymentsRef,
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    where('isReconciled', '!=', true),
    limit(20)
  );

  const paymentsSnap = await getDocs(paymentsQuery);
  
  const matches: PossibleMatch[] = [];
  
  for (const paymentDoc of paymentsSnap.docs) {
    const payment = paymentDoc.data();
    const confidence = calculateMatchConfidence(transaction, {
      amount: payment.amount,
      date: payment.date?.toDate() || new Date(),
      reference: payment.reference,
      studentName: payment.studentName,
    });

    if (confidence >= 30) {
      const reasons: string[] = [];
      if (payment.amount === transaction.amount) reasons.push('Amount matches exactly');
      else if (Math.abs(payment.amount - transaction.amount) < 1000) reasons.push('Amount is close');
      
      if (payment.reference && transaction.description.includes(payment.reference)) {
        reasons.push('Reference found in description');
      }

      matches.push({
        paymentId: paymentDoc.id,
        studentName: payment.studentName || 'Unknown',
        studentId: payment.studentId || '',
        paymentAmount: payment.amount,
        paymentDate: payment.date?.toDate() || new Date(),
        paymentMethod: payment.paymentMethod || 'Unknown',
        receiptNumber: payment.receiptNumber || '',
        confidence,
        matchReasons: reasons,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// ============================================
// MANUAL ACTIONS
// ============================================

export async function manualMatch(
  schoolId: string,
  transactionId: string,
  paymentId: string,
  userId: string,
  notes?: string
): Promise<void> {
  const txRef = doc(db, 'schools', schoolId, 'bankTransactions', transactionId);
  const paymentRef = doc(db, 'schools', schoolId, 'payments', paymentId);
  const matchesRef = collection(db, 'schools', schoolId, 'reconciliationMatches');

  // Create match record
  await addDoc(matchesRef, {
    bankTransactionId: transactionId,
    paymentId,
    matchType: 'manual',
    matchConfidence: 100,
    matchReason: 'Manually matched by user',
    matchedAt: Timestamp.now(),
    matchedBy: userId,
    notes,
  });

  // Update transaction status
  await updateDoc(txRef, { status: 'manual_match' });

  // Mark payment as reconciled
  await updateDoc(paymentRef, { isReconciled: true });

  // Update session counts
  const txDoc = await getDoc(txRef);
  const sessionId = txDoc.data()?.sessionId;
  if (sessionId) {
    const sessionRef = doc(db, 'schools', schoolId, 'reconciliationSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    const session = sessionDoc.data();
    await updateDoc(sessionRef, {
      matchedCount: (session?.matchedCount || 0) + 1,
      unmatchedCount: Math.max(0, (session?.unmatchedCount || 1) - 1),
    });
  }
}

export async function unmatchTransaction(
  schoolId: string,
  transactionId: string
): Promise<void> {
  const txRef = doc(db, 'schools', schoolId, 'bankTransactions', transactionId);
  
  // Find and delete match record
  const matchQuery = query(
    collection(db, 'schools', schoolId, 'reconciliationMatches'),
    where('bankTransactionId', '==', transactionId)
  );
  const matchSnap = await getDocs(matchQuery);
  
  for (const matchDoc of matchSnap.docs) {
    // Unreconcile the payment
    const paymentId = matchDoc.data().paymentId;
    await updateDoc(doc(db, 'schools', schoolId, 'payments', paymentId), {
      isReconciled: false,
    });
    
    // Delete match
    await deleteDoc(matchDoc.ref);
  }

  // Update transaction status
  await updateDoc(txRef, { status: 'unmatched' });
}

export async function ignoreTransaction(
  schoolId: string,
  transactionId: string,
  reason: string,
  userId: string
): Promise<void> {
  const txRef = doc(db, 'schools', schoolId, 'bankTransactions', transactionId);
  await updateDoc(txRef, {
    status: 'ignored',
    ignoreReason: reason,
    ignoredBy: userId,
    ignoredAt: Timestamp.now(),
  });
}

// ============================================
// RECONCILIATION SUMMARY
// ============================================

export async function getReconciliationSummary(
  schoolId: string,
  sessionId: string
): Promise<ReconciliationSummary> {
  // Get session
  const sessionDoc = await getDoc(doc(db, 'schools', schoolId, 'reconciliationSessions', sessionId));
  const session = sessionDoc.data();

  // Get all transactions
  const txRef = collection(db, 'schools', schoolId, 'bankTransactions');
  const txQuery = query(txRef, where('sessionId', '==', sessionId));
  const txSnap = await getDocs(txQuery);

  // Calculate by status
  const byStatus: { [key: string]: { count: number; amount: number } } = {};
  let totalCredits = 0;
  let totalDebits = 0;
  let matchedAmount = 0;
  let unmatchedBankAmount = 0;

  for (const txDoc of txSnap.docs) {
    const tx = txDoc.data();
    const status = tx.status as ReconciliationStatus;
    const amount = tx.amount || 0;

    if (tx.type === 'credit') totalCredits += amount;
    else totalDebits += amount;

    if (!byStatus[status]) {
      byStatus[status] = { count: 0, amount: 0 };
    }
    byStatus[status].count++;
    byStatus[status].amount += amount;

    if (status === 'matched' || status === 'manual_match') {
      matchedAmount += amount;
    } else if (status === 'unmatched' && tx.type === 'credit') {
      unmatchedBankAmount += amount;
    }
  }

  // Get system payments in same period
  const paymentsRef = collection(db, 'schools', schoolId, 'payments');
  const paymentsQuery = query(
    paymentsRef,
    where('date', '>=', session?.statementPeriodStart),
    where('date', '<=', session?.statementPeriodEnd),
    where('status', '==', 'completed')
  );
  const paymentsSnap = await getDocs(paymentsQuery);
  
  let totalSystemPayments = 0;
  let reconciledSystemAmount = 0;
  
  for (const paymentDoc of paymentsSnap.docs) {
    const payment = paymentDoc.data();
    totalSystemPayments += payment.amount || 0;
    if (payment.isReconciled) {
      reconciledSystemAmount += payment.amount || 0;
    }
  }

  const unmatchedSystemAmount = totalSystemPayments - reconciledSystemAmount;

  return {
    sessionId,
    totalBankCredits: totalCredits,
    totalBankDebits: totalDebits,
    totalSystemPayments,
    matchedAmount,
    unmatchedBankAmount,
    unmatchedSystemAmount,
    variance: totalCredits - totalSystemPayments,
    matchRate: txSnap.size > 0 ? ((byStatus['matched']?.count || 0) + (byStatus['manual_match']?.count || 0)) / txSnap.size * 100 : 0,
    byStatus: Object.entries(byStatus).map(([status, data]) => ({
      status: status as ReconciliationStatus,
      ...data,
    })),
    byPaymentMethod: [], // Would need additional logic
  };
}

// ============================================
// GET SESSIONS
// ============================================

export async function getReconciliationSessions(
  schoolId: string
): Promise<ReconciliationSession[]> {
  const sessionsRef = collection(db, 'schools', schoolId, 'reconciliationSessions');
  const sessionsQuery = query(sessionsRef, orderBy('importedAt', 'desc'));
  const sessionsSnap = await getDocs(sessionsQuery);

  return sessionsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      schoolId: data.schoolId,
      bankAccountName: data.bankAccountName,
      bankAccountNumber: data.bankAccountNumber,
      statementPeriodStart: data.statementPeriodStart?.toDate() || new Date(),
      statementPeriodEnd: data.statementPeriodEnd?.toDate() || new Date(),
      fileName: data.fileName,
      importedAt: data.importedAt?.toDate() || new Date(),
      importedBy: data.importedBy,
      status: data.status,
      totalTransactions: data.totalTransactions,
      totalCredits: data.totalCredits,
      totalDebits: data.totalDebits,
      matchedCount: data.matchedCount,
      unmatchedCount: data.unmatchedCount,
      ignoredCount: data.ignoredCount,
      completedAt: data.completedAt?.toDate(),
      completedBy: data.completedBy,
      notes: data.notes,
    };
  });
}

// ============================================
// PARSE BANK STATEMENT
// ============================================

export function parseBankStatement(
  rows: Record<string, unknown>[],
  config: BankImportConfig
): BankTransaction[] {
  const transactions: BankTransaction[] = [];

  for (const row of rows) {
    const dateStr = row[config.dateColumn] as string;
    const reference = row[config.referenceColumn] as string || '';
    const description = row[config.descriptionColumn] as string || '';
    const amountStr = row[config.amountColumn] as string | number;
    const typeStr = config.typeColumn ? row[config.typeColumn] as string : null;
    const balanceStr = config.balanceColumn ? row[config.balanceColumn] as string | number : 0;

    // Parse date
    let transactionDate: Date;
    try {
      transactionDate = parseDate(dateStr, config.dateFormat);
    } catch {
      continue; // Skip invalid rows
    }

    // Parse amount
    const amount = parseAmount(amountStr);
    if (amount === 0) continue;

    // Determine type
    let type: 'credit' | 'debit' = 'credit';
    if (typeStr) {
      if (config.debitIndicator && typeStr.toUpperCase().includes(config.debitIndicator.toUpperCase())) {
        type = 'debit';
      } else if (config.creditIndicator && typeStr.toUpperCase().includes(config.creditIndicator.toUpperCase())) {
        type = 'credit';
      }
    } else if (amount < 0) {
      type = 'debit';
    }

    transactions.push({
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transactionDate,
      valueDate: transactionDate,
      reference,
      description,
      amount: Math.abs(amount),
      type,
      balance: parseAmount(balanceStr),
      rawData: row,
    });
  }

  return transactions;
}

function parseDate(dateStr: string, format: string): Date {
  // Simple date parser - in production use date-fns or moment
  const cleaned = dateStr.trim();
  
  if (format === 'DD/MM/YYYY') {
    const [day, month, year] = cleaned.split('/').map(Number);
    return new Date(year, month - 1, day);
  } else if (format === 'DD-MMM-YYYY') {
    const months: { [key: string]: number } = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };
    const parts = cleaned.split('-');
    return new Date(parseInt(parts[2]), months[parts[1].toUpperCase()] || 0, parseInt(parts[0]));
  } else if (format === 'YYYY-MM-DD') {
    return new Date(cleaned);
  } else if (format === 'DD-MM-YYYY') {
    const [day, month, year] = cleaned.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  return new Date(cleaned);
}

// ============================================
// MOCK DATA
// ============================================

export function getMockReconciliationSessions(): ReconciliationSession[] {
  return [
    {
      id: 'session-001',
      schoolId: 'school-001',
      bankAccountName: 'School Fees Account',
      bankAccountNumber: '1234567890',
      statementPeriodStart: new Date('2024-01-01'),
      statementPeriodEnd: new Date('2024-01-31'),
      fileName: 'stanbic_jan_2024.csv',
      importedAt: new Date('2024-02-01'),
      importedBy: 'user-001',
      status: 'in_progress',
      totalTransactions: 45,
      totalCredits: 12500000,
      totalDebits: 350000,
      matchedCount: 38,
      unmatchedCount: 7,
      ignoredCount: 0,
    },
  ];
}

export function getMockTransactions(): BankTransactionWithStatus[] {
  return [
    {
      id: 'tx-001',
      transactionDate: new Date('2024-01-15'),
      valueDate: new Date('2024-01-15'),
      reference: 'MTN-789456',
      description: 'MOBILE MONEY DEPOSIT MUKASA JOHN',
      amount: 500000,
      type: 'credit',
      balance: 15000000,
      rawData: {},
      status: 'matched',
      match: {
        id: 'match-001',
        bankTransactionId: 'tx-001',
        paymentId: 'pay-001',
        matchType: 'auto',
        matchConfidence: 95,
        matchReason: 'Amount and name match',
        matchedAt: new Date('2024-02-01'),
      },
    },
    {
      id: 'tx-002',
      transactionDate: new Date('2024-01-16'),
      valueDate: new Date('2024-01-16'),
      reference: 'AIRTEL-123456',
      description: 'AIRTEL MONEY TRANSFER REF:FEE2024',
      amount: 350000,
      type: 'credit',
      balance: 15350000,
      rawData: {},
      status: 'unmatched',
      possibleMatches: [
        {
          paymentId: 'pay-002',
          studentName: 'Sarah Nambi',
          studentId: 'EDU-2024-002',
          paymentAmount: 350000,
          paymentDate: new Date('2024-01-17'),
          paymentMethod: 'Airtel Money',
          receiptNumber: 'RCP-002',
          confidence: 75,
          matchReasons: ['Amount matches exactly', 'Date is within 1 day'],
        },
      ],
    },
    {
      id: 'tx-003',
      transactionDate: new Date('2024-01-17'),
      valueDate: new Date('2024-01-17'),
      reference: 'BANK-CHG',
      description: 'MONTHLY BANK CHARGES',
      amount: 15000,
      type: 'debit',
      balance: 15335000,
      rawData: {},
      status: 'ignored',
    },
  ];
}

/**
 * Bank Reconciliation Types
 * Type definitions for matching bank statements with recorded payments
 */

// Bank Transaction from import
export interface BankTransaction {
  id: string;
  transactionDate: Date;
  valueDate: Date;
  reference: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  rawData: Record<string, unknown>;
}

// Reconciliation Status
export type ReconciliationStatus = 
  | 'pending'          // Not yet processed
  | 'matched'          // Auto-matched with a payment
  | 'manual_match'     // Manually matched
  | 'unmatched'        // No matching payment found
  | 'ignored'          // Marked as ignored (non-fee transaction)
  | 'disputed';        // Flagged for review

// Matched Payment Record
export interface ReconciliationMatch {
  id: string;
  bankTransactionId: string;
  paymentId: string;
  matchType: 'auto' | 'manual';
  matchConfidence: number; // 0-100
  matchReason: string;
  matchedAt: Date;
  matchedBy?: string;
  notes?: string;
}

// Reconciliation Session
export interface ReconciliationSession {
  id: string;
  schoolId: string;
  bankAccountName: string;
  bankAccountNumber: string;
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  fileName: string;
  importedAt: Date;
  importedBy: string;
  status: 'processing' | 'in_progress' | 'completed' | 'failed';
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  matchedCount: number;
  unmatchedCount: number;
  ignoredCount: number;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

// Bank Transaction with Reconciliation Info
export interface BankTransactionWithStatus extends BankTransaction {
  status: ReconciliationStatus;
  match?: ReconciliationMatch;
  possibleMatches?: PossibleMatch[];
}

// Possible Match Suggestion
export interface PossibleMatch {
  paymentId: string;
  studentName: string;
  studentId: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  receiptNumber: string;
  confidence: number;
  matchReasons: string[];
}

// Reconciliation Summary
export interface ReconciliationSummary {
  sessionId: string;
  totalBankCredits: number;
  totalBankDebits: number;
  totalSystemPayments: number;
  matchedAmount: number;
  unmatchedBankAmount: number;
  unmatchedSystemAmount: number;
  variance: number;
  matchRate: number;
  byStatus: {
    status: ReconciliationStatus;
    count: number;
    amount: number;
  }[];
  byPaymentMethod: {
    method: string;
    bankCount: number;
    bankAmount: number;
    systemCount: number;
    systemAmount: number;
  }[];
}

// Import Configuration
export interface BankImportConfig {
  bankName: string;
  dateFormat: string;
  dateColumn: string;
  referenceColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  typeColumn?: string;
  balanceColumn?: string;
  headerRow: number;
  creditIndicator?: string;
  debitIndicator?: string;
}

// Default Bank Configurations for Uganda
export const UGANDA_BANK_CONFIGS: { [key: string]: BankImportConfig } = {
  stanbic: {
    bankName: 'Stanbic Bank Uganda',
    dateFormat: 'DD/MM/YYYY',
    dateColumn: 'Transaction Date',
    referenceColumn: 'Reference',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    typeColumn: 'Dr/Cr',
    balanceColumn: 'Balance',
    headerRow: 1,
    creditIndicator: 'CR',
    debitIndicator: 'DR',
  },
  dfcu: {
    bankName: 'DFCU Bank',
    dateFormat: 'DD-MMM-YYYY',
    dateColumn: 'Date',
    referenceColumn: 'Reference No',
    descriptionColumn: 'Particulars',
    amountColumn: 'Amount',
    typeColumn: 'Transaction Type',
    balanceColumn: 'Running Balance',
    headerRow: 1,
    creditIndicator: 'Credit',
    debitIndicator: 'Debit',
  },
  equity: {
    bankName: 'Equity Bank Uganda',
    dateFormat: 'YYYY-MM-DD',
    dateColumn: 'Trans Date',
    referenceColumn: 'Trans Ref',
    descriptionColumn: 'Narration',
    amountColumn: 'Amount',
    balanceColumn: 'Balance',
    headerRow: 1,
  },
  centenary: {
    bankName: 'Centenary Bank',
    dateFormat: 'DD/MM/YYYY',
    dateColumn: 'Value Date',
    referenceColumn: 'Reference',
    descriptionColumn: 'Transaction Details',
    amountColumn: 'Amount',
    typeColumn: 'Type',
    balanceColumn: 'Balance',
    headerRow: 2,
    creditIndicator: 'C',
    debitIndicator: 'D',
  },
  standardChartered: {
    bankName: 'Standard Chartered Uganda',
    dateFormat: 'DD-MM-YYYY',
    dateColumn: 'Date',
    referenceColumn: 'Transaction Reference',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    typeColumn: 'Debit/Credit',
    balanceColumn: 'Closing Balance',
    headerRow: 1,
  },
};

// Reconciliation Action
export type ReconciliationAction = 
  | { type: 'match'; transactionId: string; paymentId: string; notes?: string }
  | { type: 'unmatch'; transactionId: string }
  | { type: 'ignore'; transactionId: string; reason: string }
  | { type: 'dispute'; transactionId: string; reason: string }
  | { type: 'create_payment'; transactionId: string; studentId: string; category?: string };

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateMatchConfidence(
  bankTx: BankTransaction,
  payment: { amount: number; date: Date; reference?: string; studentName?: string }
): number {
  let confidence = 0;

  // Amount match (most important)
  if (bankTx.amount === payment.amount) {
    confidence += 50;
  } else if (Math.abs(bankTx.amount - payment.amount) < 1000) {
    confidence += 30;
  }

  // Date match
  const bankDate = new Date(bankTx.transactionDate);
  const paymentDate = new Date(payment.date);
  const daysDiff = Math.abs(bankDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDiff === 0) confidence += 25;
  else if (daysDiff <= 1) confidence += 20;
  else if (daysDiff <= 3) confidence += 10;

  // Reference match
  if (payment.reference && bankTx.reference.includes(payment.reference)) {
    confidence += 20;
  } else if (payment.reference && bankTx.description.includes(payment.reference)) {
    confidence += 15;
  }

  // Name match
  if (payment.studentName) {
    const nameParts = payment.studentName.toLowerCase().split(' ');
    const descLower = bankTx.description.toLowerCase();
    const matchingParts = nameParts.filter(part => descLower.includes(part)).length;
    if (matchingParts >= 2) confidence += 15;
    else if (matchingParts === 1) confidence += 5;
  }

  return Math.min(confidence, 100);
}

export function parseAmount(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[UGX,\s]/gi, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatReconciliationStatus(status: ReconciliationStatus): string {
  const labels: Record<ReconciliationStatus, string> = {
    pending: 'Pending',
    matched: 'Matched',
    manual_match: 'Manually Matched',
    unmatched: 'Unmatched',
    ignored: 'Ignored',
    disputed: 'Disputed',
  };
  return labels[status];
}

export function getStatusColor(status: ReconciliationStatus): string {
  const colors: Record<ReconciliationStatus, string> = {
    pending: 'text-gray-600 bg-gray-100',
    matched: 'text-green-600 bg-green-100',
    manual_match: 'text-blue-600 bg-blue-100',
    unmatched: 'text-red-600 bg-red-100',
    ignored: 'text-gray-600 bg-gray-100',
    disputed: 'text-orange-600 bg-orange-100',
  };
  return colors[status];
}

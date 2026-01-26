/**
 * Payments Service
 * Handles all payment-related operations with Firebase Firestore
 * Ready for production integration
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  startAfter,
  DocumentSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Payment, PaymentChannel, PaymentRecordStatus, PaymentRecordInput } from '@/types/payment';

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentListItem {
  id: string;
  receiptNumber: string;
  transactionRef: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentStream?: string;
  amount: number;
  channel: PaymentChannel;
  channelDisplay: string;
  status: PaymentRecordStatus;
  recordedBy: string;
  recordedAt: Date;
  stellarAnchored: boolean;
  stellarTxHash?: string;
  notes?: string;
}

export interface PaymentStats {
  todayCollection: number;
  todayCount: number;
  weekCollection: number;
  weekCount: number;
  monthCollection: number;
  monthCount: number;
  pendingVerification: number;
  clearedCount: number;
  totalCollection: number;
  averagePayment: number;
}

export interface PaymentFilters {
  search: string;
  channel: string;
  status: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: 'date' | 'amount' | 'student';
  sortOrder: 'asc' | 'desc';
}

export interface CollectionTrend {
  date: string;
  amount: number;
  count: number;
}

export interface ChannelBreakdown {
  channel: PaymentChannel;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PaymentActivity {
  id: string;
  type: 'payment_recorded' | 'payment_verified' | 'payment_reversed' | 'receipt_uploaded';
  description: string;
  amount?: number;
  studentName?: string;
  performedBy: string;
  timestamp: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getChannelDisplayName(channel: PaymentChannel): string {
  const names: Record<PaymentChannel, string> = {
    momo_mtn: 'MTN MoMo',
    momo_airtel: 'Airtel Money',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    cheque: 'Cheque',
    other: 'Other',
  };
  return names[channel] || 'Unknown';
}

function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

function getStartOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStartOfMonth(date: Date): Date {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

// ============================================================================
// FIREBASE FUNCTIONS (Ready for integration)
// ============================================================================

export async function getPayments(
  schoolId: string,
  filters: PaymentFilters,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ payments: PaymentListItem[]; lastDoc: DocumentSnapshot | null }> {
  try {
    let q = query(
      collection(db, 'payments'),
      where('schoolId', '==', schoolId),
      orderBy(filters.sortBy === 'date' ? 'recordedAt' : filters.sortBy === 'amount' ? 'amount' : 'studentName', filters.sortOrder),
      limit(pageSize)
    );

    if (filters.status && filters.status !== 'All') {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.channel && filters.channel !== 'All') {
      q = query(q, where('channel', '==', filters.channel));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const payments: PaymentListItem[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        receiptNumber: data.receiptNumber,
        transactionRef: data.transactionRef,
        studentId: data.studentId,
        studentName: data.studentName,
        studentClass: data.studentClass,
        studentStream: data.studentStream,
        amount: data.amount,
        channel: data.channel,
        channelDisplay: getChannelDisplayName(data.channel),
        status: data.status,
        recordedBy: data.recordedBy,
        recordedAt: data.recordedAt.toDate(),
        stellarAnchored: data.stellarAnchored,
        stellarTxHash: data.stellarTxHash,
        notes: data.notes,
      });
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { payments, lastDoc: lastVisible };
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
}

export async function getPaymentStats(schoolId: string): Promise<PaymentStats> {
  try {
    const now = new Date();
    const startOfToday = getStartOfDay(now);
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = getStartOfMonth(now);

    // In production, these would be separate queries or aggregations
    const paymentsRef = collection(db, 'payments');
    const schoolPayments = query(paymentsRef, where('schoolId', '==', schoolId));
    
    const snapshot = await getDocs(schoolPayments);
    
    let todayCollection = 0, todayCount = 0;
    let weekCollection = 0, weekCount = 0;
    let monthCollection = 0, monthCount = 0;
    let pendingVerification = 0, clearedCount = 0;
    let totalCollection = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const recordedAt = data.recordedAt.toDate();
      const amount = data.amount;

      totalCollection += amount;

      if (recordedAt >= startOfToday) {
        todayCollection += amount;
        todayCount++;
      }
      if (recordedAt >= startOfWeek) {
        weekCollection += amount;
        weekCount++;
      }
      if (recordedAt >= startOfMonth) {
        monthCollection += amount;
        monthCount++;
      }
      if (data.status === 'pending') {
        pendingVerification++;
      }
      if (data.status === 'cleared') {
        clearedCount++;
      }
    });

    const totalCount = snapshot.size;
    
    return {
      todayCollection,
      todayCount,
      weekCollection,
      weekCount,
      monthCollection,
      monthCount,
      pendingVerification,
      clearedCount,
      totalCollection,
      averagePayment: totalCount > 0 ? Math.round(totalCollection / totalCount) : 0,
    };
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    throw error;
  }
}

export async function recordPayment(
  schoolId: string,
  input: PaymentRecordInput,
  recordedBy: string
): Promise<string> {
  try {
    const studentDoc = await getDoc(doc(db, 'students', input.studentId));
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    const studentData = studentDoc.data();

    const paymentData: Omit<Payment, 'id'> = {
      receiptNumber: generateReceiptNumber(),
      transactionRef: input.transactionRef,
      studentId: input.studentId,
      studentName: `${studentData.firstName} ${studentData.lastName}`,
      studentClass: studentData.className,
      studentStream: studentData.streamName,
      schoolId,
      amount: input.amount,
      currency: 'UGX',
      channel: input.channel,
      installmentId: input.installmentId,
      installmentName: '', // Would be fetched from installment
      status: 'pending',
      stellarAnchored: false,
      recordedBy,
      recordedAt: Timestamp.now(),
      notes: input.notes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'payments'), paymentData);
    
    // Update student's payment totals (in production, use a transaction)
    const batch = writeBatch(db);
    batch.update(doc(db, 'students', input.studentId), {
      amountPaid: (studentData.amountPaid || 0) + input.amount,
      balance: (studentData.balance || 0) - input.amount,
      updatedAt: Timestamp.now(),
    });
    await batch.commit();

    return docRef.id;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

export async function verifyPayment(paymentId: string, verifiedBy: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'cleared',
      verifiedAt: Timestamp.now(),
      verifiedBy,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

export async function reversePayment(paymentId: string, reason: string, reversedBy: string): Promise<void> {
  try {
    const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }
    const paymentData = paymentDoc.data();

    const batch = writeBatch(db);
    
    // Update payment status
    batch.update(doc(db, 'payments', paymentId), {
      status: 'reversed',
      notes: `Reversed: ${reason}`,
      updatedAt: Timestamp.now(),
    });

    // Revert student balance
    const studentDoc = await getDoc(doc(db, 'students', paymentData.studentId));
    if (studentDoc.exists()) {
      const studentData = studentDoc.data();
      batch.update(doc(db, 'students', paymentData.studentId), {
        amountPaid: (studentData.amountPaid || 0) - paymentData.amount,
        balance: (studentData.balance || 0) + paymentData.amount,
        updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error reversing payment:', error);
    throw error;
  }
}

// ============================================================================
// MOCK DATA FUNCTIONS (For development)
// ============================================================================

const MOCK_PAYMENTS: PaymentListItem[] = [
  {
    id: 'pay-001',
    receiptNumber: 'RCP-2024-001',
    transactionRef: 'MTN-78392010',
    studentId: 'stu-001',
    studentName: 'Mugisha Ivan Brian',
    studentClass: 'S.4',
    studentStream: 'East',
    amount: 450000,
    channel: 'momo_mtn',
    channelDisplay: 'MTN MoMo',
    status: 'cleared',
    recordedBy: 'Jane Nakamya',
    recordedAt: new Date('2026-01-26T14:45:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...ABC123',
  },
  {
    id: 'pay-002',
    receiptNumber: 'RCP-2024-002',
    transactionRef: 'STANBIC-89201',
    studentId: 'stu-002',
    studentName: 'Namukasa Faith',
    studentClass: 'P.5',
    studentStream: 'Blue',
    amount: 350000,
    channel: 'bank_transfer',
    channelDisplay: 'Bank Transfer',
    status: 'cleared',
    recordedBy: 'Peter Kato',
    recordedAt: new Date('2026-01-26T12:30:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...DEF456',
  },
  {
    id: 'pay-003',
    receiptNumber: 'RCP-2024-003',
    transactionRef: 'CASH-001',
    studentId: 'stu-003',
    studentName: 'Okello David',
    studentClass: 'S.2',
    studentStream: 'West',
    amount: 200000,
    channel: 'cash',
    channelDisplay: 'Cash',
    status: 'pending',
    recordedBy: 'Jane Nakamya',
    recordedAt: new Date('2026-01-26T10:15:00'),
    stellarAnchored: false,
  },
  {
    id: 'pay-004',
    receiptNumber: 'RCP-2024-004',
    transactionRef: 'AIRTEL-45678',
    studentId: 'stu-004',
    studentName: 'Apio Grace',
    studentClass: 'P.3',
    studentStream: 'Red',
    amount: 500000,
    channel: 'momo_airtel',
    channelDisplay: 'Airtel Money',
    status: 'cleared',
    recordedBy: 'Sarah Nambi',
    recordedAt: new Date('2026-01-25T16:20:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...GHI789',
  },
  {
    id: 'pay-005',
    receiptNumber: 'RCP-2024-005',
    transactionRef: 'MTN-99201834',
    studentId: 'stu-005',
    studentName: 'Wasswa Patrick',
    studentClass: 'S.1',
    studentStream: 'East',
    amount: 380000,
    channel: 'momo_mtn',
    channelDisplay: 'MTN MoMo',
    status: 'cleared',
    recordedBy: 'Jane Nakamya',
    recordedAt: new Date('2026-01-25T14:00:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...JKL012',
  },
  {
    id: 'pay-006',
    receiptNumber: 'RCP-2024-006',
    transactionRef: 'CASH-002',
    studentId: 'stu-006',
    studentName: 'Nalubega Christine',
    studentClass: 'P.6',
    studentStream: 'Green',
    amount: 275000,
    channel: 'cash',
    channelDisplay: 'Cash',
    status: 'pending',
    recordedBy: 'Peter Kato',
    recordedAt: new Date('2026-01-25T11:30:00'),
    stellarAnchored: false,
  },
  {
    id: 'pay-007',
    receiptNumber: 'RCP-2024-007',
    transactionRef: 'DFCU-12345',
    studentId: 'stu-007',
    studentName: 'Tumusiime Robert',
    studentClass: 'S.3',
    studentStream: 'West',
    amount: 620000,
    channel: 'bank_transfer',
    channelDisplay: 'Bank Transfer',
    status: 'cleared',
    recordedBy: 'Sarah Nambi',
    recordedAt: new Date('2026-01-24T15:45:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...MNO345',
  },
  {
    id: 'pay-008',
    receiptNumber: 'RCP-2024-008',
    transactionRef: 'AIRTEL-78901',
    studentId: 'stu-008',
    studentName: 'Akello Prossy',
    studentClass: 'P.4',
    studentStream: 'Yellow',
    amount: 150000,
    channel: 'momo_airtel',
    channelDisplay: 'Airtel Money',
    status: 'cleared',
    recordedBy: 'Jane Nakamya',
    recordedAt: new Date('2026-01-24T09:20:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...PQR678',
  },
  {
    id: 'pay-009',
    receiptNumber: 'RCP-2024-009',
    transactionRef: 'MTN-55667788',
    studentId: 'stu-009',
    studentName: 'Kiggundu Moses',
    studentClass: 'S.5',
    studentStream: 'East',
    amount: 750000,
    channel: 'momo_mtn',
    channelDisplay: 'MTN MoMo',
    status: 'cleared',
    recordedBy: 'Peter Kato',
    recordedAt: new Date('2026-01-23T13:10:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...STU901',
  },
  {
    id: 'pay-010',
    receiptNumber: 'RCP-2024-010',
    transactionRef: 'CHEQUE-001',
    studentId: 'stu-010',
    studentName: 'Nabwire Sarah',
    studentClass: 'P.7',
    studentStream: 'Blue',
    amount: 850000,
    channel: 'cheque',
    channelDisplay: 'Cheque',
    status: 'pending',
    recordedBy: 'Sarah Nambi',
    recordedAt: new Date('2026-01-23T10:00:00'),
    stellarAnchored: false,
    notes: 'Post-dated cheque - clears 30th Jan',
  },
  {
    id: 'pay-011',
    receiptNumber: 'RCP-2024-011',
    transactionRef: 'MTN-11223344',
    studentId: 'stu-011',
    studentName: 'Odongo James',
    studentClass: 'S.6',
    studentStream: 'West',
    amount: 920000,
    channel: 'momo_mtn',
    channelDisplay: 'MTN MoMo',
    status: 'cleared',
    recordedBy: 'Jane Nakamya',
    recordedAt: new Date('2026-01-22T16:30:00'),
    stellarAnchored: true,
    stellarTxHash: 'GDQP2KPQG...VWX234',
  },
  {
    id: 'pay-012',
    receiptNumber: 'RCP-2024-012',
    transactionRef: 'CASH-003',
    studentId: 'stu-012',
    studentName: 'Namutebi Josephine',
    studentClass: 'P.2',
    studentStream: 'Red',
    amount: 180000,
    channel: 'cash',
    channelDisplay: 'Cash',
    status: 'reversed',
    recordedBy: 'Peter Kato',
    recordedAt: new Date('2026-01-22T11:00:00'),
    stellarAnchored: false,
    notes: 'Reversed - duplicate entry',
  },
];

const MOCK_ACTIVITIES: PaymentActivity[] = [
  {
    id: 'act-001',
    type: 'payment_recorded',
    description: 'Payment of UGX 450,000 recorded for Mugisha Ivan Brian',
    amount: 450000,
    studentName: 'Mugisha Ivan Brian',
    performedBy: 'Jane Nakamya',
    timestamp: new Date('2026-01-26T14:45:00'),
  },
  {
    id: 'act-002',
    type: 'payment_verified',
    description: 'Payment RCP-2024-002 verified and cleared',
    amount: 350000,
    studentName: 'Namukasa Faith',
    performedBy: 'Admin',
    timestamp: new Date('2026-01-26T13:00:00'),
  },
  {
    id: 'act-003',
    type: 'payment_recorded',
    description: 'Cash payment of UGX 200,000 recorded for Okello David',
    amount: 200000,
    studentName: 'Okello David',
    performedBy: 'Jane Nakamya',
    timestamp: new Date('2026-01-26T10:15:00'),
  },
  {
    id: 'act-004',
    type: 'receipt_uploaded',
    description: 'Receipt uploaded for payment RCP-2024-004',
    performedBy: 'Sarah Nambi',
    timestamp: new Date('2026-01-25T16:45:00'),
  },
  {
    id: 'act-005',
    type: 'payment_reversed',
    description: 'Payment RCP-2024-012 reversed - duplicate entry',
    amount: 180000,
    studentName: 'Namutebi Josephine',
    performedBy: 'Admin',
    timestamp: new Date('2026-01-22T12:00:00'),
  },
];

export function getMockPaymentData(): {
  payments: PaymentListItem[];
  stats: PaymentStats;
  activities: PaymentActivity[];
  channelBreakdown: ChannelBreakdown[];
  collectionTrend: CollectionTrend[];
} {
  const now = new Date();
  const startOfToday = getStartOfDay(now);
  const startOfWeek = getStartOfWeek(now);
  const startOfMonth = getStartOfMonth(now);

  // Calculate stats from mock data
  let todayCollection = 0, todayCount = 0;
  let weekCollection = 0, weekCount = 0;
  let monthCollection = 0, monthCount = 0;
  let pendingCount = 0, clearedCount = 0;
  let totalCollection = 0;

  const channelTotals: Record<PaymentChannel, { amount: number; count: number }> = {
    momo_mtn: { amount: 0, count: 0 },
    momo_airtel: { amount: 0, count: 0 },
    bank_transfer: { amount: 0, count: 0 },
    cash: { amount: 0, count: 0 },
    cheque: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };

  MOCK_PAYMENTS.forEach(payment => {
    if (payment.status !== 'reversed') {
      totalCollection += payment.amount;
      channelTotals[payment.channel].amount += payment.amount;
      channelTotals[payment.channel].count++;

      if (payment.recordedAt >= startOfToday) {
        todayCollection += payment.amount;
        todayCount++;
      }
      if (payment.recordedAt >= startOfWeek) {
        weekCollection += payment.amount;
        weekCount++;
      }
      if (payment.recordedAt >= startOfMonth) {
        monthCollection += payment.amount;
        monthCount++;
      }
    }

    if (payment.status === 'pending') pendingCount++;
    if (payment.status === 'cleared') clearedCount++;
  });

  const validPayments = MOCK_PAYMENTS.filter(p => p.status !== 'reversed');

  // Channel breakdown
  const channelBreakdown: ChannelBreakdown[] = Object.entries(channelTotals)
    .filter(([_, data]) => data.count > 0)
    .map(([channel, data]) => ({
      channel: channel as PaymentChannel,
      label: getChannelDisplayName(channel as PaymentChannel),
      amount: data.amount,
      count: data.count,
      percentage: totalCollection > 0 ? Math.round((data.amount / totalCollection) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Collection trend (last 7 days)
  const collectionTrend: CollectionTrend[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStart = getStartOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayPayments = validPayments.filter(
      p => p.recordedAt >= dayStart && p.recordedAt < dayEnd
    );
    
    collectionTrend.push({
      date: dateStr,
      amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
      count: dayPayments.length,
    });
  }

  return {
    payments: MOCK_PAYMENTS,
    stats: {
      todayCollection,
      todayCount,
      weekCollection,
      weekCount,
      monthCollection,
      monthCount,
      pendingVerification: pendingCount,
      clearedCount,
      totalCollection,
      averagePayment: validPayments.length > 0 ? Math.round(totalCollection / validPayments.length) : 0,
    },
    activities: MOCK_ACTIVITIES,
    channelBreakdown,
    collectionTrend,
  };
}

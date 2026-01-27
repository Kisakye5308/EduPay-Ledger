/**
 * Parent Portal Service
 * Firebase operations for parent-facing features
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ParentAccount,
  ParentStudentFeeOverview,
  ParentPaymentHistoryItem,
  FeeStatement,
  PaymentReceipt,
  ParentAnnouncement,
  ParentDashboardSummary,
  NotificationPreferences,
  formatUGX,
  numberToWords,
  generateReceiptNumber,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../types/parent-portal';

const PARENTS_COLLECTION = 'parent_accounts';
const STUDENTS_COLLECTION = 'students';
const PAYMENTS_COLLECTION = 'payments';
const ANNOUNCEMENTS_COLLECTION = 'announcements';

// ============================================
// PARENT ACCOUNT OPERATIONS
// ============================================

/**
 * Get parent account by ID
 */
export async function getParentAccount(parentId: string): Promise<ParentAccount | null> {
  const docRef = doc(db, PARENTS_COLLECTION, parentId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    lastLogin: data.lastLogin?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as ParentAccount;
}

/**
 * Get parent account by phone number
 */
export async function getParentByPhone(schoolId: string, phone: string): Promise<ParentAccount | null> {
  const q = query(
    collection(db, PARENTS_COLLECTION),
    where('schoolId', '==', schoolId),
    where('phone', '==', phone)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    lastLogin: data.lastLogin?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as ParentAccount;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  parentId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  await updateDoc(doc(db, PARENTS_COLLECTION, parentId), {
    notificationPreferences: preferences,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// FEE OVERVIEW OPERATIONS
// ============================================

/**
 * Get fee overview for a student (parent view)
 */
export async function getParentStudentFeeOverview(
  studentId: string
): Promise<ParentStudentFeeOverview | null> {
  const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
  if (!studentDoc.exists()) return null;
  
  const student = studentDoc.data();
  
  // Get fee breakdown (would come from fee categories collection)
  const feeBreakdown = [
    { category: 'Tuition', amount: student.totalFees * 0.6, paid: student.amountPaid * 0.6, balance: 0 },
    { category: 'Boarding', amount: student.totalFees * 0.25, paid: student.amountPaid * 0.25, balance: 0 },
    { category: 'Development', amount: student.totalFees * 0.1, paid: student.amountPaid * 0.1, balance: 0 },
    { category: 'Other', amount: student.totalFees * 0.05, paid: student.amountPaid * 0.05, balance: 0 },
  ].map(item => ({
    ...item,
    balance: item.amount - item.paid,
  }));

  return {
    studentId: student.id || studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.className,
    residenceType: student.residenceType || 'day_scholar',
    currentTerm: {
      term: student.term || 'Term 1',
      year: student.year || new Date().getFullYear(),
      totalFees: student.totalFees || 0,
      totalPaid: student.amountPaid || 0,
      balance: (student.totalFees || 0) - (student.amountPaid || 0),
      paymentProgress: student.paymentProgress || 0,
    },
    feeBreakdown,
    clearanceStatus: {
      isCleared: student.paymentProgress >= 60,
      clearanceType: student.paymentProgress >= 100 ? 'full' : student.paymentProgress >= 60 ? 'partial' : undefined,
      minimumRequired: student.totalFees * 0.6,
      message: student.paymentProgress >= 60 
        ? 'Cleared for examinations' 
        : `Pay at least ${formatUGX((student.totalFees * 0.6) - student.amountPaid)} to clear`,
    },
    previousBalance: student.carryoverBalance || 0,
    totalOwed: ((student.totalFees || 0) - (student.amountPaid || 0)) + (student.carryoverBalance || 0),
  };
}

/**
 * Get payment history for parent view
 */
export async function getParentPaymentHistory(
  studentIds: string[],
  limitCount: number = 20
): Promise<ParentPaymentHistoryItem[]> {
  if (studentIds.length === 0) return [];

  const q = query(
    collection(db, PAYMENTS_COLLECTION),
    where('studentId', 'in', studentIds),
    orderBy('date', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date?.toDate() || new Date(),
      amount: data.amount,
      method: data.method,
      reference: data.reference || '',
      studentName: data.studentName || '',
      status: data.status || 'completed',
      receiptNumber: data.receiptNumber,
    } as ParentPaymentHistoryItem;
  });
}

// ============================================
// FEE STATEMENT GENERATION
// ============================================

/**
 * Generate fee statement for a student
 */
export async function generateFeeStatement(
  studentId: string,
  schoolInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  }
): Promise<FeeStatement> {
  const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
  if (!studentDoc.exists()) {
    throw new Error('Student not found');
  }
  
  const student = studentDoc.data();
  
  // Get payments
  const paymentsQuery = query(
    collection(db, PAYMENTS_COLLECTION),
    where('studentId', '==', studentId),
    orderBy('date', 'desc')
  );
  const paymentsSnapshot = await getDocs(paymentsQuery);
  const payments = paymentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      date: data.date?.toDate() || new Date(),
      amount: data.amount,
      reference: data.reference || '',
      method: data.method || 'cash',
    };
  });

  // Build fee items (would come from fee structure)
  const feeItems = [
    { description: 'Tuition Fee', amount: student.totalFees * 0.6 },
    { description: 'Boarding Fee', amount: student.residenceType === 'boarder' ? student.totalFees * 0.25 : 0 },
    { description: 'Development Levy', amount: student.totalFees * 0.1 },
    { description: 'Examination Fee', amount: student.totalFees * 0.03 },
    { description: 'Computer Lab', amount: student.totalFees * 0.02 },
  ].filter(item => item.amount > 0);

  const totalFees = feeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const previousBalance = student.carryoverBalance || 0;

  return {
    id: `stmt_${Date.now()}`,
    generatedAt: new Date(),
    schoolName: schoolInfo.name,
    schoolAddress: schoolInfo.address,
    schoolPhone: schoolInfo.phone,
    schoolEmail: schoolInfo.email,
    schoolLogo: schoolInfo.logo,
    studentId: student.studentId || studentId,
    studentName: `${student.firstName} ${student.lastName}`,
    className: student.className,
    admissionNumber: student.studentId || '',
    guardianName: student.guardian?.name || '',
    guardianPhone: student.guardian?.phone || '',
    term: student.term || 'Term 1',
    year: student.year || new Date().getFullYear(),
    feeItems,
    totalFees,
    payments,
    totalPaid,
    previousBalance,
    totalOwed: totalFees + previousBalance,
    currentBalance: (totalFees + previousBalance) - totalPaid,
  };
}

// ============================================
// RECEIPT GENERATION
// ============================================

/**
 * Generate payment receipt
 */
export async function generatePaymentReceipt(
  paymentId: string,
  schoolInfo: {
    name: string;
    address: string;
    phone: string;
    code: string;
  }
): Promise<PaymentReceipt> {
  const paymentDoc = await getDoc(doc(db, PAYMENTS_COLLECTION, paymentId));
  if (!paymentDoc.exists()) {
    throw new Error('Payment not found');
  }
  
  const payment = paymentDoc.data();
  
  // Get student info
  const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, payment.studentId));
  const student = studentDoc.exists() ? studentDoc.data() : {};

  // Calculate balance after payment
  const previousBalance = (student.totalFees || 0) - ((student.amountPaid || 0) - payment.amount);
  const balanceAfter = previousBalance - payment.amount;

  // Default allocations if not specified
  const allocations = payment.allocations || [
    { category: 'School Fees', amount: payment.amount },
  ];

  return {
    receiptNumber: payment.receiptNumber || generateReceiptNumber(
      schoolInfo.code, 
      new Date().getFullYear()
    ),
    generatedAt: new Date(),
    schoolName: schoolInfo.name,
    schoolAddress: schoolInfo.address,
    schoolPhone: schoolInfo.phone,
    studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || payment.studentName,
    className: student.className || '',
    admissionNumber: student.studentId || '',
    amount: payment.amount,
    amountInWords: numberToWords(payment.amount),
    paymentDate: payment.date?.toDate() || new Date(),
    paymentMethod: payment.method || 'cash',
    reference: payment.reference || '',
    allocations,
    previousBalance,
    balanceAfter: Math.max(0, balanceAfter),
    receivedBy: payment.recordedBy || 'Bursar',
  };
}

// ============================================
// ANNOUNCEMENTS
// ============================================

/**
 * Get announcements for parent
 */
export async function getParentAnnouncements(
  schoolId: string,
  studentClasses: string[],
  studentResidenceTypes: string[]
): Promise<ParentAnnouncement[]> {
  const now = new Date();
  
  const q = query(
    collection(db, ANNOUNCEMENTS_COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('publishedAt', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        publishedAt: data.publishedAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate(),
      } as ParentAnnouncement;
    })
    .filter(announcement => {
      // Filter out expired
      if (announcement.expiresAt && announcement.expiresAt < now) {
        return false;
      }
      
      // Filter by target class if specified
      if (announcement.targetClasses && announcement.targetClasses.length > 0) {
        if (!studentClasses.some(c => announcement.targetClasses!.includes(c))) {
          return false;
        }
      }
      
      // Filter by residence type if specified
      if (announcement.targetResidenceTypes && announcement.targetResidenceTypes.length > 0) {
        if (!studentResidenceTypes.some(r => announcement.targetResidenceTypes!.includes(r as any))) {
          return false;
        }
      }
      
      return true;
    });
}

// ============================================
// DASHBOARD SUMMARY
// ============================================

/**
 * Get parent dashboard summary
 */
export async function getParentDashboardSummary(
  parentId: string
): Promise<ParentDashboardSummary> {
  const parent = await getParentAccount(parentId);
  if (!parent) {
    throw new Error('Parent account not found');
  }

  // Get children overviews
  const children: ParentDashboardSummary['children'] = [];
  for (const studentId of parent.studentIds) {
    const overview = await getParentStudentFeeOverview(studentId);
    if (overview) {
      children.push({
        id: overview.studentId,
        name: overview.studentName,
        className: overview.className,
        balance: overview.currentTerm.balance,
        paymentProgress: overview.currentTerm.paymentProgress,
        isCleared: overview.clearanceStatus.isCleared,
        nextDue: overview.nextDueDate 
          ? { amount: overview.nextDueAmount || 0, date: overview.nextDueDate }
          : undefined,
      });
    }
  }

  // Get recent payments
  const payments = await getParentPaymentHistory(parent.studentIds, 5);
  const recentPayments = payments.map(p => ({
    id: p.id,
    date: p.date,
    amount: p.amount,
    studentName: p.studentName,
  }));

  // Calculate totals
  const totalBalance = children.reduce((sum, c) => sum + c.balance, 0);
  const totalPaidThisTerm = children.reduce((sum, c) => {
    // Approximate - would need more data
    return sum + (c.paymentProgress / 100) * (c.balance + c.balance / (1 - c.paymentProgress / 100 || 1));
  }, 0);

  return {
    children,
    totalChildren: children.length,
    totalBalance,
    totalPaidThisTerm: Math.round(totalPaidThisTerm),
    recentPayments,
    activePromises: [],  // Would come from promises service
    unreadAnnouncements: 0,  // Would track read status
  };
}

// ============================================
// MOCK DATA
// ============================================

export function getMockParentAccount(): ParentAccount {
  return {
    id: 'parent_1',
    schoolId: 'school_1',
    firstName: 'Grace',
    lastName: 'Nakamya',
    email: 'grace.nakamya@email.com',
    phone: '+256772123456',
    authUserId: 'auth_123',
    lastLogin: new Date(),
    isActive: true,
    isVerified: true,
    studentIds: ['student_1', 'student_2'],
    preferredLanguage: 'en',
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date(),
  };
}

export function getMockParentDashboard(): ParentDashboardSummary {
  return {
    children: [
      {
        id: 'student_1',
        name: 'Sarah Nakamya',
        className: 'S.3',
        balance: 450000,
        paymentProgress: 65,
        isCleared: true,
        nextDue: { amount: 200000, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      {
        id: 'student_2',
        name: 'James Nakamya',
        className: 'S.1',
        balance: 680000,
        paymentProgress: 45,
        isCleared: false,
      },
    ],
    totalChildren: 2,
    totalBalance: 1130000,
    totalPaidThisTerm: 850000,
    recentPayments: [
      { id: 'pay_1', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), amount: 200000, studentName: 'Sarah Nakamya' },
      { id: 'pay_2', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), amount: 350000, studentName: 'James Nakamya' },
    ],
    activePromises: [
      {
        id: 'promise_1',
        studentName: 'Sarah Nakamya',
        amount: 250000,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'pending',
      },
    ],
    unreadAnnouncements: 2,
  };
}

export function getMockAnnouncements(): ParentAnnouncement[] {
  return [
    {
      id: 'ann_1',
      schoolId: 'school_1',
      title: 'Term 2 Fee Payment Deadline',
      content: 'All fee balances must be cleared by 15th May 2024 for students to sit for end of term examinations.',
      type: 'deadline',
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      priority: 'high',
      createdBy: 'admin',
    },
    {
      id: 'ann_2',
      schoolId: 'school_1',
      title: 'Mobile Money Payment Now Available',
      content: 'You can now pay school fees directly using MTN Mobile Money and Airtel Money. Use the Pay Now button in the app.',
      type: 'general',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      createdBy: 'admin',
    },
  ];
}

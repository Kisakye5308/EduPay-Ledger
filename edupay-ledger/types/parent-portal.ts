/**
 * Parent Portal Types
 * Types for parent-facing features and fee visibility
 */

import { ResidenceType } from './residence';

/**
 * Parent/Guardian account
 */
export interface ParentAccount {
  id: string;
  schoolId: string;
  
  // Personal info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId?: string;
  
  // Authentication
  authUserId?: string;    // Firebase Auth UID
  lastLogin?: Date;
  isActive: boolean;
  isVerified: boolean;
  
  // Linked students
  studentIds: string[];
  
  // Preferences
  preferredLanguage: 'en' | 'sw';  // English or Swahili
  notificationPreferences: NotificationPreferences;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  paymentReminders: boolean;
  paymentConfirmations: boolean;
  feeUpdates: boolean;
  examClearanceAlerts: boolean;
  generalAnnouncements: boolean;
  preferredChannel: 'sms' | 'whatsapp' | 'email' | 'all';
}

/**
 * Student fee overview for parent view
 */
export interface ParentStudentFeeOverview {
  studentId: string;
  studentName: string;
  className: string;
  residenceType: ResidenceType;
  
  // Current term fees
  currentTerm: {
    term: string;
    year: number;
    totalFees: number;
    totalPaid: number;
    balance: number;
    paymentProgress: number;
  };
  
  // Fee breakdown
  feeBreakdown: Array<{
    category: string;
    amount: number;
    paid: number;
    balance: number;
    dueDate?: Date;
  }>;
  
  // Status
  clearanceStatus: {
    isCleared: boolean;
    clearanceType?: string;
    minimumRequired?: number;
    message?: string;
  };
  
  // Carryover from previous terms
  previousBalance: number;
  totalOwed: number;  // Current + Previous
  
  // Next payment info
  nextDueDate?: Date;
  nextDueAmount?: number;
  
  // Active promises
  activePromise?: {
    id: string;
    amount: number;
    dueDate: Date;
    status: string;
  };
}

/**
 * Payment history item for parent view
 */
export interface ParentPaymentHistoryItem {
  id: string;
  date: Date;
  amount: number;
  method: string;
  reference: string;
  studentName: string;
  status: 'completed' | 'pending' | 'failed';
  
  // Receipt
  receiptNumber?: string;
  receiptUrl?: string;
  
  // Breakdown (if applicable)
  allocations?: Array<{
    category: string;
    amount: number;
  }>;
}

/**
 * Fee statement for printing/download
 */
export interface FeeStatement {
  id: string;
  generatedAt: Date;
  
  // School info
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo?: string;
  
  // Student info
  studentId: string;
  studentName: string;
  className: string;
  admissionNumber: string;
  
  // Guardian info
  guardianName: string;
  guardianPhone: string;
  
  // Period
  term: string;
  year: number;
  
  // Fee structure
  feeItems: Array<{
    description: string;
    amount: number;
  }>;
  totalFees: number;
  
  // Payments
  payments: Array<{
    date: Date;
    amount: number;
    reference: string;
    method: string;
  }>;
  totalPaid: number;
  
  // Carryover
  previousBalance: number;
  
  // Summary
  totalOwed: number;
  currentBalance: number;
  
  // Notes
  notes?: string;
}

/**
 * Payment receipt
 */
export interface PaymentReceipt {
  receiptNumber: string;
  generatedAt: Date;
  
  // School info
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  
  // Student info
  studentName: string;
  className: string;
  admissionNumber: string;
  
  // Payment details
  amount: number;
  amountInWords: string;
  paymentDate: Date;
  paymentMethod: string;
  reference: string;
  
  // Allocations
  allocations: Array<{
    category: string;
    amount: number;
  }>;
  
  // Balance after payment
  previousBalance: number;
  balanceAfter: number;
  
  // Received by
  receivedBy: string;
}

/**
 * Announcement for parents
 */
export interface ParentAnnouncement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  type: 'general' | 'fee_reminder' | 'deadline' | 'event' | 'urgent';
  targetClasses?: string[];  // Empty = all classes
  targetResidenceTypes?: ResidenceType[];  // Empty = all types
  publishedAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high';
  isRead?: boolean;
  createdBy: string;
}

/**
 * Parent dashboard summary
 */
export interface ParentDashboardSummary {
  // Children overview
  children: Array<{
    id: string;
    name: string;
    className: string;
    balance: number;
    paymentProgress: number;
    isCleared: boolean;
    nextDue?: { amount: number; date: Date };
  }>;
  
  // Totals
  totalChildren: number;
  totalBalance: number;
  totalPaidThisTerm: number;
  
  // Recent payments
  recentPayments: Array<{
    id: string;
    date: Date;
    amount: number;
    studentName: string;
  }>;
  
  // Active promises
  activePromises: Array<{
    id: string;
    studentName: string;
    amount: number;
    dueDate: Date;
    status: string;
  }>;
  
  // Unread announcements
  unreadAnnouncements: number;
}

/**
 * Quick pay request (for mobile money, etc.)
 */
export interface QuickPayRequest {
  studentId: string;
  amount: number;
  phoneNumber: string;
  provider: 'mtn' | 'airtel' | 'bank';
  reference?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency in Ugandan format
 */
export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString('en-UG')}`;
}

/**
 * Convert number to words (for receipts)
 */
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';
  
  const convertHundreds = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  };

  let result = '';
  
  if (num >= 1000000) {
    result += convertHundreds(Math.floor(num / 1000000)) + 'Million ';
    num %= 1000000;
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertHundreds(num);
  }

  return result.trim() + ' Uganda Shillings Only';
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: string): string {
  const methods: Record<string, string> = {
    cash: 'Cash',
    mtn_mobile: 'MTN Mobile Money',
    airtel_money: 'Airtel Money',
    bank_transfer: 'Bank Transfer',
    bank_deposit: 'Bank Deposit',
    cheque: 'Cheque',
    other: 'Other',
  };
  return methods[method] || method;
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(schoolCode: string, year: number): string {
  const sequence = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${schoolCode}/${year}/${sequence}`;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  paymentReminders: true,
  paymentConfirmations: true,
  feeUpdates: true,
  examClearanceAlerts: true,
  generalAnnouncements: true,
  preferredChannel: 'sms',
};

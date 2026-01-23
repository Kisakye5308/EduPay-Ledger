import { Timestamp } from 'firebase/firestore';

export interface Payment {
  id: string;
  receiptNumber: string; // e.g., "RCP-9021"
  transactionRef: string; // External reference ID/slip number
  
  // Student Info (denormalized for quick access)
  studentId: string;
  studentName: string;
  studentClass: string;
  studentStream?: string;
  
  // School Info
  schoolId: string;
  
  // Payment Details
  amount: number;
  currency: 'UGX';
  channel: PaymentChannel;
  channelDetails?: string; // e.g., "MTN MoMo", "Stanbic Bank"
  
  // Installment Info
  installmentId: string;
  installmentName: string;
  
  // Status
  status: PaymentRecordStatus;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  
  // Receipt
  receiptUrl?: string;
  receiptUploaded?: boolean;
  
  // Stellar Audit
  stellarTxHash?: string;
  stellarTimestamp?: Timestamp;
  stellarAnchored: boolean;
  
  // Metadata
  recordedBy: string;
  recordedAt: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PaymentChannel = 
  | 'momo_mtn'
  | 'momo_airtel'
  | 'bank_transfer'
  | 'cash'
  | 'cheque'
  | 'other';

export type PaymentRecordStatus = 
  | 'pending'     // Just recorded, not yet verified
  | 'cleared'     // Verified and cleared
  | 'reversed'    // Payment was reversed
  | 'failed';     // Payment failed

export interface PaymentRecordInput {
  studentId: string;
  amount: number;
  channel: PaymentChannel;
  transactionRef: string;
  installmentId: string;
  receiptFile?: File;
  notes?: string;
}

export interface PaymentSummary {
  totalCollected: number;
  totalOutstanding: number;
  collectionTarget: number;
  collectionProgress: number;
  overdue30Days: number;
  paymentsToday: number;
  paymentsThisWeek: number;
  paymentsThisMonth: number;
}

export interface RecentPayment {
  id: string;
  studentName: string;
  studentClass: string;
  amount: number;
  channel: PaymentChannel;
  timestamp: Timestamp;
}

export function getChannelDisplayName(channel: PaymentChannel): string {
  const names: Record<PaymentChannel, string> = {
    momo_mtn: 'MTN MoMo',
    momo_airtel: 'Airtel Money',
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    cheque: 'Cheque',
    other: 'Other',
  };
  return names[channel];
}

export function getChannelIcon(channel: PaymentChannel): string {
  const icons: Record<PaymentChannel, string> = {
    momo_mtn: 'smartphone',
    momo_airtel: 'smartphone',
    bank_transfer: 'account_balance',
    cash: 'payments',
    cheque: 'description',
    other: 'receipt',
  };
  return icons[channel];
}

export function formatCurrency(amount: number, currency: string = 'UGX'): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
}

/**
 * Reports Service
 * Handles all report generation and audit trail operations
 * Ready for Firebase/Stellar integration
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

export type AuditActionType = 
  | 'payment_recorded'
  | 'payment_verified'
  | 'payment_reversed'
  | 'student_enrolled'
  | 'student_updated'
  | 'fee_updated'
  | 'rule_created'
  | 'rule_updated'
  | 'report_generated'
  | 'user_login'
  | 'system_event';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: AuditActionType;
  actor: string;
  actorRole: string;
  studentId?: string;
  studentName?: string;
  amount?: number;
  stellarTxHash?: string;
  stellarStatus: 'anchored' | 'pending' | 'failed' | null;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export interface ReportStats {
  // Collection stats
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  
  // Student stats
  totalStudents: number;
  fullyPaidCount: number;
  partialPaidCount: number;
  noPaidCount: number;
  overdueCount: number;
  
  // Payment stats
  averagePayment: number;
  totalPayments: number;
  paymentsThisMonth: number;
  
  // Comparison
  collectedVsLastMonth: number;
  studentsVsLastTerm: number;
}

export interface ClassCollectionData {
  className: string;
  totalStudents: number;
  totalExpected: number;
  totalCollected: number;
  collectionRate: number;
  fullyPaid: number;
  partial: number;
  noPaid: number;
}

export interface MonthlyTrendData {
  month: string;
  monthLabel: string;
  collected: number;
  expected: number;
  rate: number;
}

export interface PaymentChannelData {
  channel: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface StellarAuditStats {
  totalAnchored: number;
  pendingAnchor: number;
  failedAnchor: number;
  lastSyncTime: Date;
  networkStatus: 'connected' | 'disconnected' | 'syncing';
  walletAddress: string;
}

export interface ReportFilters {
  dateFrom: Date | null;
  dateTo: Date | null;
  actionType: string;
  search: string;
  term: string;
  className: string;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'collection_summary' | 'audit_trail' | 'class_report' | 'student_ledger' | 'bank_reconciliation';
  generatedAt: Date;
  generatedBy: string;
  dateRange: { from: Date; to: Date };
  format: 'pdf' | 'excel' | 'csv';
  fileUrl?: string;
  status: 'generating' | 'ready' | 'failed';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getActionConfig(action: AuditActionType): { label: string; icon: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'primary' } {
  const config: Record<AuditActionType, { label: string; icon: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
    payment_recorded: { label: 'Payment Recorded', icon: 'add_card', variant: 'success' },
    payment_verified: { label: 'Payment Verified', icon: 'verified', variant: 'success' },
    payment_reversed: { label: 'Payment Reversed', icon: 'undo', variant: 'danger' },
    student_enrolled: { label: 'Student Enrolled', icon: 'person_add', variant: 'info' },
    student_updated: { label: 'Student Updated', icon: 'edit', variant: 'info' },
    fee_updated: { label: 'Fee Updated', icon: 'price_change', variant: 'warning' },
    rule_created: { label: 'Rule Created', icon: 'add_circle', variant: 'primary' },
    rule_updated: { label: 'Rule Updated', icon: 'edit', variant: 'primary' },
    report_generated: { label: 'Report Generated', icon: 'description', variant: 'info' },
    user_login: { label: 'User Login', icon: 'login', variant: 'info' },
    system_event: { label: 'System Event', icon: 'settings', variant: 'warning' },
  };
  return config[action] || { label: action, icon: 'info', variant: 'info' };
}

export { getActionConfig };

// ============================================================================
// FIREBASE FUNCTIONS (Ready for integration)
// ============================================================================

export async function getAuditLogs(
  schoolId: string,
  filters: ReportFilters,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ logs: AuditLogEntry[]; lastDoc: DocumentSnapshot | null; total: number }> {
  try {
    let q = query(
      collection(db, 'auditLogs'),
      where('schoolId', '==', schoolId),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    if (filters.actionType && filters.actionType !== 'all') {
      q = query(q, where('action', '==', filters.actionType));
    }

    if (filters.dateFrom) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.dateFrom)));
    }

    if (filters.dateTo) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: data.timestamp.toDate(),
        action: data.action,
        actor: data.actor,
        actorRole: data.actorRole,
        studentId: data.studentId,
        studentName: data.studentName,
        amount: data.amount,
        stellarTxHash: data.stellarTxHash,
        stellarStatus: data.stellarStatus,
        details: data.details,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
      });
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    return { logs, lastDoc: lastVisible, total: snapshot.size };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

export async function getReportStats(schoolId: string, termId?: string): Promise<ReportStats> {
  // In production, this would aggregate data from Firebase
  throw new Error('Firebase integration not yet implemented');
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: new Date('2026-01-26T14:32:00'),
    action: 'payment_recorded',
    actor: 'Jane Nakamya',
    actorRole: 'Bursar',
    studentId: 'EDU-2023-045-KC',
    studentName: 'Mugisha Ivan Brian',
    amount: 450000,
    stellarTxHash: 'GDQP2KPQGVL...ABC123XYZ789',
    stellarStatus: 'anchored',
    details: 'MTN MoMo payment recorded for Term 1 fees',
  },
  {
    id: 'log-002',
    timestamp: new Date('2026-01-26T12:15:00'),
    action: 'payment_verified',
    actor: 'Admin System',
    actorRole: 'System',
    studentId: 'EDU-2023-067-AB',
    studentName: 'Namukasa Faith',
    amount: 350000,
    stellarTxHash: 'GDQP2KPQGVL...DEF456UVW012',
    stellarStatus: 'anchored',
    details: 'Bank transfer payment verified and cleared',
  },
  {
    id: 'log-003',
    timestamp: new Date('2026-01-26T10:45:00'),
    action: 'student_enrolled',
    actor: 'Peter Kato',
    actorRole: 'Registrar',
    studentId: 'EDU-2026-112-MW',
    studentName: 'Apio Grace Mary',
    stellarStatus: null,
    details: 'New student enrolled to S.1 East Wing',
  },
  {
    id: 'log-004',
    timestamp: new Date('2026-01-25T16:20:00'),
    action: 'payment_reversed',
    actor: 'Sarah Nambi',
    actorRole: 'Bursar',
    studentId: 'EDU-2022-089-JK',
    studentName: 'Okello David',
    amount: 100000,
    stellarTxHash: 'GDQP2KPQGVL...REV789QRS345',
    stellarStatus: 'anchored',
    details: 'Duplicate payment reversal - refunded to parent',
  },
  {
    id: 'log-005',
    timestamp: new Date('2026-01-25T14:00:00'),
    action: 'fee_updated',
    actor: 'Admin',
    actorRole: 'Administrator',
    stellarStatus: null,
    details: 'Term 1 2026 fees updated for Senior classes - 5% increase',
  },
  {
    id: 'log-006',
    timestamp: new Date('2026-01-25T11:30:00'),
    action: 'payment_recorded',
    actor: 'Jane Nakamya',
    actorRole: 'Bursar',
    studentId: 'EDU-2024-078-LM',
    studentName: 'Wasswa Patrick',
    amount: 380000,
    stellarTxHash: 'GDQP2KPQGVL...GHI123JKL456',
    stellarStatus: 'anchored',
    details: 'Cash payment recorded for Term 1 fees',
  },
  {
    id: 'log-007',
    timestamp: new Date('2026-01-24T15:45:00'),
    action: 'rule_created',
    actor: 'Admin',
    actorRole: 'Administrator',
    stellarStatus: null,
    details: 'New installment rule created: 3-Part Flexible Plan for Senior classes',
  },
  {
    id: 'log-008',
    timestamp: new Date('2026-01-24T10:20:00'),
    action: 'payment_recorded',
    actor: 'Peter Kato',
    actorRole: 'Cashier',
    studentId: 'EDU-2023-156-NP',
    studentName: 'Nalubega Christine',
    amount: 275000,
    stellarTxHash: 'GDQP2KPQGVL...MNO789PQR012',
    stellarStatus: 'pending',
    details: 'Airtel Money payment recorded - awaiting confirmation',
  },
  {
    id: 'log-009',
    timestamp: new Date('2026-01-24T09:00:00'),
    action: 'report_generated',
    actor: 'Sarah Nambi',
    actorRole: 'Bursar',
    stellarStatus: null,
    details: 'Weekly collection summary report generated and exported to PDF',
  },
  {
    id: 'log-010',
    timestamp: new Date('2026-01-23T16:30:00'),
    action: 'payment_recorded',
    actor: 'Jane Nakamya',
    actorRole: 'Bursar',
    studentId: 'EDU-2022-201-ST',
    studentName: 'Tumusiime Robert',
    amount: 620000,
    stellarTxHash: 'GDQP2KPQGVL...STU345VWX678',
    stellarStatus: 'anchored',
    details: 'Bank transfer payment recorded for full term fees',
  },
  {
    id: 'log-011',
    timestamp: new Date('2026-01-23T14:15:00'),
    action: 'student_updated',
    actor: 'Peter Kato',
    actorRole: 'Registrar',
    studentId: 'EDU-2023-045-KC',
    studentName: 'Mugisha Ivan Brian',
    stellarStatus: null,
    details: 'Student class updated from S.3 to S.4 East',
  },
  {
    id: 'log-012',
    timestamp: new Date('2026-01-23T11:00:00'),
    action: 'payment_recorded',
    actor: 'Sarah Nambi',
    actorRole: 'Bursar',
    studentId: 'EDU-2024-089-YZ',
    studentName: 'Kiggundu Moses',
    amount: 750000,
    stellarTxHash: 'GDQP2KPQGVL...YZA012BCD345',
    stellarStatus: 'anchored',
    details: 'MTN MoMo payment recorded for S.5 boarding fees',
  },
  {
    id: 'log-013',
    timestamp: new Date('2026-01-22T15:00:00'),
    action: 'user_login',
    actor: 'Jane Nakamya',
    actorRole: 'Bursar',
    stellarStatus: null,
    details: 'User logged in from IP 192.168.1.45',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'log-014',
    timestamp: new Date('2026-01-22T10:30:00'),
    action: 'payment_verified',
    actor: 'Admin System',
    actorRole: 'System',
    studentId: 'EDU-2023-156-NP',
    studentName: 'Nabwire Sarah',
    amount: 850000,
    stellarTxHash: 'GDQP2KPQGVL...EFG678HIJ901',
    stellarStatus: 'anchored',
    details: 'Post-dated cheque cleared and payment verified',
  },
  {
    id: 'log-015',
    timestamp: new Date('2026-01-22T09:00:00'),
    action: 'system_event',
    actor: 'System',
    actorRole: 'System',
    stellarStatus: null,
    details: 'Automatic backup completed - 1,247 records archived',
  },
];

const MOCK_CLASS_COLLECTION: ClassCollectionData[] = [
  { className: 'P.1', totalStudents: 45, totalExpected: 27000000, totalCollected: 21600000, collectionRate: 80, fullyPaid: 28, partial: 12, noPaid: 5 },
  { className: 'P.2', totalStudents: 42, totalExpected: 25200000, totalCollected: 18900000, collectionRate: 75, fullyPaid: 24, partial: 13, noPaid: 5 },
  { className: 'P.3', totalStudents: 48, totalExpected: 28800000, totalCollected: 23040000, collectionRate: 80, fullyPaid: 30, partial: 14, noPaid: 4 },
  { className: 'P.4', totalStudents: 40, totalExpected: 28000000, totalCollected: 19600000, collectionRate: 70, fullyPaid: 20, partial: 15, noPaid: 5 },
  { className: 'P.5', totalStudents: 38, totalExpected: 30400000, totalCollected: 21280000, collectionRate: 70, fullyPaid: 19, partial: 14, noPaid: 5 },
  { className: 'P.6', totalStudents: 35, totalExpected: 31500000, totalCollected: 25200000, collectionRate: 80, fullyPaid: 21, partial: 11, noPaid: 3 },
  { className: 'P.7', totalStudents: 32, totalExpected: 32000000, totalCollected: 27200000, collectionRate: 85, fullyPaid: 22, partial: 8, noPaid: 2 },
  { className: 'S.1', totalStudents: 56, totalExpected: 67200000, totalCollected: 47040000, collectionRate: 70, fullyPaid: 28, partial: 20, noPaid: 8 },
  { className: 'S.2', totalStudents: 52, totalExpected: 62400000, totalCollected: 46800000, collectionRate: 75, fullyPaid: 30, partial: 18, noPaid: 4 },
  { className: 'S.3', totalStudents: 48, totalExpected: 62400000, totalCollected: 49920000, collectionRate: 80, fullyPaid: 32, partial: 14, noPaid: 2 },
  { className: 'S.4', totalStudents: 44, totalExpected: 66000000, totalCollected: 52800000, collectionRate: 80, fullyPaid: 30, partial: 12, noPaid: 2 },
];

const MOCK_MONTHLY_TREND: MonthlyTrendData[] = [
  { month: '2025-08', monthLabel: 'Aug', collected: 15600000, expected: 28000000, rate: 56 },
  { month: '2025-09', monthLabel: 'Sep', collected: 42300000, expected: 56000000, rate: 76 },
  { month: '2025-10', monthLabel: 'Oct', collected: 28900000, expected: 35000000, rate: 83 },
  { month: '2025-11', monthLabel: 'Nov', collected: 18700000, expected: 25000000, rate: 75 },
  { month: '2025-12', monthLabel: 'Dec', collected: 8500000, expected: 15000000, rate: 57 },
  { month: '2026-01', monthLabel: 'Jan', collected: 45670000, expected: 78500000, rate: 58 },
];

const MOCK_CHANNEL_DATA: PaymentChannelData[] = [
  { channel: 'momo_mtn', label: 'MTN MoMo', amount: 187500000, count: 456, percentage: 42 },
  { channel: 'bank_transfer', label: 'Bank Transfer', amount: 134000000, count: 178, percentage: 30 },
  { channel: 'cash', label: 'Cash', amount: 89300000, count: 312, percentage: 20 },
  { channel: 'momo_airtel', label: 'Airtel Money', amount: 26800000, count: 89, percentage: 6 },
  { channel: 'cheque', label: 'Cheque', amount: 8900000, count: 12, percentage: 2 },
];

export function getMockReportData(): {
  stats: ReportStats;
  auditLogs: AuditLogEntry[];
  classCollection: ClassCollectionData[];
  monthlyTrend: MonthlyTrendData[];
  channelBreakdown: PaymentChannelData[];
  stellarStats: StellarAuditStats;
  recentReports: GeneratedReport[];
} {
  const stats: ReportStats = {
    totalExpected: 446500000,
    totalCollected: 353380000,
    totalOutstanding: 93120000,
    collectionRate: 79,
    totalStudents: 480,
    fullyPaidCount: 284,
    partialPaidCount: 151,
    noPaidCount: 45,
    overdueCount: 67,
    averagePayment: 338500,
    totalPayments: 1047,
    paymentsThisMonth: 156,
    collectedVsLastMonth: 12,
    studentsVsLastTerm: 8,
  };

  const stellarStats: StellarAuditStats = {
    totalAnchored: 1247,
    pendingAnchor: 3,
    failedAnchor: 0,
    lastSyncTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    networkStatus: 'connected',
    walletAddress: 'GDQP2KPQGVL...XYZ789',
  };

  const recentReports: GeneratedReport[] = [
    {
      id: 'rpt-001',
      name: 'Weekly Collection Summary',
      type: 'collection_summary',
      generatedAt: new Date('2026-01-25T16:00:00'),
      generatedBy: 'Sarah Nambi',
      dateRange: { from: new Date('2026-01-19'), to: new Date('2026-01-25') },
      format: 'pdf',
      status: 'ready',
    },
    {
      id: 'rpt-002',
      name: 'January Audit Trail',
      type: 'audit_trail',
      generatedAt: new Date('2026-01-24T10:30:00'),
      generatedBy: 'Admin',
      dateRange: { from: new Date('2026-01-01'), to: new Date('2026-01-24') },
      format: 'excel',
      status: 'ready',
    },
    {
      id: 'rpt-003',
      name: 'S.4 Class Report',
      type: 'class_report',
      generatedAt: new Date('2026-01-23T14:00:00'),
      generatedBy: 'Jane Nakamya',
      dateRange: { from: new Date('2026-01-01'), to: new Date('2026-01-23') },
      format: 'pdf',
      status: 'ready',
    },
  ];

  return {
    stats,
    auditLogs: MOCK_AUDIT_LOGS,
    classCollection: MOCK_CLASS_COLLECTION,
    monthlyTrend: MOCK_MONTHLY_TREND,
    channelBreakdown: MOCK_CHANNEL_DATA,
    stellarStats,
    recentReports,
  };
}

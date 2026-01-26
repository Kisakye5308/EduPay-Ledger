/**
 * Settings Service
 * Handles all system settings, configurations, and preferences
 * Ready for Firebase integration
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolInfo {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'both';
  address: string;
  district: string;
  phone: string;
  email: string;
  website?: string;
  motto?: string;
  logo?: string;
  registrationNumber?: string;
  foundedYear?: number;
  principalName?: string;
  principalPhone?: string;
}

export interface AcademicTerm {
  id: string;
  name: string;
  year: number;
  termNumber: 1 | 2 | 3;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface ClassConfig {
  id: string;
  name: string;
  shortName: string;
  level: 'primary' | 'secondary';
  order: number;
  streams: StreamConfig[];
  isActive: boolean;
}

export interface StreamConfig {
  id: string;
  name: string;
  shortName: string;
  capacity: number;
}

export interface FeeTemplate {
  id: string;
  name: string;
  classId: string;
  className: string;
  term: string;
  year: number;
  components: FeeComponent[];
  totalAmount: number;
  isActive: boolean;
}

export interface FeeComponent {
  id: string;
  name: string;
  amount: number;
  isOptional: boolean;
  category: 'tuition' | 'boarding' | 'activity' | 'material' | 'other';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'bursar' | 'registrar' | 'teacher' | 'viewer';
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  permissions: string[];
}

export interface SMSConfig {
  provider: 'africas_talking' | 'twilio' | 'nexmo' | 'custom';
  apiKey: string;
  apiSecret?: string;
  senderId: string;
  isEnabled: boolean;
  templates: SMSTemplate[];
  balance?: number;
  lastSync?: Date;
}

export interface SMSTemplate {
  id: string;
  name: string;
  event: 'payment_received' | 'payment_reminder' | 'arrears_alert' | 'welcome' | 'custom';
  content: string;
  isActive: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  provider: 'mtn_momo' | 'airtel_money' | 'bank_transfer' | 'cash' | 'cheque';
  isEnabled: boolean;
  config: Record<string, any>;
  lastSync?: Date;
  status: 'connected' | 'disconnected' | 'error';
}

export interface StellarConfig {
  network: 'testnet' | 'mainnet';
  publicKey: string;
  isEnabled: boolean;
  lastAnchorTime?: Date;
  totalAnchored: number;
  pendingAnchor: number;
  status: 'connected' | 'disconnected' | 'syncing';
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  lastBackupTime?: Date;
  backupLocation: 'cloud' | 'local';
  encryptionEnabled: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'auth' | 'payment' | 'system' | 'api' | 'backup';
  message: string;
  details?: string;
  userId?: string;
  ipAddress?: string;
}

export interface SystemStatus {
  firebase: { status: 'connected' | 'disconnected' | 'error'; latency?: number };
  stellar: { status: 'connected' | 'disconnected' | 'syncing'; network: string };
  sms: { status: 'connected' | 'disconnected' | 'error'; balance?: number };
  backup: { status: 'ok' | 'warning' | 'error'; lastBackup?: Date };
  overall: 'operational' | 'degraded' | 'down';
}

export interface NotificationPrefs {
  emailNotifications: boolean;
  smsNotifications: boolean;
  paymentAlerts: boolean;
  arrearsAlerts: boolean;
  systemAlerts: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'sw' | 'lg';
  currency: 'UGX' | 'USD' | 'KES';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timezone: string;
}

// ============================================================================
// FIREBASE FUNCTIONS (Ready for integration)
// ============================================================================

export async function getSchoolInfo(schoolId: string): Promise<SchoolInfo | null> {
  try {
    const docRef = doc(db, 'schools', schoolId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SchoolInfo;
    }
    return null;
  } catch (error) {
    console.error('Error fetching school info:', error);
    throw error;
  }
}

export async function updateSchoolInfo(schoolId: string, data: Partial<SchoolInfo>): Promise<void> {
  try {
    const docRef = doc(db, 'schools', schoolId);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Error updating school info:', error);
    throw error;
  }
}

export async function getUsers(schoolId: string): Promise<UserAccount[]> {
  try {
    const q = query(collection(db, 'schools', schoolId, 'users'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastLogin: doc.data().lastLogin?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as UserAccount[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_SCHOOL_INFO: SchoolInfo = {
  id: 'school-001',
  name: 'Kampala International Academy',
  type: 'both',
  address: 'Plot 45, Kololo Hill Drive, Kampala',
  district: 'Kampala',
  phone: '+256 700 123 456',
  email: 'admin@kia.ac.ug',
  website: 'www.kia.ac.ug',
  motto: 'Excellence Through Knowledge',
  registrationNumber: 'REG/2015/KLA/0045',
  foundedYear: 2015,
  principalName: 'Dr. Sarah Nakamya',
  principalPhone: '+256 701 234 567',
};

const MOCK_CURRENT_TERM: AcademicTerm = {
  id: 'term-2026-1',
  name: 'Term 1 2026',
  year: 2026,
  termNumber: 1,
  startDate: new Date('2026-01-13'),
  endDate: new Date('2026-04-10'),
  isActive: true,
};

const MOCK_CLASSES: ClassConfig[] = [
  { id: 'p1', name: 'Primary 1', shortName: 'P.1', level: 'primary', order: 1, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 45 }, { id: 's2', name: 'West', shortName: 'W', capacity: 45 }], isActive: true },
  { id: 'p2', name: 'Primary 2', shortName: 'P.2', level: 'primary', order: 2, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 45 }, { id: 's2', name: 'West', shortName: 'W', capacity: 45 }], isActive: true },
  { id: 'p3', name: 'Primary 3', shortName: 'P.3', level: 'primary', order: 3, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 45 }], isActive: true },
  { id: 'p4', name: 'Primary 4', shortName: 'P.4', level: 'primary', order: 4, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 40 }], isActive: true },
  { id: 'p5', name: 'Primary 5', shortName: 'P.5', level: 'primary', order: 5, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 40 }], isActive: true },
  { id: 'p6', name: 'Primary 6', shortName: 'P.6', level: 'primary', order: 6, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 38 }], isActive: true },
  { id: 'p7', name: 'Primary 7', shortName: 'P.7', level: 'primary', order: 7, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 35 }], isActive: true },
  { id: 's1', name: 'Senior 1', shortName: 'S.1', level: 'secondary', order: 8, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 50 }, { id: 's2', name: 'West', shortName: 'W', capacity: 50 }], isActive: true },
  { id: 's2', name: 'Senior 2', shortName: 'S.2', level: 'secondary', order: 9, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 48 }, { id: 's2', name: 'West', shortName: 'W', capacity: 48 }], isActive: true },
  { id: 's3', name: 'Senior 3', shortName: 'S.3', level: 'secondary', order: 10, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 45 }], isActive: true },
  { id: 's4', name: 'Senior 4', shortName: 'S.4', level: 'secondary', order: 11, streams: [{ id: 's1', name: 'East', shortName: 'E', capacity: 44 }], isActive: true },
];

const MOCK_USERS: UserAccount[] = [
  { id: 'user-001', name: 'Dr. Sarah Nakamya', email: 'sarah@kia.ac.ug', phone: '+256 701 234 567', role: 'admin', isActive: true, lastLogin: new Date('2026-01-26T08:30:00'), createdAt: new Date('2024-01-15'), permissions: ['all'] },
  { id: 'user-002', name: 'Jane Nakamya', email: 'jane@kia.ac.ug', phone: '+256 702 345 678', role: 'bursar', isActive: true, lastLogin: new Date('2026-01-26T09:15:00'), createdAt: new Date('2024-02-01'), permissions: ['payments', 'reports', 'students'] },
  { id: 'user-003', name: 'Peter Kato', email: 'peter@kia.ac.ug', phone: '+256 703 456 789', role: 'registrar', isActive: true, lastLogin: new Date('2026-01-25T16:45:00'), createdAt: new Date('2024-03-10'), permissions: ['students', 'enrollment'] },
  { id: 'user-004', name: 'Grace Apio', email: 'grace@kia.ac.ug', phone: '+256 704 567 890', role: 'teacher', isActive: true, lastLogin: new Date('2026-01-24T10:00:00'), createdAt: new Date('2024-06-20'), permissions: ['students_view'] },
  { id: 'user-005', name: 'David Okello', email: 'david@kia.ac.ug', phone: '+256 705 678 901', role: 'viewer', isActive: false, lastLogin: new Date('2026-01-10T14:30:00'), createdAt: new Date('2024-09-01'), permissions: ['reports_view'] },
];

const MOCK_FEE_TEMPLATES: FeeTemplate[] = [
  {
    id: 'fee-001',
    name: 'Primary Day Scholar',
    classId: 'p1-p7',
    className: 'P.1 - P.7',
    term: 'Term 1',
    year: 2026,
    components: [
      { id: 'c1', name: 'Tuition Fee', amount: 450000, isOptional: false, category: 'tuition' },
      { id: 'c2', name: 'Activity Fee', amount: 50000, isOptional: false, category: 'activity' },
      { id: 'c3', name: 'Computer Fee', amount: 30000, isOptional: true, category: 'activity' },
      { id: 'c4', name: 'Library Fee', amount: 20000, isOptional: false, category: 'material' },
    ],
    totalAmount: 550000,
    isActive: true,
  },
  {
    id: 'fee-002',
    name: 'Secondary Day Scholar',
    classId: 's1-s4',
    className: 'S.1 - S.4',
    term: 'Term 1',
    year: 2026,
    components: [
      { id: 'c1', name: 'Tuition Fee', amount: 850000, isOptional: false, category: 'tuition' },
      { id: 'c2', name: 'Laboratory Fee', amount: 75000, isOptional: false, category: 'activity' },
      { id: 'c3', name: 'Activity Fee', amount: 50000, isOptional: false, category: 'activity' },
      { id: 'c4', name: 'Library Fee', amount: 25000, isOptional: false, category: 'material' },
    ],
    totalAmount: 1000000,
    isActive: true,
  },
  {
    id: 'fee-003',
    name: 'Secondary Boarding',
    classId: 's1-s4-boarding',
    className: 'S.1 - S.4 (Boarding)',
    term: 'Term 1',
    year: 2026,
    components: [
      { id: 'c1', name: 'Tuition Fee', amount: 850000, isOptional: false, category: 'tuition' },
      { id: 'c2', name: 'Boarding Fee', amount: 650000, isOptional: false, category: 'boarding' },
      { id: 'c3', name: 'Laboratory Fee', amount: 75000, isOptional: false, category: 'activity' },
      { id: 'c4', name: 'Activity Fee', amount: 50000, isOptional: false, category: 'activity' },
      { id: 'c5', name: 'Library Fee', amount: 25000, isOptional: false, category: 'material' },
    ],
    totalAmount: 1650000,
    isActive: true,
  },
];

const MOCK_SMS_CONFIG: SMSConfig = {
  provider: 'africas_talking',
  apiKey: 'at_****************************',
  senderId: 'KIA_SCHOOL',
  isEnabled: true,
  balance: 45600,
  lastSync: new Date('2026-01-26T09:00:00'),
  templates: [
    { id: 't1', name: 'Payment Received', event: 'payment_received', content: 'Dear Parent, payment of UGX {amount} for {student_name} has been received. Balance: UGX {balance}. Thank you! - KIA', isActive: true },
    { id: 't2', name: 'Payment Reminder', event: 'payment_reminder', content: 'Dear Parent, {student_name} has an outstanding balance of UGX {balance}. Please pay before {due_date}. Thank you! - KIA', isActive: true },
    { id: 't3', name: 'Arrears Alert', event: 'arrears_alert', content: 'URGENT: {student_name}\'s fees are overdue by {days} days. Outstanding: UGX {balance}. Please settle urgently. - KIA', isActive: true },
  ],
};

const MOCK_PAYMENT_GATEWAYS: PaymentGateway[] = [
  { id: 'pg-001', name: 'MTN Mobile Money', provider: 'mtn_momo', isEnabled: true, config: { merchantId: 'KIA2024', shortCode: '123456' }, lastSync: new Date('2026-01-26T08:45:00'), status: 'connected' },
  { id: 'pg-002', name: 'Airtel Money', provider: 'airtel_money', isEnabled: true, config: { merchantId: 'KIA_AIR', shortCode: '789012' }, lastSync: new Date('2026-01-26T08:45:00'), status: 'connected' },
  { id: 'pg-003', name: 'Bank Transfer', provider: 'bank_transfer', isEnabled: true, config: { bankName: 'Stanbic Bank', accountNumber: '9030012345678', accountName: 'Kampala International Academy' }, status: 'connected' },
  { id: 'pg-004', name: 'Cash Payment', provider: 'cash', isEnabled: true, config: {}, status: 'connected' },
  { id: 'pg-005', name: 'Cheque Payment', provider: 'cheque', isEnabled: false, config: {}, status: 'disconnected' },
];

const MOCK_STELLAR_CONFIG: StellarConfig = {
  network: 'testnet',
  publicKey: 'GDQP2KPQGVL5WEYP3HQXQBXP6BZXW...',
  isEnabled: true,
  lastAnchorTime: new Date('2026-01-26T09:30:00'),
  totalAnchored: 1247,
  pendingAnchor: 3,
  status: 'connected',
};

const MOCK_BACKUP_CONFIG: BackupConfig = {
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  retentionDays: 30,
  lastBackupTime: new Date('2026-01-26T02:00:00'),
  backupLocation: 'cloud',
  encryptionEnabled: true,
};

const MOCK_SYSTEM_LOGS: SystemLog[] = [
  { id: 'log-001', timestamp: new Date('2026-01-26T09:30:00'), level: 'info', category: 'payment', message: 'Payment recorded successfully', details: 'MTN MoMo payment of UGX 450,000 for student EDU-2023-045', userId: 'user-002' },
  { id: 'log-002', timestamp: new Date('2026-01-26T09:15:00'), level: 'info', category: 'auth', message: 'User login successful', details: 'Jane Nakamya logged in from 192.168.1.45', userId: 'user-002', ipAddress: '192.168.1.45' },
  { id: 'log-003', timestamp: new Date('2026-01-26T08:45:00'), level: 'info', category: 'system', message: 'Payment gateway sync completed', details: 'MTN MoMo and Airtel Money synchronized' },
  { id: 'log-004', timestamp: new Date('2026-01-26T08:30:00'), level: 'info', category: 'auth', message: 'User login successful', details: 'Dr. Sarah Nakamya logged in from 192.168.1.10', userId: 'user-001', ipAddress: '192.168.1.10' },
  { id: 'log-005', timestamp: new Date('2026-01-26T02:00:00'), level: 'info', category: 'backup', message: 'Automatic backup completed', details: 'Full database backup to cloud storage - 245MB' },
  { id: 'log-006', timestamp: new Date('2026-01-25T16:45:00'), level: 'warning', category: 'api', message: 'SMS API rate limit approaching', details: '85% of daily limit reached' },
  { id: 'log-007', timestamp: new Date('2026-01-25T14:30:00'), level: 'error', category: 'payment', message: 'Payment verification failed', details: 'MTN MoMo timeout for transaction TX123456' },
  { id: 'log-008', timestamp: new Date('2026-01-25T10:00:00'), level: 'info', category: 'system', message: 'Stellar anchor batch completed', details: '15 transactions anchored to testnet' },
];

const MOCK_SYSTEM_STATUS: SystemStatus = {
  firebase: { status: 'connected', latency: 45 },
  stellar: { status: 'connected', network: 'testnet' },
  sms: { status: 'connected', balance: 45600 },
  backup: { status: 'ok', lastBackup: new Date('2026-01-26T02:00:00') },
  overall: 'operational',
};

const MOCK_NOTIFICATION_PREFS: NotificationPrefs = {
  emailNotifications: true,
  smsNotifications: true,
  paymentAlerts: true,
  arrearsAlerts: true,
  systemAlerts: true,
  dailyDigest: false,
  weeklyReport: true,
};

const MOCK_APP_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  currency: 'UGX',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Africa/Kampala',
};

// ============================================================================
// MOCK DATA EXPORT
// ============================================================================

export function getMockSettingsData() {
  return {
    schoolInfo: MOCK_SCHOOL_INFO,
    currentTerm: MOCK_CURRENT_TERM,
    classes: MOCK_CLASSES,
    users: MOCK_USERS,
    feeTemplates: MOCK_FEE_TEMPLATES,
    smsConfig: MOCK_SMS_CONFIG,
    paymentGateways: MOCK_PAYMENT_GATEWAYS,
    stellarConfig: MOCK_STELLAR_CONFIG,
    backupConfig: MOCK_BACKUP_CONFIG,
    systemLogs: MOCK_SYSTEM_LOGS,
    systemStatus: MOCK_SYSTEM_STATUS,
    notificationPrefs: MOCK_NOTIFICATION_PREFS,
    appSettings: MOCK_APP_SETTINGS,
  };
}

// Helper functions
export function getRoleConfig(role: UserAccount['role']): { label: string; color: string; permissions: string[] } {
  const config: Record<UserAccount['role'], { label: string; color: string; permissions: string[] }> = {
    admin: { label: 'Administrator', color: 'primary', permissions: ['Full access to all features'] },
    bursar: { label: 'Bursar', color: 'success', permissions: ['Payments', 'Reports', 'Students'] },
    registrar: { label: 'Registrar', color: 'info', permissions: ['Students', 'Enrollment'] },
    teacher: { label: 'Teacher', color: 'warning', permissions: ['View Students'] },
    viewer: { label: 'Viewer', color: 'secondary', permissions: ['View Reports'] },
  };
  return config[role];
}

export function getLogLevelConfig(level: SystemLog['level']): { label: string; color: string; icon: string } {
  const config: Record<SystemLog['level'], { label: string; color: string; icon: string }> = {
    info: { label: 'Info', color: 'info', icon: 'info' },
    warning: { label: 'Warning', color: 'warning', icon: 'warning' },
    error: { label: 'Error', color: 'danger', icon: 'error' },
    debug: { label: 'Debug', color: 'secondary', icon: 'bug_report' },
  };
  return config[level];
}

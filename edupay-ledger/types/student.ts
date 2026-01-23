import { Timestamp } from 'firebase/firestore';

export interface Student {
  id: string;
  studentId: string; // Unique student ID (e.g., "EDU-2023-045-KC")
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Timestamp;
  gender: 'male' | 'female';
  photo?: string;
  
  // Academic Info
  schoolId: string;
  classId: string;
  streamId?: string;
  className: string;
  streamName?: string;
  academicYear: string;
  term: 1 | 2 | 3;
  enrollmentDate: Timestamp;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  
  // Guardian/Parent Info
  guardian: Guardian;
  
  // Financial Info
  feeStructureId: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  currentInstallment: number;
  installmentProgress: InstallmentProgress[];
  paymentStatus: PaymentStatus;
  lastPaymentDate?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Guardian {
  name: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
}

export interface InstallmentProgress {
  installmentId: string;
  installmentOrder: number;
  installmentName: string;
  amountDue: number;
  amountPaid: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  deadline: Timestamp;
  completedAt?: Timestamp;
  isUnlocked: boolean;
}

export type PaymentStatus = 
  | 'fully_paid'      // Balance is 0
  | 'partial'         // Some payment made, balance remaining
  | 'overdue'         // Payment deadline passed
  | 'no_payment';     // No payment made yet

export interface StudentFilter {
  classId?: string;
  streamId?: string;
  paymentStatus?: PaymentStatus;
  search?: string;
}

export function getStudentInitials(student: Student): string {
  return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
}

export function getStudentFullName(student: Student): string {
  return student.middleName 
    ? `${student.firstName} ${student.middleName} ${student.lastName}`
    : `${student.firstName} ${student.lastName}`;
}

export function calculatePaymentStatus(student: Student): PaymentStatus {
  if (student.balance === 0) return 'fully_paid';
  if (student.amountPaid === 0) return 'no_payment';
  
  const hasOverdue = student.installmentProgress.some(
    ip => ip.status === 'overdue'
  );
  
  return hasOverdue ? 'overdue' : 'partial';
}

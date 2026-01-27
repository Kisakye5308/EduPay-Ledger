/**
 * Exam Clearance Types
 * 
 * Types for exam clearance system - a critical feature for Ugandan schools
 * where students must meet minimum payment thresholds to sit for exams.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// EXAM CLEARANCE TYPES
// ============================================================================

/**
 * Clearance status for a student
 */
export type ClearanceStatus = 
  | 'cleared'           // Meets threshold, can sit for exams
  | 'conditional'       // Has payment promise or partial clearance
  | 'blocked'           // Does not meet threshold
  | 'exempt'            // Exempted (scholarship, special circumstance)
  | 'pending_review';   // Awaiting admin review

/**
 * Clearance threshold configuration
 */
export interface ClearanceThreshold {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  minPaymentPercentage: number;        // e.g., 70% of fees must be paid
  minCategoriesRequired: string[];     // Specific categories that must be paid (e.g., exam_fees)
  examType: 'end_of_term' | 'mock' | 'national' | 'midterm' | 'all';
  term: 1 | 2 | 3 | 'all';
  academicYear: string;
  applicableClasses: string[];         // Classes this threshold applies to
  isActive: boolean;
  allowConditionalClearance: boolean;  // Allow clearance with promise to pay
  conditionalMaxDays: number;          // Max days for conditional clearance
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Individual student clearance record
 */
export interface StudentClearance {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  classId: string;
  className: string;
  schoolId: string;
  academicYear: string;
  term: 1 | 2 | 3;
  examType: string;
  
  // Fee information
  totalFees: number;
  amountPaid: number;
  balance: number;
  paymentPercentage: number;
  
  // Category-specific information
  examFeesPaid: boolean;
  requiredCategoriesPaid: boolean;
  
  // Clearance status
  status: ClearanceStatus;
  clearedAt?: Timestamp;
  clearedBy?: string;
  
  // Conditional clearance details
  isConditional: boolean;
  conditionalDetails?: {
    promiseAmount: number;
    promiseDate: Timestamp;
    promisedBy: string;  // Guardian name
    approvedBy: string;  // Staff who approved
    fulfilled: boolean;
    fulfilledAt?: Timestamp;
  };
  
  // Exemption details
  isExempt: boolean;
  exemptionDetails?: {
    reason: string;
    approvedBy: string;
    approvedAt: Timestamp;
    documentRef?: string;
  };
  
  // Notes and history
  notes: string;
  history: ClearanceHistoryEntry[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Clearance history entry
 */
export interface ClearanceHistoryEntry {
  action: 'created' | 'cleared' | 'blocked' | 'conditional' | 'exempted' | 'payment_received' | 'promise_made' | 'promise_fulfilled' | 'reviewed';
  timestamp: Timestamp;
  performedBy: string;
  notes?: string;
  previousStatus?: ClearanceStatus;
  newStatus?: ClearanceStatus;
  amount?: number;
}

/**
 * Clearance report for a class or school
 */
export interface ClearanceReport {
  id: string;
  schoolId: string;
  academicYear: string;
  term: 1 | 2 | 3;
  examType: string;
  generatedAt: Timestamp;
  generatedBy: string;
  
  // Summary statistics
  summary: {
    totalStudents: number;
    cleared: number;
    conditional: number;
    blocked: number;
    exempt: number;
    pendingReview: number;
    clearanceRate: number;
    averagePaymentPercentage: number;
    totalExpected: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  
  // By class breakdown
  byClass: {
    classId: string;
    className: string;
    totalStudents: number;
    cleared: number;
    blocked: number;
    clearanceRate: number;
    collected: number;
    outstanding: number;
  }[];
  
  // Student lists
  clearedStudents: StudentClearanceSummary[];
  conditionalStudents: StudentClearanceSummary[];
  blockedStudents: StudentClearanceSummary[];
  exemptStudents: StudentClearanceSummary[];
}

/**
 * Simplified student clearance for lists
 */
export interface StudentClearanceSummary {
  studentId: string;
  studentName: string;
  studentNumber: string;
  className: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  paymentPercentage: number;
  status: ClearanceStatus;
  examFeesPaid: boolean;
  notes?: string;
  conditionalDeadline?: Timestamp;
}

/**
 * Clearance check result
 */
export interface ClearanceCheckResult {
  studentId: string;
  canSitForExam: boolean;
  status: ClearanceStatus;
  paymentPercentage: number;
  amountNeeded: number;
  missingCategories: string[];
  recommendations: string[];
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const CLEARANCE_STATUS_LABELS: Record<ClearanceStatus, string> = {
  cleared: 'Cleared',
  conditional: 'Conditional',
  blocked: 'Blocked',
  exempt: 'Exempt',
  pending_review: 'Pending Review',
};

export const CLEARANCE_STATUS_COLORS: Record<ClearanceStatus, { bg: string; text: string; border: string }> = {
  cleared: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  conditional: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  exempt: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  pending_review: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

export const EXAM_TYPE_LABELS: Record<string, string> = {
  end_of_term: 'End of Term Exams',
  mock: 'Mock Exams',
  national: 'National Exams (UCE/UACE)',
  midterm: 'Mid-Term Exams',
  all: 'All Exams',
};

// ============================================================================
// DEFAULT THRESHOLDS (Common in Ugandan Schools)
// ============================================================================

export const DEFAULT_CLEARANCE_THRESHOLDS: Omit<ClearanceThreshold, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'End of Term Clearance',
    description: 'Minimum payment required to sit for end of term examinations',
    minPaymentPercentage: 70,
    minCategoriesRequired: ['exam_fees'],
    examType: 'end_of_term',
    term: 'all',
    academicYear: new Date().getFullYear().toString(),
    applicableClasses: [],
    isActive: true,
    allowConditionalClearance: true,
    conditionalMaxDays: 7,
  },
  {
    name: 'Mock Exam Clearance',
    description: 'Payment required for mock examinations (candidate classes)',
    minPaymentPercentage: 80,
    minCategoriesRequired: ['exam_fees', 'tuition'],
    examType: 'mock',
    term: 'all',
    academicYear: new Date().getFullYear().toString(),
    applicableClasses: ['S4', 'S6', 'P7'],
    isActive: true,
    allowConditionalClearance: false,
    conditionalMaxDays: 0,
  },
  {
    name: 'National Exam Clearance',
    description: 'Full payment required for national examinations (UCE/UACE)',
    minPaymentPercentage: 100,
    minCategoriesRequired: ['exam_fees', 'tuition', 'registration'],
    examType: 'national',
    term: 3,
    academicYear: new Date().getFullYear().toString(),
    applicableClasses: ['S4', 'S6', 'P7'],
    isActive: true,
    allowConditionalClearance: false,
    conditionalMaxDays: 0,
  },
  {
    name: 'Mid-Term Assessment',
    description: 'Minimum payment for mid-term continuous assessment',
    minPaymentPercentage: 50,
    minCategoriesRequired: [],
    examType: 'midterm',
    term: 'all',
    academicYear: new Date().getFullYear().toString(),
    applicableClasses: [],
    isActive: true,
    allowConditionalClearance: true,
    conditionalMaxDays: 14,
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a student meets clearance requirements
 */
export function checkClearanceEligibility(
  paymentPercentage: number,
  threshold: ClearanceThreshold,
  examFeesPaid: boolean,
  requiredCategoriesPaid: boolean
): ClearanceCheckResult {
  const meetsPercentage = paymentPercentage >= threshold.minPaymentPercentage;
  const meetsCategoryRequirements = threshold.minCategoriesRequired.length === 0 || requiredCategoriesPaid;
  
  let status: ClearanceStatus = 'blocked';
  let canSitForExam = false;
  const recommendations: string[] = [];
  const missingCategories: string[] = [];
  
  if (meetsPercentage && meetsCategoryRequirements) {
    status = 'cleared';
    canSitForExam = true;
  } else if (meetsPercentage && !meetsCategoryRequirements) {
    status = 'blocked';
    recommendations.push('Pay required fee categories (especially exam fees) to be cleared');
    if (threshold.minCategoriesRequired.includes('exam_fees') && !examFeesPaid) {
      missingCategories.push('Examination Fees');
    }
  } else if (!meetsPercentage && threshold.allowConditionalClearance) {
    status = 'pending_review';
    recommendations.push(`Make a payment to reach ${threshold.minPaymentPercentage}% or request conditional clearance`);
  } else {
    status = 'blocked';
    recommendations.push(`Payment must reach at least ${threshold.minPaymentPercentage}% to be cleared`);
  }
  
  const amountNeeded = meetsPercentage ? 0 : 
    Math.ceil((threshold.minPaymentPercentage - paymentPercentage) / 100 * 1000000); // Rough calculation
  
  return {
    studentId: '',
    canSitForExam,
    status,
    paymentPercentage,
    amountNeeded,
    missingCategories,
    recommendations,
  };
}

/**
 * Format clearance status for display
 */
export function formatClearanceStatus(status: ClearanceStatus): { label: string; className: string } {
  const colors = CLEARANCE_STATUS_COLORS[status];
  return {
    label: CLEARANCE_STATUS_LABELS[status],
    className: `${colors.bg} ${colors.text} px-2 py-1 rounded text-xs font-medium`,
  };
}

/**
 * Get students who need follow-up (conditional clearance approaching deadline)
 */
export function getFollowUpList(clearances: StudentClearance[]): StudentClearance[] {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  return clearances.filter(c => {
    if (!c.isConditional || !c.conditionalDetails) return false;
    const deadline = c.conditionalDetails.promiseDate.toDate();
    return deadline <= threeDaysFromNow && !c.conditionalDetails.fulfilled;
  });
}

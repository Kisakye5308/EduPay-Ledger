/**
 * Scholarship & Bursary Types
 * 
 * Types for managing scholarships, bursaries, and sponsored students
 * in Ugandan schools. Supports government scholarships, NGO sponsorships,
 * church/mosque sponsorships, and individual sponsors.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// SCHOLARSHIP TYPES
// ============================================================================

/**
 * Type of scholarship/sponsorship
 */
export type ScholarshipType = 
  | 'government'           // Government scholarship (e.g., Universal Primary Education)
  | 'ngo'                  // NGO sponsorship (e.g., BRAC, World Vision)
  | 'church'               // Church/Religious organization
  | 'mosque'               // Islamic organization sponsorship
  | 'corporate'            // Corporate sponsorship
  | 'individual'           // Individual sponsor
  | 'community'            // Community-based scholarship
  | 'merit'                // School merit-based scholarship
  | 'need_based'           // Need-based bursary
  | 'alumni'               // Alumni association scholarship
  | 'other';               // Other type

/**
 * Coverage type for scholarship
 */
export type CoverageType = 
  | 'full'                 // 100% coverage
  | 'partial_percentage'   // Percentage of total fees
  | 'partial_amount'       // Fixed amount
  | 'specific_categories'; // Only specific fee categories

/**
 * Status of scholarship
 */
export type ScholarshipStatus = 
  | 'active'
  | 'suspended'
  | 'expired'
  | 'pending_renewal'
  | 'cancelled';

/**
 * Scholarship/Sponsorship definition
 */
export interface Scholarship {
  id: string;
  schoolId: string;
  
  // Basic Information
  name: string;
  description: string;
  type: ScholarshipType;
  code: string;                         // Short code for reference (e.g., "GOV-UPE", "WV-2026")
  
  // Sponsor Information
  sponsor: {
    name: string;
    type: 'organization' | 'individual';
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  };
  
  // Coverage Details
  coverageType: CoverageType;
  coveragePercentage?: number;          // For partial_percentage (e.g., 50 for 50%)
  coverageAmount?: number;              // For partial_amount (fixed UGX)
  coveredCategories?: string[];         // For specific_categories (category IDs)
  maxBeneficiaries?: number;            // Maximum number of students
  currentBeneficiaries: number;
  
  // Terms
  academicYear: string;
  terms: (1 | 2 | 3)[];                 // Which terms it covers
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Eligibility Criteria
  eligibility: {
    classes?: string[];                 // Eligible classes
    studentTypes?: ('boarder' | 'day_scholar')[];
    genderRestriction?: 'male' | 'female' | 'all';
    minGradePoint?: number;
    maxFamilyIncome?: number;
    requiresApplication: boolean;
    customCriteria?: string;
  };
  
  // Financial Tracking
  totalBudget: number;
  disbursedAmount: number;
  remainingBudget: number;
  
  // Status
  status: ScholarshipStatus;
  isRenewable: boolean;
  renewalDeadline?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/**
 * Student scholarship allocation
 */
export interface StudentScholarship {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  classId: string;
  className: string;
  schoolId: string;
  
  // Scholarship Details
  scholarshipId: string;
  scholarshipName: string;
  scholarshipType: ScholarshipType;
  sponsorName: string;
  
  // Coverage for this student
  coverageType: CoverageType;
  coveragePercentage?: number;
  coverageAmount?: number;
  coveredCategories?: string[];
  
  // Period
  academicYear: string;
  term: 1 | 2 | 3;
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Financial
  allocatedAmount: number;              // Total amount allocated
  disbursedAmount: number;              // Amount already applied to fees
  remainingAmount: number;              // Amount remaining
  
  // Application (if applicable)
  applicationDate?: Timestamp;
  applicationStatus: 'approved' | 'pending' | 'rejected' | 'direct_award';
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  // Status
  status: 'active' | 'suspended' | 'completed' | 'cancelled';
  suspensionReason?: string;
  
  // Disbursement History
  disbursements: ScholarshipDisbursement[];
  
  // Notes
  notes: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Scholarship disbursement record
 */
export interface ScholarshipDisbursement {
  id: string;
  studentScholarshipId: string;
  studentId: string;
  scholarshipId: string;
  
  // Disbursement details
  amount: number;
  term: 1 | 2 | 3;
  academicYear: string;
  date: Timestamp;
  
  // Allocation by category
  categoryAllocations: {
    categoryId: string;
    categoryName: string;
    amount: number;
  }[];
  
  // Reference
  paymentId?: string;                   // If linked to a payment record
  receiptNumber?: string;
  
  // Processing
  processedBy: string;
  notes?: string;
  
  createdAt: Timestamp;
}

/**
 * Scholarship report
 */
export interface ScholarshipReport {
  schoolId: string;
  academicYear: string;
  term: 1 | 2 | 3;
  generatedAt: Timestamp;
  generatedBy: string;
  
  // Summary
  summary: {
    totalScholarships: number;
    activeScholarships: number;
    totalBeneficiaries: number;
    totalBudget: number;
    totalDisbursed: number;
    totalRemaining: number;
    byType: {
      type: ScholarshipType;
      count: number;
      beneficiaries: number;
      amount: number;
    }[];
  };
  
  // Scholarship List
  scholarships: {
    id: string;
    name: string;
    type: ScholarshipType;
    sponsorName: string;
    beneficiaries: number;
    budget: number;
    disbursed: number;
    status: ScholarshipStatus;
  }[];
  
  // Beneficiaries
  beneficiaries: {
    studentId: string;
    studentName: string;
    studentNumber: string;
    className: string;
    scholarshipName: string;
    sponsorName: string;
    amount: number;
    status: string;
  }[];
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const SCHOLARSHIP_TYPE_LABELS: Record<ScholarshipType, string> = {
  government: 'Government Scholarship',
  ngo: 'NGO Sponsorship',
  church: 'Church/Religious',
  mosque: 'Islamic Organization',
  corporate: 'Corporate Sponsorship',
  individual: 'Individual Sponsor',
  community: 'Community-Based',
  merit: 'Merit Scholarship',
  need_based: 'Need-Based Bursary',
  alumni: 'Alumni Scholarship',
  other: 'Other',
};

export const SCHOLARSHIP_TYPE_ICONS: Record<ScholarshipType, string> = {
  government: '🏛️',
  ngo: '🌍',
  church: '⛪',
  mosque: '🕌',
  corporate: '🏢',
  individual: '👤',
  community: '🤝',
  merit: '🏆',
  need_based: '🤲',
  alumni: '🎓',
  other: '📋',
};

export const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  full: 'Full Coverage (100%)',
  partial_percentage: 'Partial (% of Fees)',
  partial_amount: 'Partial (Fixed Amount)',
  specific_categories: 'Specific Fee Categories',
};

export const SCHOLARSHIP_STATUS_LABELS: Record<ScholarshipStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  expired: 'Expired',
  pending_renewal: 'Pending Renewal',
  cancelled: 'Cancelled',
};

export const SCHOLARSHIP_STATUS_COLORS: Record<ScholarshipStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  suspended: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-800' },
  pending_renewal: { bg: 'bg-blue-100', text: 'text-blue-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate scholarship amount for a student based on coverage type
 */
export function calculateScholarshipAmount(
  scholarship: Scholarship,
  totalFees: number,
  categoryAmounts?: { categoryId: string; amount: number }[]
): number {
  switch (scholarship.coverageType) {
    case 'full':
      return totalFees;
    
    case 'partial_percentage':
      return Math.round((scholarship.coveragePercentage || 0) / 100 * totalFees);
    
    case 'partial_amount':
      return Math.min(scholarship.coverageAmount || 0, totalFees);
    
    case 'specific_categories':
      if (!categoryAmounts || !scholarship.coveredCategories) return 0;
      return categoryAmounts
        .filter(c => scholarship.coveredCategories?.includes(c.categoryId))
        .reduce((sum, c) => sum + c.amount, 0);
    
    default:
      return 0;
  }
}

/**
 * Check if a student is eligible for a scholarship
 */
export function checkScholarshipEligibility(
  scholarship: Scholarship,
  student: {
    classId: string;
    studentType: 'boarder' | 'day_scholar';
    gender: 'male' | 'female';
    gradePoint?: number;
  }
): { eligible: boolean; reason?: string } {
  const { eligibility } = scholarship;
  
  // Check class eligibility
  if (eligibility.classes && eligibility.classes.length > 0) {
    if (!eligibility.classes.includes(student.classId)) {
      return { eligible: false, reason: 'Student class not eligible' };
    }
  }
  
  // Check student type
  if (eligibility.studentTypes && eligibility.studentTypes.length > 0) {
    if (!eligibility.studentTypes.includes(student.studentType)) {
      return { eligible: false, reason: 'Student type not eligible' };
    }
  }
  
  // Check gender
  if (eligibility.genderRestriction && eligibility.genderRestriction !== 'all') {
    if (student.gender !== eligibility.genderRestriction) {
      return { eligible: false, reason: `Scholarship is for ${eligibility.genderRestriction} students only` };
    }
  }
  
  // Check grade point
  if (eligibility.minGradePoint && student.gradePoint !== undefined) {
    if (student.gradePoint < eligibility.minGradePoint) {
      return { eligible: false, reason: `Minimum grade point of ${eligibility.minGradePoint} required` };
    }
  }
  
  // Check capacity
  if (scholarship.maxBeneficiaries && scholarship.currentBeneficiaries >= scholarship.maxBeneficiaries) {
    return { eligible: false, reason: 'Scholarship has reached maximum beneficiaries' };
  }
  
  return { eligible: true };
}

/**
 * Get scholarship summary for a student
 */
export function getStudentScholarshipSummary(
  scholarships: StudentScholarship[]
): {
  totalScholarships: number;
  totalAmount: number;
  activeScholarships: number;
  sponsors: string[];
} {
  const active = scholarships.filter(s => s.status === 'active');
  
  return {
    totalScholarships: scholarships.length,
    totalAmount: scholarships.reduce((sum, s) => sum + s.allocatedAmount, 0),
    activeScholarships: active.length,
    sponsors: Array.from(new Set(scholarships.map(s => s.sponsorName))),
  };
}

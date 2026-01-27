/**
 * Fee Category Types
 * 
 * Handles fee breakdown by category for Ugandan schools:
 * - Tuition
 * - Boarding fees
 * - Lunch/Meals
 * - Transport
 * - Uniform
 * - Lab fees
 * - Exam fees
 * - Extracurricular
 * - Development levy
 * - Computer fees
 * - Library fees
 * - Medical fees
 * - Custom categories
 */

import { Timestamp } from 'firebase/firestore';

// Standard fee categories used in Ugandan schools
export type StandardFeeCategory = 
  | 'tuition'
  | 'boarding'
  | 'lunch'
  | 'transport'
  | 'uniform'
  | 'lab_fees'
  | 'exam_fees'
  | 'extracurricular'
  | 'development_levy'
  | 'computer_fees'
  | 'library_fees'
  | 'medical_fees'
  | 'pta_fees'
  | 'sports_fees'
  | 'graduation_fees'
  | 'registration'
  | 'custom';

export interface FeeCategory {
  id: string;
  schoolId: string;
  name: string;
  code: string; // Short code like "TUI", "BRD", "LUN"
  type: StandardFeeCategory;
  description?: string;
  isRequired: boolean; // Required for all students
  isRecurring: boolean; // Charged every term
  applicableTo: 'all' | 'boarders' | 'day_scholars' | 'specific_classes';
  applicableClasses?: string[]; // If applicableTo is 'specific_classes'
  priority: number; // Payment allocation priority (1 = highest)
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FeeCategoryAmount {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  amount: number;
  isOptional: boolean;
}

// Fee structure with category breakdown
export interface FeeStructureWithCategories {
  id: string;
  schoolId: string;
  name: string; // e.g., "Senior 1-4 Boarding", "Primary Day Scholar"
  academicYear: string;
  term: 1 | 2 | 3;
  studentType: 'boarder' | 'day_scholar' | 'both';
  applicableClasses: string[];
  categories: FeeCategoryAmount[];
  totalAmount: number;
  installmentRuleId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Student's fee breakdown
export interface StudentFeeBreakdown {
  studentId: string;
  feeStructureId: string;
  academicYear: string;
  term: 1 | 2 | 3;
  categories: StudentFeeCategoryStatus[];
  totalFees: number;
  totalPaid: number;
  totalBalance: number;
  lastUpdated: Timestamp;
  // Additional properties for component compatibility
  totalAmount?: number; // alias for totalFees
  paymentPercentage?: number; // (totalPaid / totalFees) * 100
  carryForwardBalance?: number; // balance carried from previous term
}

export interface StudentFeeCategoryStatus {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: 'unpaid' | 'partial' | 'paid' | 'fully_paid' | 'partially_paid';
  lastPaymentDate?: Timestamp;
  payments: CategoryPaymentRecord[];
  // Alias properties for component compatibility
  amount: number; // alias for amountDue
  paid: number; // alias for amountPaid
  // Optional properties for waivers and scholarships
  waivedAmount?: number;
  waiverReason?: string;
  scholarshipAmount?: number;
  scholarshipId?: string;
  paymentHistory?: CategoryPaymentRecord[];
}

export interface CategoryPaymentRecord {
  paymentId: string;
  receiptNumber: string;
  amount: number;
  date: Timestamp;
  recordedBy: string;
}

// Payment allocation to categories
export interface PaymentCategoryAllocation {
  paymentId: string;
  allocations: {
    categoryId: string;
    categoryName: string;
    amount: number;
  }[];
  allocationMethod: 'priority' | 'proportional' | 'manual';
  allocatedAt: Timestamp;
  allocatedBy: string;
}

// For recording payments with category allocation
export interface PaymentWithCategories {
  studentId: string;
  totalAmount: number;
  channel: string;
  transactionRef?: string;
  allocations: {
    categoryId: string;
    amount: number;
  }[];
  allocationMethod: 'priority' | 'proportional' | 'manual';
  notes?: string;
}

// Reports
export interface CategoryCollectionReport {
  schoolId: string;
  academicYear: string;
  term: 1 | 2 | 3;
  generatedAt: Timestamp;
  categories: {
    categoryId: string;
    categoryName: string;
    categoryCode: string;
    expectedAmount: number;
    collectedAmount: number;
    balance: number;
    collectionRate: number; // percentage
    studentsPaid: number;
    studentsPartial: number;
    studentsUnpaid: number;
  }[];
  totals: {
    expectedAmount: number;
    collectedAmount: number;
    balance: number;
    overallCollectionRate: number;
  };
}

// Display helpers
export const FEE_CATEGORY_LABELS: Record<StandardFeeCategory, string> = {
  tuition: 'Tuition',
  boarding: 'Boarding Fees',
  lunch: 'Lunch/Meals',
  transport: 'Transport',
  uniform: 'Uniform',
  lab_fees: 'Laboratory Fees',
  exam_fees: 'Examination Fees',
  extracurricular: 'Extracurricular',
  development_levy: 'Development Levy',
  computer_fees: 'Computer Fees',
  library_fees: 'Library Fees',
  medical_fees: 'Medical Fees',
  pta_fees: 'PTA Fees',
  sports_fees: 'Sports Fees',
  graduation_fees: 'Graduation Fees',
  registration: 'Registration',
  custom: 'Other',
};

export const FEE_CATEGORY_ICONS: Record<StandardFeeCategory, string> = {
  tuition: 'school',
  boarding: 'bed',
  lunch: 'restaurant',
  transport: 'directions_bus',
  uniform: 'checkroom',
  lab_fees: 'science',
  exam_fees: 'assignment',
  extracurricular: 'sports_soccer',
  development_levy: 'construction',
  computer_fees: 'computer',
  library_fees: 'local_library',
  medical_fees: 'medical_services',
  pta_fees: 'groups',
  sports_fees: 'fitness_center',
  graduation_fees: 'school',
  registration: 'app_registration',
  custom: 'category',
};

export const FEE_CATEGORY_COLORS: Record<StandardFeeCategory, string> = {
  tuition: 'bg-blue-500',
  boarding: 'bg-purple-500',
  lunch: 'bg-orange-500',
  transport: 'bg-green-500',
  uniform: 'bg-pink-500',
  lab_fees: 'bg-cyan-500',
  exam_fees: 'bg-red-500',
  extracurricular: 'bg-yellow-500',
  development_levy: 'bg-slate-500',
  computer_fees: 'bg-indigo-500',
  library_fees: 'bg-amber-500',
  medical_fees: 'bg-rose-500',
  pta_fees: 'bg-teal-500',
  sports_fees: 'bg-lime-500',
  graduation_fees: 'bg-violet-500',
  registration: 'bg-emerald-500',
  custom: 'bg-gray-500',
};

// Default fee categories for new schools
export const DEFAULT_FEE_CATEGORIES: Partial<FeeCategory>[] = [
  { name: 'Tuition', code: 'TUI', type: 'tuition', isRequired: true, isRecurring: true, applicableTo: 'all', priority: 1 },
  { name: 'Boarding Fees', code: 'BRD', type: 'boarding', isRequired: false, isRecurring: true, applicableTo: 'boarders', priority: 2 },
  { name: 'Lunch/Meals', code: 'LUN', type: 'lunch', isRequired: false, isRecurring: true, applicableTo: 'day_scholars', priority: 3 },
  { name: 'Transport', code: 'TRN', type: 'transport', isRequired: false, isRecurring: true, applicableTo: 'all', priority: 4 },
  { name: 'Examination Fees', code: 'EXM', type: 'exam_fees', isRequired: true, isRecurring: true, applicableTo: 'all', priority: 5 },
  { name: 'Development Levy', code: 'DEV', type: 'development_levy', isRequired: true, isRecurring: false, applicableTo: 'all', priority: 6 },
  { name: 'Computer Fees', code: 'COM', type: 'computer_fees', isRequired: false, isRecurring: true, applicableTo: 'all', priority: 7 },
  { name: 'Library Fees', code: 'LIB', type: 'library_fees', isRequired: false, isRecurring: true, applicableTo: 'all', priority: 8 },
  { name: 'Sports Fees', code: 'SPT', type: 'sports_fees', isRequired: false, isRecurring: true, applicableTo: 'all', priority: 9 },
  { name: 'PTA Fees', code: 'PTA', type: 'pta_fees', isRequired: true, isRecurring: false, applicableTo: 'all', priority: 10 },
];

// Utility functions
export function getCategoryLabel(type: StandardFeeCategory): string {
  return FEE_CATEGORY_LABELS[type] || 'Other';
}

export function getCategoryIcon(type: StandardFeeCategory): string {
  return FEE_CATEGORY_ICONS[type] || 'category';
}

export function getCategoryColor(type: StandardFeeCategory): string {
  return FEE_CATEGORY_COLORS[type] || 'bg-gray-500';
}

export function calculateCategoryStatus(amountDue: number, amountPaid: number): 'unpaid' | 'partial' | 'paid' {
  if (amountPaid === 0) return 'unpaid';
  if (amountPaid >= amountDue) return 'paid';
  return 'partial';
}

export function allocatePaymentByPriority(
  amount: number,
  categories: StudentFeeCategoryStatus[]
): { categoryId: string; amount: number }[] {
  const allocations: { categoryId: string; amount: number }[] = [];
  let remaining = amount;

  // Sort by priority (assuming categories are already sorted)
  for (const category of categories) {
    if (remaining <= 0) break;
    if (category.balance <= 0) continue;

    const allocation = Math.min(remaining, category.balance);
    allocations.push({
      categoryId: category.categoryId,
      amount: allocation,
    });
    remaining -= allocation;
  }

  return allocations;
}

export function allocatePaymentProportionally(
  amount: number,
  categories: StudentFeeCategoryStatus[]
): { categoryId: string; amount: number }[] {
  const allocations: { categoryId: string; amount: number }[] = [];
  const totalBalance = categories.reduce((sum, c) => sum + c.balance, 0);

  if (totalBalance === 0) return allocations;

  let allocated = 0;
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    if (category.balance <= 0) continue;

    const proportion = category.balance / totalBalance;
    let allocation = Math.round(amount * proportion);

    // Last category gets the remainder to avoid rounding issues
    if (i === categories.length - 1) {
      allocation = amount - allocated;
    }

    allocations.push({
      categoryId: category.categoryId,
      amount: Math.min(allocation, category.balance),
    });
    allocated += allocation;
  }

  return allocations;
}

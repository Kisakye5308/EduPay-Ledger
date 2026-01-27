/**
 * Student Residence Types
 * Defines fee structures based on boarding status
 * Critical for Ugandan schools with boarding facilities
 */

// Student residence/boarding type
export type ResidenceType = 
  | 'boarder'        // Full boarding - stays at school all week
  | 'day_scholar'    // Day student - goes home daily
  | 'half_boarder'   // Lunch program only (stays for lunch)
  | 'weekly_boarder' // Goes home on weekends only
  | 'external';      // External candidate (exam-only)

// Boarding-specific fee category
export interface BoardingFeeCategory {
  id: string;
  name: string;
  description: string;
  applicableTo: ResidenceType[]; // Which residence types pay this fee
  baseAmount: number;
  termBasedAmount?: { // Can vary by term
    term_1: number;
    term_2: number;
    term_3: number;
  };
  isOptional: boolean;
  priority: number;
}

// Fee structure by residence type
export interface ResidenceFeeStructure {
  id: string;
  schoolId: string;
  residenceType: ResidenceType;
  name: string; // e.g., "Boarder Fees", "Day Scholar Fees"
  description: string;
  
  // Base fees that apply to this residence type
  baseFees: BoardingFeeItem[];
  
  // Optional fees available
  optionalFees: BoardingFeeItem[];
  
  // Total base fee calculation
  totalBaseFee: number;
  
  // Active status
  isActive: boolean;
  
  // Academic period
  year: number;
  term: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Individual fee item within a structure
export interface BoardingFeeItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  description?: string;
  isRequired: boolean;
}

// Student fee assignment based on residence
export interface StudentResidenceFees {
  studentId: string;
  studentName: string;
  residenceType: ResidenceType;
  
  // Assigned fee structure
  feeStructureId: string;
  feeStructureName: string;
  
  // Applied fees
  appliedFees: AppliedFeeItem[];
  
  // Totals
  totalBaseFees: number;
  totalOptionalFees: number;
  totalFees: number;
  
  // Adjustments (discounts, scholarships)
  adjustments: FeeAdjustment[];
  adjustedTotal: number;
  
  // Payment status
  amountPaid: number;
  balance: number;
  
  // Academic period
  year: number;
  term: string;
  
  updatedAt: Date;
}

export interface AppliedFeeItem {
  categoryId: string;
  categoryName: string;
  originalAmount: number;
  adjustedAmount: number;
  isOptional: boolean;
  isWaived: boolean;
  waiverReason?: string;
}

export interface FeeAdjustment {
  id: string;
  type: 'discount' | 'scholarship' | 'sibling_discount' | 'staff_discount' | 'waiver' | 'addition';
  description: string;
  amount: number; // Positive for discounts, negative for additions
  percentage?: number;
  appliedBy: string;
  appliedAt: Date;
}

// Residence type comparison for reports
export interface ResidenceComparison {
  residenceType: ResidenceType;
  label: string;
  studentCount: number;
  totalFees: number;
  totalCollected: number;
  totalBalance: number;
  collectionRate: number;
  averageBalance: number;
}

// Fee difference report
export interface BoardingFeeReport {
  schoolId: string;
  year: number;
  term: string;
  generatedAt: Date;
  generatedBy: string;
  
  // Summary by residence type
  byResidenceType: ResidenceComparison[];
  
  // Overall totals
  totalStudents: number;
  totalExpectedFees: number;
  totalCollected: number;
  totalBalance: number;
  overallCollectionRate: number;
  
  // Boarding vs Day comparison
  boardingStudents: number;
  boardingFees: number;
  boardingCollected: number;
  dayStudents: number;
  dayFees: number;
  dayCollected: number;
}

// Default fee categories for each residence type (Uganda context)
export const BOARDING_FEE_CATEGORIES: BoardingFeeCategory[] = [
  // Universal fees (all students)
  {
    id: 'tuition',
    name: 'Tuition',
    description: 'Academic instruction fees',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder', 'external'],
    baseAmount: 0, // Set per school
    isOptional: false,
    priority: 1,
  },
  {
    id: 'exam_fees',
    name: 'Examination Fees',
    description: 'Internal and external exam registration',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder', 'external'],
    baseAmount: 0,
    isOptional: false,
    priority: 2,
  },
  {
    id: 'development_levy',
    name: 'Development Levy',
    description: 'School infrastructure development',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: false,
    priority: 3,
  },
  
  // Boarding-specific fees
  {
    id: 'boarding_fees',
    name: 'Boarding Fees',
    description: 'Accommodation and dormitory',
    applicableTo: ['boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: false,
    priority: 10,
  },
  {
    id: 'full_meals',
    name: 'Full Meals',
    description: 'Breakfast, lunch, dinner, and snacks',
    applicableTo: ['boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: false,
    priority: 11,
  },
  {
    id: 'beddings',
    name: 'Beddings Allowance',
    description: 'Mattress, sheets, blankets maintenance',
    applicableTo: ['boarder', 'weekly_boarder'],
    baseAmount: 0,
    termBasedAmount: {
      term_1: 50000, // Higher in Term 1
      term_2: 20000,
      term_3: 20000,
    },
    isOptional: false,
    priority: 12,
  },
  {
    id: 'laundry',
    name: 'Laundry Services',
    description: 'Uniform and personal clothes washing',
    applicableTo: ['boarder'],
    baseAmount: 0,
    isOptional: true,
    priority: 13,
  },
  
  // Day scholar specific
  {
    id: 'lunch_program',
    name: 'Lunch Program',
    description: 'Midday meal at school',
    applicableTo: ['day_scholar', 'half_boarder'],
    baseAmount: 0,
    isOptional: true, // Optional for day scholars
    priority: 20,
  },
  
  // Half boarder specific
  {
    id: 'half_board_meals',
    name: 'Half Board Meals',
    description: 'Lunch and afternoon snack',
    applicableTo: ['half_boarder'],
    baseAmount: 0,
    isOptional: false,
    priority: 21,
  },
  
  // Common optional fees
  {
    id: 'transport',
    name: 'School Transport',
    description: 'School bus service',
    applicableTo: ['day_scholar', 'half_boarder'],
    baseAmount: 0,
    isOptional: true,
    priority: 30,
  },
  {
    id: 'computer_lab',
    name: 'Computer Lab',
    description: 'ICT and computer training',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: true,
    priority: 31,
  },
  {
    id: 'library',
    name: 'Library Fees',
    description: 'Library access and materials',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: true,
    priority: 32,
  },
  {
    id: 'sports',
    name: 'Sports & Games',
    description: 'Sports equipment and activities',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: true,
    priority: 33,
  },
  {
    id: 'uniform',
    name: 'Uniform',
    description: 'School uniform and PE kit',
    applicableTo: ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'],
    baseAmount: 0,
    termBasedAmount: {
      term_1: 150000, // Full uniform in Term 1
      term_2: 0,
      term_3: 0,
    },
    isOptional: false,
    priority: 34,
  },
  {
    id: 'medical_fees',
    name: 'Medical Fees',
    description: 'School clinic and first aid',
    applicableTo: ['boarder', 'weekly_boarder'],
    baseAmount: 0,
    isOptional: false,
    priority: 35,
  },
];

// Utility functions
export function getResidenceTypeLabel(type: ResidenceType): string {
  const labels: Record<ResidenceType, string> = {
    boarder: 'Boarder',
    day_scholar: 'Day Scholar',
    half_boarder: 'Half Boarder',
    weekly_boarder: 'Weekly Boarder',
    external: 'External Candidate',
  };
  return labels[type];
}

export function getResidenceTypeColor(type: ResidenceType): string {
  const colors: Record<ResidenceType, string> = {
    boarder: 'bg-primary/10 text-primary',
    day_scholar: 'bg-success/10 text-success',
    half_boarder: 'bg-warning/10 text-warning',
    weekly_boarder: 'bg-blue-100 text-blue-700',
    external: 'bg-slate-100 text-slate-700',
  };
  return colors[type];
}

export function getApplicableFeeCategories(
  residenceType: ResidenceType,
  includeOptional: boolean = true
): BoardingFeeCategory[] {
  return BOARDING_FEE_CATEGORIES
    .filter(cat => cat.applicableTo.includes(residenceType))
    .filter(cat => includeOptional || !cat.isOptional)
    .sort((a, b) => a.priority - b.priority);
}

export function calculateResidenceFees(
  residenceType: ResidenceType,
  feeAmounts: Record<string, number>,
  optionalSelections: string[] = [],
  term: 'term_1' | 'term_2' | 'term_3' = 'term_1'
): { total: number; breakdown: { categoryId: string; name: string; amount: number; isOptional: boolean }[] } {
  const applicableCategories = getApplicableFeeCategories(residenceType, true);
  const breakdown: { categoryId: string; name: string; amount: number; isOptional: boolean }[] = [];
  let total = 0;

  for (const category of applicableCategories) {
    // Skip optional fees that aren't selected
    if (category.isOptional && !optionalSelections.includes(category.id)) {
      continue;
    }

    // Get amount - check term-based first, then base amount, then custom amount
    let amount = feeAmounts[category.id] || 0;
    if (category.termBasedAmount && category.termBasedAmount[term]) {
      amount = category.termBasedAmount[term];
    } else if (amount === 0) {
      amount = category.baseAmount;
    }

    if (amount > 0) {
      breakdown.push({
        categoryId: category.id,
        name: category.name,
        amount,
        isOptional: category.isOptional,
      });
      total += amount;
    }
  }

  return { total, breakdown };
}

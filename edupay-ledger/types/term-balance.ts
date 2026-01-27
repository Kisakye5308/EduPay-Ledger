/**
 * Term Balance Carryover Types
 * Handles automatic balance carry-forward between academic terms
 * Essential for Ugandan schools where students may have outstanding balances
 */

// Academic term structure
export type AcademicTerm = 'term_1' | 'term_2' | 'term_3';

export interface AcademicPeriod {
  year: number;
  term: AcademicTerm;
}

// Balance carryover entry
export interface TermBalanceCarryover {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string; // Denormalized for reporting
  className: string;
  streamName?: string;
  
  // Source term (where balance originated)
  fromPeriod: AcademicPeriod;
  fromTermFees: number;
  fromTermPaid: number;
  fromTermBalance: number;
  
  // Destination term (where balance is carried to)
  toPeriod: AcademicPeriod;
  
  // Carryover details
  carryoverAmount: number; // Can be positive (debt) or negative (credit/overpayment)
  carryoverType: 'debit' | 'credit'; // debit = owes money, credit = overpaid
  
  // Adjustments
  adjustments: BalanceAdjustment[];
  adjustedAmount: number; // Final amount after adjustments
  
  // Status tracking
  status: 'pending' | 'applied' | 'waived' | 'disputed';
  appliedAt?: Date;
  appliedBy?: string;
  
  // Audit trail
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  notes?: string;
}

// Balance adjustments (waivers, corrections, etc.)
export interface BalanceAdjustment {
  id: string;
  type: 'waiver' | 'discount' | 'correction' | 'interest' | 'penalty' | 'write_off';
  amount: number; // Positive for reductions, negative for additions
  reason: string;
  approvedBy: string;
  approvedAt: Date;
  notes?: string;
}

// Student's cumulative balance across all terms
export interface StudentCumulativeBalance {
  studentId: string;
  studentName: string;
  className: string;
  streamName?: string;
  
  // Current term details
  currentPeriod: AcademicPeriod;
  currentTermFees: number;
  currentTermPaid: number;
  currentTermBalance: number;
  
  // Carried forward from previous terms
  carryoverBalance: number; // Sum of all previous unpaid balances
  carryoverCredits: number; // Sum of all overpayments
  
  // Total outstanding
  totalOutstanding: number; // currentTermBalance + carryoverBalance - carryoverCredits
  
  // History of carryovers
  carryoverHistory: TermBalanceCarryover[];
  
  // Payment status
  hasArrears: boolean;
  arrearsCount: number; // Number of terms with unpaid balances
  oldestArrears?: AcademicPeriod;
}

// Carryover processing options
export interface CarryoverOptions {
  schoolId: string;
  fromPeriod: AcademicPeriod;
  toPeriod: AcademicPeriod;
  
  // Processing settings
  includeCredits: boolean; // Carry forward overpayments as credits
  autoApply: boolean; // Automatically apply carryovers
  generateReport: boolean;
  
  // Filters
  classFilter?: string[];
  streamFilter?: string[];
  minBalance?: number; // Only carry over if balance exceeds this
  
  // Notifications
  notifyParents: boolean;
  notifyTeachers: boolean;
}

// Carryover processing result
export interface CarryoverProcessingResult {
  schoolId: string;
  fromPeriod: AcademicPeriod;
  toPeriod: AcademicPeriod;
  processedAt: Date;
  processedBy: string;
  
  // Summary statistics
  totalStudentsProcessed: number;
  studentsWithDebits: number;
  studentsWithCredits: number;
  studentsCleared: number;
  
  // Financial totals
  totalDebitCarryover: number;
  totalCreditCarryover: number;
  netCarryover: number;
  
  // Per-class breakdown
  classBreakdown: ClassCarryoverSummary[];
  
  // Individual carryovers created
  carryovers: TermBalanceCarryover[];
  
  // Errors during processing
  errors: CarryoverError[];
}

export interface ClassCarryoverSummary {
  className: string;
  streamName?: string;
  totalStudents: number;
  studentsWithDebits: number;
  studentsWithCredits: number;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface CarryoverError {
  studentId: string;
  studentName: string;
  error: string;
  details?: string;
}

// School-wide arrears report
export interface ArrearsReport {
  schoolId: string;
  generatedAt: Date;
  generatedBy: string;
  asOfPeriod: AcademicPeriod;
  
  // Summary
  totalStudentsWithArrears: number;
  totalArrearsAmount: number;
  averageArrearsPerStudent: number;
  
  // Age analysis
  arrearsAging: ArrearsAgingBucket[];
  
  // By class
  arrearsByClass: ClassArrearsSummary[];
  
  // Individual student arrears
  studentArrears: StudentArrearsDetail[];
}

export interface ArrearsAgingBucket {
  label: string; // e.g., "Current Term", "1 Term Old", "2+ Terms Old"
  termCount: number;
  studentCount: number;
  totalAmount: number;
  percentage: number;
}

export interface ClassArrearsSummary {
  className: string;
  streamName?: string;
  totalStudents: number;
  studentsWithArrears: number;
  arrearsPercentage: number;
  totalArrearsAmount: number;
  averageArrears: number;
}

export interface StudentArrearsDetail {
  studentId: string;
  studentName: string;
  className: string;
  streamName?: string;
  guardianName: string;
  guardianPhone: string;
  
  // Current term
  currentTermBalance: number;
  
  // Previous terms arrears breakdown
  previousTermsArrears: PreviousTermArrears[];
  totalPreviousArrears: number;
  
  // Total
  totalOutstanding: number;
  
  // Status
  arrearsAge: number; // Number of terms
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
}

export interface PreviousTermArrears {
  period: AcademicPeriod;
  originalBalance: number;
  adjustments: number;
  currentBalance: number;
}

// Utility functions
export function formatAcademicPeriod(period: AcademicPeriod): string {
  const termNames: Record<AcademicTerm, string> = {
    term_1: 'Term I',
    term_2: 'Term II',
    term_3: 'Term III',
  };
  return `${termNames[period.term]} ${period.year}`;
}

export function compareAcademicPeriods(a: AcademicPeriod, b: AcademicPeriod): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  const termOrder: Record<AcademicTerm, number> = { term_1: 1, term_2: 2, term_3: 3 };
  return termOrder[a.term] - termOrder[b.term];
}

export function getNextTerm(current: AcademicPeriod): AcademicPeriod {
  if (current.term === 'term_3') {
    return { year: current.year + 1, term: 'term_1' };
  }
  const nextTermMap: Record<AcademicTerm, AcademicTerm> = {
    term_1: 'term_2',
    term_2: 'term_3',
    term_3: 'term_1',
  };
  return { year: current.year, term: nextTermMap[current.term] };
}

export function getPreviousTerm(current: AcademicPeriod): AcademicPeriod {
  if (current.term === 'term_1') {
    return { year: current.year - 1, term: 'term_3' };
  }
  const prevTermMap: Record<AcademicTerm, AcademicTerm> = {
    term_1: 'term_3',
    term_2: 'term_1',
    term_3: 'term_2',
  };
  return { year: current.year, term: prevTermMap[current.term] };
}

export function getTermsBetween(from: AcademicPeriod, to: AcademicPeriod): AcademicPeriod[] {
  const terms: AcademicPeriod[] = [];
  let current = from;
  
  while (compareAcademicPeriods(current, to) < 0) {
    terms.push(current);
    current = getNextTerm(current);
  }
  
  return terms;
}

export function calculateTermsInArrears(from: AcademicPeriod, to: AcademicPeriod): number {
  let count = 0;
  let current = from;
  
  while (compareAcademicPeriods(current, to) < 0) {
    count++;
    current = getNextTerm(current);
  }
  
  return count;
}

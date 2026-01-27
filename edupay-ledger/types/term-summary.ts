/**
 * End-of-Term Financial Summary Types
 * Type definitions for comprehensive term-end financial reporting
 */

// Term Summary Report
export interface TermFinancialSummary {
  id: string;
  schoolId: string;
  term: string;
  year: number;
  generatedAt: Date;
  generatedBy: string;
  status: 'draft' | 'finalized' | 'archived';

  // Date Range
  periodStart: Date;
  periodEnd: Date;

  // Student Counts
  totalStudents: number;
  activeStudents: number;
  boardingStudents: number;
  dayStudents: number;
  newEnrollments: number;
  withdrawals: number;

  // Fee Summary
  totalExpectedFees: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;

  // Breakdown by Category
  collectionByCategory: CategoryCollection[];

  // Breakdown by Class
  collectionByClass: ClassCollection[];

  // Payment Methods
  collectionByPaymentMethod: PaymentMethodCollection[];

  // Scholarship Impact
  scholarshipSummary: ScholarshipSummary;

  // Arrears Analysis
  arrearsSummary: ArrearsSummary;

  // Clearance Status
  clearanceSummary: ClearanceSummary;

  // Trends
  weeklyCollection: WeeklyCollectionData[];
  dailyAverage: number;
  peakCollectionDay: { date: Date; amount: number };

  // Notes
  notes?: string;
}

// Category Collection Breakdown
export interface CategoryCollection {
  categoryId: string;
  categoryName: string;
  expectedAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  studentCount: number;
}

// Class Collection Breakdown
export interface ClassCollection {
  classId: string;
  className: string;
  streamName?: string;
  totalStudents: number;
  expectedAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  collectionRate: number;
  fullyPaidCount: number;
  partiallyPaidCount: number;
  unpaidCount: number;
}

// Payment Method Collection
export interface PaymentMethodCollection {
  method: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
  averageTransaction: number;
}

// Scholarship Summary
export interface ScholarshipSummary {
  totalScholarships: number;
  totalBeneficiaries: number;
  totalAmountAwarded: number;
  fullScholarships: number;
  partialScholarships: number;
  bursaries: number;
  sponsorships: number;
  bySource: {
    source: string;
    count: number;
    amount: number;
  }[];
}

// Arrears Summary
export interface ArrearsSummary {
  totalArrearsFromPreviousTerm: number;
  arrearsCarriedForward: number;
  arrearsRecovered: number;
  arrearsRecoveryRate: number;
  studentsWithArrears: number;
  averageArrearsPerStudent: number;
  arrearsAgeBrackets: {
    bracket: string;
    studentCount: number;
    totalAmount: number;
  }[];
}

// Clearance Summary
export interface ClearanceSummary {
  totalEligible: number;
  cleared: number;
  notCleared: number;
  clearanceRate: number;
  clearedByClass: {
    className: string;
    total: number;
    cleared: number;
    rate: number;
  }[];
}

// Weekly Collection Data
export interface WeeklyCollectionData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  amount: number;
  transactionCount: number;
}

// Student Outstanding Report Item
export interface StudentOutstandingItem {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  lastPaymentDate?: Date;
  parentPhone?: string;
  paymentProgress: number;
  arrearsFromPreviousTerm: number;
}

// Class Performance Report
export interface ClassPerformanceReport {
  classId: string;
  className: string;
  streamName?: string;
  classTeacher?: string;
  metrics: {
    totalStudents: number;
    totalFees: number;
    totalCollected: number;
    collectionRate: number;
    averagePaymentPerStudent: number;
    fullyPaidPercentage: number;
  };
  students: StudentOutstandingItem[];
}

// Report Generation Request
export interface GenerateReportRequest {
  schoolId: string;
  term: string;
  year: number;
  includeStudentDetails: boolean;
  includeClassBreakdown: boolean;
  includePaymentMethods: boolean;
  includeScholarships: boolean;
  includeArrears: boolean;
  includeTrends: boolean;
  filterByClass?: string[];
  notes?: string;
}

// Export Format
export type ExportFormat = 'pdf' | 'excel' | 'csv';

// Report Configuration
export interface ReportConfig {
  schoolName: string;
  schoolLogo?: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  termDates: {
    start: Date;
    end: Date;
  };
  reportFooter?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateCollectionRate(collected: number, expected: number): number {
  if (expected === 0) return 0;
  return Math.round((collected / expected) * 100 * 10) / 10;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getCollectionRateColor(rate: number): string {
  if (rate >= 90) return 'text-green-600 bg-green-100';
  if (rate >= 70) return 'text-blue-600 bg-blue-100';
  if (rate >= 50) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

export function getCollectionRateLabel(rate: number): string {
  if (rate >= 90) return 'Excellent';
  if (rate >= 70) return 'Good';
  if (rate >= 50) return 'Fair';
  return 'Needs Attention';
}

export function formatTermLabel(term: string, year: number): string {
  return `${term} ${year}`;
}

export function calculateAgeingBracket(daysPastDue: number): string {
  if (daysPastDue <= 30) return '0-30 days';
  if (daysPastDue <= 60) return '31-60 days';
  if (daysPastDue <= 90) return '61-90 days';
  return '90+ days';
}

export function sortStudentsByBalance(
  students: StudentOutstandingItem[],
  order: 'asc' | 'desc' = 'desc'
): StudentOutstandingItem[] {
  return [...students].sort((a, b) =>
    order === 'desc' ? b.balance - a.balance : a.balance - b.balance
  );
}

export function filterOutstandingStudents(
  students: StudentOutstandingItem[],
  minBalance: number = 0
): StudentOutstandingItem[] {
  return students.filter((s) => s.balance >= minBalance);
}

export function groupStudentsByClass(
  students: StudentOutstandingItem[]
): { [className: string]: StudentOutstandingItem[] } {
  return students.reduce((acc, student) => {
    if (!acc[student.className]) {
      acc[student.className] = [];
    }
    acc[student.className].push(student);
    return acc;
  }, {} as { [className: string]: StudentOutstandingItem[] });
}

// Report title generators
export function generateReportTitle(
  reportType: string,
  term: string,
  year: number
): string {
  return `${reportType} - ${term} ${year}`;
}

// Date range helpers
export function getTermDateRange(
  term: string,
  year: number
): { start: Date; end: Date } {
  // Uganda school terms typically:
  // Term 1: Feb - May
  // Term 2: May - Aug
  // Term 3: Sep - Dec
  const termDates: { [key: string]: { startMonth: number; endMonth: number } } = {
    'Term 1': { startMonth: 1, endMonth: 4 },   // Feb - May
    'Term 2': { startMonth: 4, endMonth: 7 },   // May - Aug
    'Term 3': { startMonth: 8, endMonth: 11 },  // Sep - Dec
  };

  const dates = termDates[term] || { startMonth: 0, endMonth: 11 };
  
  return {
    start: new Date(year, dates.startMonth, 1),
    end: new Date(year, dates.endMonth + 1, 0), // Last day of end month
  };
}

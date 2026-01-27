/**
 * Fee Category Service
 * 
 * Manages fee categories, fee structures with category breakdown,
 * and payment allocation to categories.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db, initializeFirebase, COLLECTIONS } from '@/lib/firebase';
import {
  FeeCategory,
  FeeCategoryAmount,
  FeeStructureWithCategories,
  StudentFeeBreakdown,
  StudentFeeCategoryStatus,
  PaymentCategoryAllocation,
  PaymentWithCategories,
  CategoryCollectionReport,
  StandardFeeCategory,
  DEFAULT_FEE_CATEGORIES,
  calculateCategoryStatus,
  allocatePaymentByPriority,
  allocatePaymentProportionally,
} from '@/types/fee-category';

// Collection names
const FEE_CATEGORIES = 'fee_categories';
const FEE_STRUCTURES = 'fee_structures';
const STUDENT_FEE_BREAKDOWNS = 'student_fee_breakdowns';
const PAYMENT_ALLOCATIONS = 'payment_allocations';

// ============================================================================
// FEE CATEGORIES CRUD
// ============================================================================

/**
 * Creates default fee categories for a new school
 */
export async function initializeDefaultCategories(schoolId: string): Promise<FeeCategory[]> {
  initializeFirebase();
  
  const batch = writeBatch(db);
  const categories: FeeCategory[] = [];
  const now = Timestamp.now();

  for (const defaultCat of DEFAULT_FEE_CATEGORIES) {
    const id = `${schoolId}-${defaultCat.code}`;
    const category: FeeCategory = {
      id,
      schoolId,
      name: defaultCat.name!,
      code: defaultCat.code!,
      type: defaultCat.type!,
      description: '',
      isRequired: defaultCat.isRequired!,
      isRecurring: defaultCat.isRecurring!,
      applicableTo: defaultCat.applicableTo!,
      priority: defaultCat.priority!,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(doc(db, FEE_CATEGORIES, id), category);
    categories.push(category);
  }

  await batch.commit();
  return categories;
}

/**
 * Get all fee categories for a school
 */
export async function getFeeCategories(schoolId: string): Promise<FeeCategory[]> {
  initializeFirebase();

  const q = query(
    collection(db, FEE_CATEGORIES),
    where('schoolId', '==', schoolId),
    where('isActive', '==', true),
    orderBy('priority', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeCategory));
}

/**
 * Get a single fee category
 */
export async function getFeeCategory(categoryId: string): Promise<FeeCategory | null> {
  initializeFirebase();

  const docRef = doc(db, FEE_CATEGORIES, categoryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FeeCategory;
}

/**
 * Create a new fee category
 */
export async function createFeeCategory(
  schoolId: string,
  data: Omit<FeeCategory, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>
): Promise<FeeCategory> {
  initializeFirebase();

  const id = `${schoolId}-${data.code}-${Date.now()}`;
  const now = Timestamp.now();

  const category: FeeCategory = {
    ...data,
    id,
    schoolId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, FEE_CATEGORIES, id), category);
  return category;
}

/**
 * Update a fee category
 */
export async function updateFeeCategory(
  categoryId: string,
  updates: Partial<FeeCategory>
): Promise<void> {
  initializeFirebase();

  await updateDoc(doc(db, FEE_CATEGORIES, categoryId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Soft delete a fee category
 */
export async function deleteFeeCategory(categoryId: string): Promise<void> {
  initializeFirebase();

  await updateDoc(doc(db, FEE_CATEGORIES, categoryId), {
    isActive: false,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// FEE STRUCTURES WITH CATEGORIES
// ============================================================================

/**
 * Create a fee structure with category breakdown
 */
export async function createFeeStructure(
  schoolId: string,
  data: Omit<FeeStructureWithCategories, 'id' | 'schoolId' | 'totalAmount' | 'createdAt' | 'updatedAt'>
): Promise<FeeStructureWithCategories> {
  initializeFirebase();

  const id = `${schoolId}-fs-${Date.now()}`;
  const now = Timestamp.now();
  const totalAmount = data.categories.reduce((sum, c) => sum + c.amount, 0);

  const structure: FeeStructureWithCategories = {
    ...data,
    id,
    schoolId,
    totalAmount,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, FEE_STRUCTURES, id), structure);
  return structure;
}

/**
 * Get all fee structures for a school
 */
export async function getFeeStructures(
  schoolId: string,
  filters?: {
    academicYear?: string;
    term?: 1 | 2 | 3;
    studentType?: 'boarder' | 'day_scholar' | 'both';
  }
): Promise<FeeStructureWithCategories[]> {
  initializeFirebase();

  let q = query(
    collection(db, FEE_STRUCTURES),
    where('schoolId', '==', schoolId),
    where('isActive', '==', true)
  );

  const snapshot = await getDocs(q);
  let structures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeStructureWithCategories));

  // Apply filters
  if (filters?.academicYear) {
    structures = structures.filter(s => s.academicYear === filters.academicYear);
  }
  if (filters?.term) {
    structures = structures.filter(s => s.term === filters.term);
  }
  if (filters?.studentType && filters.studentType !== 'both') {
    structures = structures.filter(s => s.studentType === filters.studentType || s.studentType === 'both');
  }

  return structures;
}

/**
 * Get fee structure for a specific class and student type
 */
export async function getFeeStructureForStudent(
  schoolId: string,
  classId: string,
  studentType: 'boarder' | 'day_scholar',
  academicYear: string,
  term: 1 | 2 | 3
): Promise<FeeStructureWithCategories | null> {
  const structures = await getFeeStructures(schoolId, { academicYear, term });

  const applicable = structures.find(s => 
    s.applicableClasses.includes(classId) &&
    (s.studentType === studentType || s.studentType === 'both')
  );

  return applicable || null;
}

/**
 * Update a fee structure
 */
export async function updateFeeStructure(
  structureId: string,
  updates: Partial<FeeStructureWithCategories>
): Promise<void> {
  initializeFirebase();

  const updateData = { ...updates, updatedAt: Timestamp.now() };
  
  // Recalculate total if categories changed
  if (updates.categories) {
    updateData.totalAmount = updates.categories.reduce((sum, c) => sum + c.amount, 0);
  }

  await updateDoc(doc(db, FEE_STRUCTURES, structureId), updateData);
}

// ============================================================================
// STUDENT FEE BREAKDOWN
// ============================================================================

/**
 * Initialize fee breakdown for a student based on their fee structure
 */
export async function initializeStudentFeeBreakdown(
  studentId: string,
  feeStructure: FeeStructureWithCategories
): Promise<StudentFeeBreakdown> {
  initializeFirebase();

  const now = Timestamp.now();
  const id = `${studentId}-${feeStructure.academicYear}-${feeStructure.term}`;

  const categories: StudentFeeCategoryStatus[] = feeStructure.categories.map(cat => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    categoryCode: cat.categoryCode,
    amountDue: cat.amount,
    amountPaid: 0,
    balance: cat.amount,
    status: 'unpaid' as const,
    payments: [],
    amount: cat.amount,  // alias for amountDue
    paid: 0,             // alias for amountPaid
  }));

  const breakdown: StudentFeeBreakdown = {
    studentId,
    feeStructureId: feeStructure.id,
    academicYear: feeStructure.academicYear,
    term: feeStructure.term,
    categories,
    totalFees: feeStructure.totalAmount,
    totalPaid: 0,
    totalBalance: feeStructure.totalAmount,
    lastUpdated: now,
  };

  await setDoc(doc(db, STUDENT_FEE_BREAKDOWNS, id), breakdown);
  return breakdown;
}

/**
 * Get student's fee breakdown
 */
export async function getStudentFeeBreakdown(
  studentId: string,
  academicYear: string,
  term: 1 | 2 | 3
): Promise<StudentFeeBreakdown | null> {
  initializeFirebase();

  const id = `${studentId}-${academicYear}-${term}`;
  const docSnap = await getDoc(doc(db, STUDENT_FEE_BREAKDOWNS, id));

  if (!docSnap.exists()) return null;
  return docSnap.data() as StudentFeeBreakdown;
}

/**
 * Get all fee breakdowns for a student (across terms)
 */
export async function getStudentFeeHistory(studentId: string): Promise<StudentFeeBreakdown[]> {
  initializeFirebase();

  const q = query(
    collection(db, STUDENT_FEE_BREAKDOWNS),
    where('studentId', '==', studentId),
    orderBy('academicYear', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as StudentFeeBreakdown);
}

// ============================================================================
// PAYMENT ALLOCATION
// ============================================================================

/**
 * Record a payment with category allocation
 */
export async function recordPaymentWithCategories(
  payment: PaymentWithCategories,
  paymentId: string,
  receiptNumber: string,
  recordedBy: string,
  academicYear: string,
  term: 1 | 2 | 3
): Promise<PaymentCategoryAllocation> {
  initializeFirebase();

  const now = Timestamp.now();
  const breakdownId = `${payment.studentId}-${academicYear}-${term}`;

  return runTransaction(db, async (transaction) => {
    // Get current breakdown
    const breakdownRef = doc(db, STUDENT_FEE_BREAKDOWNS, breakdownId);
    const breakdownSnap = await transaction.get(breakdownRef);

    if (!breakdownSnap.exists()) {
      throw new Error('Student fee breakdown not found. Please ensure the student is enrolled.');
    }

    const breakdown = breakdownSnap.data() as StudentFeeBreakdown;
    let allocations = payment.allocations;

    // Auto-allocate if needed
    if (allocations.length === 0) {
      if (payment.allocationMethod === 'priority') {
        allocations = allocatePaymentByPriority(payment.totalAmount, breakdown.categories);
      } else {
        allocations = allocatePaymentProportionally(payment.totalAmount, breakdown.categories);
      }
    }

    // Update each category
    const updatedCategories = breakdown.categories.map(category => {
      const allocation = allocations.find(a => a.categoryId === category.categoryId);
      if (!allocation || allocation.amount === 0) return category;

      const newAmountPaid = category.amountPaid + allocation.amount;
      const newBalance = category.amountDue - newAmountPaid;

      return {
        ...category,
        amountPaid: newAmountPaid,
        balance: Math.max(0, newBalance),
        status: calculateCategoryStatus(category.amountDue, newAmountPaid),
        lastPaymentDate: now,
        payments: [
          ...category.payments,
          {
            paymentId,
            receiptNumber,
            amount: allocation.amount,
            date: now,
            recordedBy,
          },
        ],
      };
    });

    // Calculate new totals
    const totalPaid = updatedCategories.reduce((sum, c) => sum + c.amountPaid, 0);
    const totalBalance = updatedCategories.reduce((sum, c) => sum + c.balance, 0);

    // Update breakdown
    transaction.update(breakdownRef, {
      categories: updatedCategories,
      totalPaid,
      totalBalance,
      lastUpdated: now,
    });

    // Create allocation record
    const allocationRecord: PaymentCategoryAllocation = {
      paymentId,
      allocations: allocations.map(a => {
        const cat = breakdown.categories.find(c => c.categoryId === a.categoryId);
        return {
          categoryId: a.categoryId,
          categoryName: cat?.categoryName || 'Unknown',
          amount: a.amount,
        };
      }),
      allocationMethod: payment.allocationMethod,
      allocatedAt: now,
      allocatedBy: recordedBy,
    };

    const allocationRef = doc(db, PAYMENT_ALLOCATIONS, paymentId);
    transaction.set(allocationRef, allocationRecord);

    return allocationRecord;
  });
}

/**
 * Get payment allocation details
 */
export async function getPaymentAllocation(paymentId: string): Promise<PaymentCategoryAllocation | null> {
  initializeFirebase();

  const docSnap = await getDoc(doc(db, PAYMENT_ALLOCATIONS, paymentId));
  if (!docSnap.exists()) return null;
  return docSnap.data() as PaymentCategoryAllocation;
}

// ============================================================================
// REPORTS
// ============================================================================

/**
 * Generate category collection report for a school
 */
export async function generateCategoryCollectionReport(
  schoolId: string,
  academicYear: string,
  term: 1 | 2 | 3
): Promise<CategoryCollectionReport> {
  initializeFirebase();

  // Get all fee categories
  const categories = await getFeeCategories(schoolId);

  // Get all student breakdowns for this term
  const q = query(
    collection(db, STUDENT_FEE_BREAKDOWNS),
    where('academicYear', '==', academicYear)
  );

  const snapshot = await getDocs(q);
  const breakdowns = snapshot.docs
    .map(doc => doc.data() as StudentFeeBreakdown)
    .filter(b => b.term === term);

  // Aggregate by category
  const categoryStats = categories.map(category => {
    let expectedAmount = 0;
    let collectedAmount = 0;
    let studentsPaid = 0;
    let studentsPartial = 0;
    let studentsUnpaid = 0;

    breakdowns.forEach(breakdown => {
      const catStatus = breakdown.categories.find(c => c.categoryId === category.id);
      if (!catStatus) return;

      expectedAmount += catStatus.amountDue;
      collectedAmount += catStatus.amountPaid;

      if (catStatus.status === 'paid') studentsPaid++;
      else if (catStatus.status === 'partial') studentsPartial++;
      else studentsUnpaid++;
    });

    const balance = expectedAmount - collectedAmount;
    const collectionRate = expectedAmount > 0 ? (collectedAmount / expectedAmount) * 100 : 0;

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryCode: category.code,
      expectedAmount,
      collectedAmount,
      balance,
      collectionRate: Math.round(collectionRate * 100) / 100,
      studentsPaid,
      studentsPartial,
      studentsUnpaid,
    };
  });

  // Calculate totals
  const totals = {
    expectedAmount: categoryStats.reduce((sum, c) => sum + c.expectedAmount, 0),
    collectedAmount: categoryStats.reduce((sum, c) => sum + c.collectedAmount, 0),
    balance: categoryStats.reduce((sum, c) => sum + c.balance, 0),
    overallCollectionRate: 0,
  };

  totals.overallCollectionRate = totals.expectedAmount > 0
    ? Math.round((totals.collectedAmount / totals.expectedAmount) * 10000) / 100
    : 0;

  return {
    schoolId,
    academicYear,
    term,
    generatedAt: Timestamp.now(),
    categories: categoryStats,
    totals,
  };
}

/**
 * Get collection summary by category for dashboard
 */
export async function getCategoryCollectionSummary(
  schoolId: string,
  academicYear: string,
  term: 1 | 2 | 3
): Promise<{
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  collected: number;
  expected: number;
  percentage: number;
}[]> {
  const report = await generateCategoryCollectionReport(schoolId, academicYear, term);

  return report.categories.map(c => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    categoryCode: c.categoryCode,
    collected: c.collectedAmount,
    expected: c.expectedAmount,
    percentage: c.collectionRate,
  }));
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

export const mockFeeCategories: FeeCategory[] = [
  {
    id: 'cat-tuition',
    schoolId: 'school-001',
    name: 'Tuition',
    code: 'TUI',
    type: 'tuition',
    description: 'Academic instruction fees',
    isRequired: true,
    isRecurring: true,
    applicableTo: 'all',
    priority: 1,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'cat-boarding',
    schoolId: 'school-001',
    name: 'Boarding Fees',
    code: 'BRD',
    type: 'boarding',
    description: 'Accommodation and meals for boarders',
    isRequired: false,
    isRecurring: true,
    applicableTo: 'boarders',
    priority: 2,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'cat-lunch',
    schoolId: 'school-001',
    name: 'Lunch Program',
    code: 'LUN',
    type: 'lunch',
    description: 'Midday meals for day scholars',
    isRequired: false,
    isRecurring: true,
    applicableTo: 'day_scholars',
    priority: 3,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'cat-exam',
    schoolId: 'school-001',
    name: 'Examination Fees',
    code: 'EXM',
    type: 'exam_fees',
    description: 'Internal and external examination fees',
    isRequired: true,
    isRecurring: true,
    applicableTo: 'all',
    priority: 4,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'cat-computer',
    schoolId: 'school-001',
    name: 'Computer Lab',
    code: 'COM',
    type: 'computer_fees',
    description: 'Computer lab usage and IT training',
    isRequired: false,
    isRecurring: true,
    applicableTo: 'all',
    priority: 5,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'cat-development',
    schoolId: 'school-001',
    name: 'Development Levy',
    code: 'DEV',
    type: 'development_levy',
    description: 'Infrastructure development fund',
    isRequired: true,
    isRecurring: false,
    applicableTo: 'all',
    priority: 6,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

export const mockStudentFeeBreakdown: StudentFeeBreakdown = {
  studentId: 'EDU-2023-045-KC',
  feeStructureId: 'fs-001',
  academicYear: '2026',
  term: 1,
  categories: [
    {
      categoryId: 'cat-tuition',
      categoryName: 'Tuition',
      categoryCode: 'TUI',
      amountDue: 800000,
      amountPaid: 500000,
      balance: 300000,
      status: 'partial',
      lastPaymentDate: Timestamp.fromDate(new Date('2026-01-15')),
      payments: [
        { paymentId: 'pay-001', receiptNumber: 'RCP-001', amount: 300000, date: Timestamp.fromDate(new Date('2026-01-10')), recordedBy: 'Bursar' },
        { paymentId: 'pay-002', receiptNumber: 'RCP-002', amount: 200000, date: Timestamp.fromDate(new Date('2026-01-15')), recordedBy: 'Bursar' },
      ],
      amount: 800000,
      paid: 500000,
    },
    {
      categoryId: 'cat-boarding',
      categoryName: 'Boarding Fees',
      categoryCode: 'BRD',
      amountDue: 450000,
      amountPaid: 450000,
      balance: 0,
      status: 'paid',
      lastPaymentDate: Timestamp.fromDate(new Date('2026-01-10')),
      payments: [
        { paymentId: 'pay-001', receiptNumber: 'RCP-001', amount: 450000, date: Timestamp.fromDate(new Date('2026-01-10')), recordedBy: 'Bursar' },
      ],
      amount: 450000,
      paid: 450000,
    },
    {
      categoryId: 'cat-exam',
      categoryName: 'Examination Fees',
      categoryCode: 'EXM',
      amountDue: 100000,
      amountPaid: 0,
      balance: 100000,
      status: 'unpaid',
      payments: [],
      amount: 100000,
      paid: 0,
    },
    {
      categoryId: 'cat-computer',
      categoryName: 'Computer Lab',
      categoryCode: 'COM',
      amountDue: 50000,
      amountPaid: 0,
      balance: 50000,
      status: 'unpaid',
      payments: [],
      amount: 50000,
      paid: 0,
    },
    {
      categoryId: 'cat-development',
      categoryName: 'Development Levy',
      categoryCode: 'DEV',
      amountDue: 50000,
      amountPaid: 0,
      balance: 50000,
      status: 'unpaid',
      payments: [],
      amount: 50000,
      paid: 0,
    },
  ],
  totalFees: 1450000,
  totalPaid: 950000,
  totalBalance: 500000,
  lastUpdated: Timestamp.now(),
};

/**
 * Exam Clearance Service
 *
 * Firebase service for managing exam clearance in Ugandan schools.
 * Handles threshold configuration, clearance checking, and report generation.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ClearanceThreshold,
  StudentClearance,
  ClearanceReport,
  ClearanceCheckResult,
  ClearanceStatus,
  ClearanceHistoryEntry,
  StudentClearanceSummary,
  DEFAULT_CLEARANCE_THRESHOLDS,
  checkClearanceEligibility,
} from "@/types/exam-clearance";

// ============================================================================
// CLEARANCE THRESHOLDS MANAGEMENT
// ============================================================================

/**
 * Initialize default clearance thresholds for a school
 */
export async function initializeDefaultThresholds(
  schoolId: string,
): Promise<void> {
  const batch = writeBatch(db);
  const thresholdsRef = collection(
    db,
    "schools",
    schoolId,
    "clearanceThresholds",
  );

  for (const threshold of DEFAULT_CLEARANCE_THRESHOLDS) {
    const docRef = doc(thresholdsRef);
    batch.set(docRef, {
      ...threshold,
      id: docRef.id,
      schoolId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

/**
 * Get all clearance thresholds for a school
 */
export async function getClearanceThresholds(
  schoolId: string,
): Promise<ClearanceThreshold[]> {
  const thresholdsRef = collection(
    db,
    "schools",
    schoolId,
    "clearanceThresholds",
  );
  const q = query(
    thresholdsRef,
    where("isActive", "==", true),
    orderBy("examType"),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) =>
      ({
        ...doc.data(),
        id: doc.id,
      }) as ClearanceThreshold,
  );
}

/**
 * Create or update a clearance threshold
 */
export async function saveClearanceThreshold(
  schoolId: string,
  threshold: Omit<
    ClearanceThreshold,
    "id" | "schoolId" | "createdAt" | "updatedAt"
  >,
  existingId?: string,
): Promise<ClearanceThreshold> {
  const thresholdsRef = collection(
    db,
    "schools",
    schoolId,
    "clearanceThresholds",
  );
  const docRef = existingId
    ? doc(thresholdsRef, existingId)
    : doc(thresholdsRef);

  const data = {
    ...threshold,
    id: docRef.id,
    schoolId,
    updatedAt: Timestamp.now(),
    ...(existingId ? {} : { createdAt: Timestamp.now() }),
  };

  await setDoc(docRef, data, { merge: true });

  return data as ClearanceThreshold;
}

/**
 * Delete a clearance threshold
 */
export async function deleteClearanceThreshold(
  schoolId: string,
  thresholdId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, "schools", schoolId, "clearanceThresholds", thresholdId),
  );
}

// ============================================================================
// STUDENT CLEARANCE MANAGEMENT
// ============================================================================

/**
 * Check clearance for a single student
 */
export async function checkStudentClearance(
  schoolId: string,
  studentId: string,
  examType: string,
  academicYear: string,
  term: 1 | 2 | 3,
): Promise<ClearanceCheckResult> {
  // Get the student's fee breakdown
  const studentRef = doc(db, "students", studentId);
  const studentDoc = await getDoc(studentRef);

  if (!studentDoc.exists()) {
    throw new Error("Student not found");
  }

  const student = studentDoc.data();

  // Get applicable threshold
  const thresholds = await getClearanceThresholds(schoolId);
  const threshold = thresholds.find(
    (t) =>
      (t.examType === examType || t.examType === "all") &&
      (t.term === term || t.term === "all") &&
      (t.applicableClasses.length === 0 ||
        t.applicableClasses.includes(student.classId)),
  );

  if (!threshold) {
    // No threshold configured - default to cleared
    return {
      studentId,
      canSitForExam: true,
      status: "cleared",
      paymentPercentage: student.paymentProgress || 0,
      amountNeeded: 0,
      missingCategories: [],
      recommendations: [],
    };
  }

  // Get fee breakdown to check category payments
  const breakdownRef = doc(
    db,
    "students",
    studentId,
    "feeBreakdowns",
    `${academicYear}-${term}`,
  );
  const breakdownDoc = await getDoc(breakdownRef);

  interface PaymentCategoryBreakdown {
    categoryCode: string;
    status: string;
    [key: string]: unknown;
  }

  let examFeesPaid = false;
  let requiredCategoriesPaid = true;

  if (breakdownDoc.exists()) {
    const breakdown = breakdownDoc.data() as {
      categories?: PaymentCategoryBreakdown[];
    };
    examFeesPaid =
      breakdown.categories?.some(
        (c: PaymentCategoryBreakdown) =>
          c.categoryCode === "EXM" && c.status === "fully_paid",
      ) || false;

    // Check all required categories
    for (const categoryCode of threshold.minCategoriesRequired) {
      const category = breakdown.categories?.find(
        (c: PaymentCategoryBreakdown) =>
          c.categoryCode === categoryCode.toUpperCase(),
      );
      if (!category || category.status !== "fully_paid") {
        requiredCategoriesPaid = false;
        break;
      }
    }
  }

  const result = checkClearanceEligibility(
    student.paymentProgress || 0,
    threshold,
    examFeesPaid,
    requiredCategoriesPaid,
  );

  return {
    ...result,
    studentId,
  };
}

/**
 * Get or create a student clearance record
 */
export async function getStudentClearance(
  studentId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
): Promise<StudentClearance | null> {
  const clearanceRef = collection(db, "clearances");
  const q = query(
    clearanceRef,
    where("studentId", "==", studentId),
    where("academicYear", "==", academicYear),
    where("term", "==", term),
    where("examType", "==", examType),
    limit(1),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as StudentClearance;
}

/**
 * Update student clearance status
 */
export async function updateStudentClearance(
  schoolId: string,
  studentId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
  updates: Partial<StudentClearance>,
  performedBy: string,
): Promise<StudentClearance> {
  // Find existing clearance
  let clearance = await getStudentClearance(
    studentId,
    academicYear,
    term,
    examType,
  );

  const clearanceRef = clearance
    ? doc(db, "clearances", clearance.id)
    : doc(collection(db, "clearances"));

  // Create history entry
  const historyEntry: ClearanceHistoryEntry = {
    action:
      updates.status === "cleared"
        ? "cleared"
        : updates.status === "blocked"
          ? "blocked"
          : updates.status === "conditional"
            ? "conditional"
            : updates.status === "exempt"
              ? "exempted"
              : "reviewed",
    timestamp: Timestamp.now(),
    performedBy,
    previousStatus: clearance?.status,
    newStatus: updates.status || clearance?.status,
    notes: updates.notes,
  };

  const data: Partial<StudentClearance> = {
    ...updates,
    id: clearanceRef.id,
    schoolId,
    studentId,
    academicYear,
    term,
    examType,
    history: [...(clearance?.history || []), historyEntry],
    updatedAt: Timestamp.now(),
    ...(clearance ? {} : { createdAt: Timestamp.now() }),
  };

  if (updates.status === "cleared" && !clearance?.clearedAt) {
    data.clearedAt = Timestamp.now();
    data.clearedBy = performedBy;
  }

  await setDoc(clearanceRef, data, { merge: true });

  return { ...clearance, ...data } as StudentClearance;
}

/**
 * Grant conditional clearance
 */
export async function grantConditionalClearance(
  schoolId: string,
  studentId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
  conditionalDetails: {
    promiseAmount: number;
    promiseDate: Date;
    promisedBy: string;
  },
  approvedBy: string,
): Promise<StudentClearance> {
  return updateStudentClearance(
    schoolId,
    studentId,
    academicYear,
    term,
    examType,
    {
      status: "conditional",
      isConditional: true,
      conditionalDetails: {
        promiseAmount: conditionalDetails.promiseAmount,
        promiseDate: Timestamp.fromDate(conditionalDetails.promiseDate),
        promisedBy: conditionalDetails.promisedBy,
        approvedBy,
        fulfilled: false,
      },
      notes: `Conditional clearance granted. Promise: ${conditionalDetails.promiseAmount.toLocaleString()} by ${conditionalDetails.promiseDate.toLocaleDateString()}`,
    },
    approvedBy,
  );
}

/**
 * Grant exemption
 */
export async function grantExemption(
  schoolId: string,
  studentId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
  exemptionDetails: {
    reason: string;
    documentRef?: string;
  },
  approvedBy: string,
): Promise<StudentClearance> {
  return updateStudentClearance(
    schoolId,
    studentId,
    academicYear,
    term,
    examType,
    {
      status: "exempt",
      isExempt: true,
      exemptionDetails: {
        reason: exemptionDetails.reason,
        approvedBy,
        approvedAt: Timestamp.now(),
        documentRef: exemptionDetails.documentRef,
      },
      notes: `Exemption granted: ${exemptionDetails.reason}`,
    },
    approvedBy,
  );
}

/**
 * Mark conditional clearance as fulfilled
 */
export async function fulfillConditionalClearance(
  schoolId: string,
  studentId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
  performedBy: string,
): Promise<StudentClearance> {
  const clearance = await getStudentClearance(
    studentId,
    academicYear,
    term,
    examType,
  );

  if (!clearance?.isConditional || !clearance.conditionalDetails) {
    throw new Error("No conditional clearance found");
  }

  return updateStudentClearance(
    schoolId,
    studentId,
    academicYear,
    term,
    examType,
    {
      status: "cleared",
      conditionalDetails: {
        ...clearance.conditionalDetails,
        fulfilled: true,
        fulfilledAt: Timestamp.now(),
      },
      notes: "Conditional clearance fulfilled - payment received",
    },
    performedBy,
  );
}

// ============================================================================
// BATCH CLEARANCE PROCESSING
// ============================================================================

/**
 * Process clearance for all students in a class
 */
export async function processClassClearance(
  schoolId: string,
  classId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
  performedBy: string,
): Promise<{ processed: number; cleared: number; blocked: number }> {
  // Get all students in the class
  const studentsRef = collection(db, "students");
  const q = query(
    studentsRef,
    where("schoolId", "==", schoolId),
    where("classId", "==", classId),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(q);
  let processed = 0;
  let cleared = 0;
  let blocked = 0;

  for (const studentDoc of snapshot.docs) {
    const student = studentDoc.data();
    const result = await checkStudentClearance(
      schoolId,
      studentDoc.id,
      examType,
      academicYear,
      term,
    );

    await updateStudentClearance(
      schoolId,
      studentDoc.id,
      academicYear,
      term,
      examType,
      {
        studentId: studentDoc.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber,
        classId: student.classId,
        className: student.className,
        totalFees: student.totalFees || 0,
        amountPaid: student.amountPaid || 0,
        balance: student.balance || 0,
        paymentPercentage: student.paymentProgress || 0,
        status: result.status,
        examFeesPaid: result.missingCategories.length === 0,
        requiredCategoriesPaid: result.missingCategories.length === 0,
        isConditional: false,
        isExempt: false,
      },
      performedBy,
    );

    processed++;
    if (result.canSitForExam) cleared++;
    else blocked++;
  }

  return { processed, cleared, blocked };
}

// ============================================================================
// CLEARANCE REPORTS
// ============================================================================

/**
 * Generate clearance report for the school
 */
export async function generateClearanceReport(
  schoolId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  examType: string,
  generatedBy: string,
): Promise<ClearanceReport> {
  const clearancesRef = collection(db, "clearances");
  const q = query(
    clearancesRef,
    where("schoolId", "==", schoolId),
    where("academicYear", "==", academicYear),
    where("term", "==", term),
    where("examType", "==", examType),
  );

  const snapshot = await getDocs(q);
  const clearances = snapshot.docs.map((doc) => doc.data() as StudentClearance);

  // Calculate summary
  const cleared = clearances.filter((c) => c.status === "cleared");
  const conditional = clearances.filter((c) => c.status === "conditional");
  const blocked = clearances.filter((c) => c.status === "blocked");
  const exempt = clearances.filter((c) => c.status === "exempt");
  const pending = clearances.filter((c) => c.status === "pending_review");

  const totalExpected = clearances.reduce(
    (sum, c) => sum + (c.totalFees || 0),
    0,
  );
  const totalCollected = clearances.reduce(
    (sum, c) => sum + (c.amountPaid || 0),
    0,
  );

  // Group by class
  const byClassMap = new Map<string, typeof clearances>();
  clearances.forEach((c) => {
    if (!byClassMap.has(c.classId)) {
      byClassMap.set(c.classId, []);
    }
    byClassMap.get(c.classId)!.push(c);
  });

  const byClass = Array.from(byClassMap.entries())
    .map(([classId, students]) => {
      const classCleared = students.filter(
        (s) =>
          s.status === "cleared" ||
          s.status === "conditional" ||
          s.status === "exempt",
      );
      return {
        classId,
        className: students[0]?.className || classId,
        totalStudents: students.length,
        cleared: classCleared.length,
        blocked: students.length - classCleared.length,
        clearanceRate:
          students.length > 0
            ? (classCleared.length / students.length) * 100
            : 0,
        collected: students.reduce((sum, s) => sum + (s.amountPaid || 0), 0),
        outstanding: students.reduce((sum, s) => sum + (s.balance || 0), 0),
      };
    })
    .sort((a, b) => a.className.localeCompare(b.className));

  // Create student summaries
  const toSummary = (c: StudentClearance): StudentClearanceSummary => ({
    studentId: c.studentId,
    studentName: c.studentName,
    studentNumber: c.studentNumber,
    className: c.className,
    totalFees: c.totalFees,
    amountPaid: c.amountPaid,
    balance: c.balance,
    paymentPercentage: c.paymentPercentage,
    status: c.status,
    examFeesPaid: c.examFeesPaid,
    notes: c.notes,
    conditionalDeadline: c.conditionalDetails?.promiseDate,
  });

  const report: ClearanceReport = {
    id: `${schoolId}-${academicYear}-${term}-${examType}`,
    schoolId,
    academicYear,
    term,
    examType,
    generatedAt: Timestamp.now(),
    generatedBy,
    summary: {
      totalStudents: clearances.length,
      cleared: cleared.length,
      conditional: conditional.length,
      blocked: blocked.length,
      exempt: exempt.length,
      pendingReview: pending.length,
      clearanceRate:
        clearances.length > 0
          ? ((cleared.length + conditional.length + exempt.length) /
              clearances.length) *
            100
          : 0,
      averagePaymentPercentage:
        clearances.length > 0
          ? clearances.reduce((sum, c) => sum + c.paymentPercentage, 0) /
            clearances.length
          : 0,
      totalExpected,
      totalCollected,
      totalOutstanding: totalExpected - totalCollected,
    },
    byClass,
    clearedStudents: cleared.map(toSummary),
    conditionalStudents: conditional.map(toSummary),
    blockedStudents: blocked.map(toSummary),
    exemptStudents: exempt.map(toSummary),
  };

  // Save the report
  await setDoc(
    doc(db, "schools", schoolId, "clearanceReports", report.id),
    report,
  );

  return report;
}

/**
 * Get clearance statistics for dashboard
 */
export async function getClearanceStats(
  schoolId: string,
  academicYear: string,
  term: 1 | 2 | 3,
): Promise<{
  totalStudents: number;
  cleared: number;
  blocked: number;
  conditional: number;
  clearanceRate: number;
}> {
  const clearancesRef = collection(db, "clearances");
  const q = query(
    clearancesRef,
    where("schoolId", "==", schoolId),
    where("academicYear", "==", academicYear),
    where("term", "==", term),
  );

  const snapshot = await getDocs(q);
  const clearances = snapshot.docs.map((doc) => doc.data() as StudentClearance);

  const cleared = clearances.filter(
    (c) => c.status === "cleared" || c.status === "exempt",
  ).length;
  const blocked = clearances.filter((c) => c.status === "blocked").length;
  const conditional = clearances.filter(
    (c) => c.status === "conditional",
  ).length;

  return {
    totalStudents: clearances.length,
    cleared,
    blocked,
    conditional,
    clearanceRate:
      clearances.length > 0 ? (cleared / clearances.length) * 100 : 0,
  };
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

export const mockClearanceThresholds: ClearanceThreshold[] = [
  {
    id: "threshold-1",
    schoolId: "school-001",
    name: "End of Term Clearance",
    description: "Minimum 70% payment required for end of term exams",
    minPaymentPercentage: 70,
    minCategoriesRequired: ["exam_fees"],
    examType: "end_of_term",
    term: "all",
    academicYear: "2026",
    applicableClasses: [],
    isActive: true,
    allowConditionalClearance: true,
    conditionalMaxDays: 7,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: "threshold-2",
    schoolId: "school-001",
    name: "National Exam Clearance",
    description: "100% payment required for national exams",
    minPaymentPercentage: 100,
    minCategoriesRequired: ["exam_fees", "tuition"],
    examType: "national",
    term: 3,
    academicYear: "2026",
    applicableClasses: ["S4", "S6"],
    isActive: true,
    allowConditionalClearance: false,
    conditionalMaxDays: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

export const mockClearanceReport: ClearanceReport = {
  id: "report-2026-1-end_of_term",
  schoolId: "school-001",
  academicYear: "2026",
  term: 1,
  examType: "end_of_term",
  generatedAt: Timestamp.now(),
  generatedBy: "admin",
  summary: {
    totalStudents: 450,
    cleared: 342,
    conditional: 35,
    blocked: 58,
    exempt: 15,
    pendingReview: 0,
    clearanceRate: 87.1,
    averagePaymentPercentage: 78.5,
    totalExpected: 652500000,
    totalCollected: 512462500,
    totalOutstanding: 140037500,
  },
  byClass: [
    {
      classId: "S1",
      className: "Senior 1",
      totalStudents: 120,
      cleared: 98,
      blocked: 22,
      clearanceRate: 81.7,
      collected: 130000000,
      outstanding: 38000000,
    },
    {
      classId: "S2",
      className: "Senior 2",
      totalStudents: 115,
      cleared: 89,
      blocked: 26,
      clearanceRate: 77.4,
      collected: 125000000,
      outstanding: 42000000,
    },
    {
      classId: "S3",
      className: "Senior 3",
      totalStudents: 108,
      cleared: 92,
      blocked: 16,
      clearanceRate: 85.2,
      collected: 132000000,
      outstanding: 32000000,
    },
    {
      classId: "S4",
      className: "Senior 4",
      totalStudents: 107,
      cleared: 98,
      blocked: 9,
      clearanceRate: 91.6,
      collected: 125462500,
      outstanding: 28037500,
    },
  ],
  clearedStudents: [
    {
      studentId: "STU001",
      studentName: "Nakato Sarah",
      studentNumber: "2024/001",
      className: "S4",
      totalFees: 1450000,
      amountPaid: 1450000,
      balance: 0,
      paymentPercentage: 100,
      status: "cleared",
      examFeesPaid: true,
    },
    {
      studentId: "STU002",
      studentName: "Mukasa John",
      studentNumber: "2024/002",
      className: "S4",
      totalFees: 1450000,
      amountPaid: 1200000,
      balance: 250000,
      paymentPercentage: 82.8,
      status: "cleared",
      examFeesPaid: true,
    },
  ],
  conditionalStudents: [
    {
      studentId: "STU010",
      studentName: "Nambi Grace",
      studentNumber: "2024/010",
      className: "S3",
      totalFees: 1450000,
      amountPaid: 900000,
      balance: 550000,
      paymentPercentage: 62.1,
      status: "conditional",
      examFeesPaid: true,
      conditionalDeadline: Timestamp.fromDate(new Date("2026-02-15")),
    },
  ],
  blockedStudents: [
    {
      studentId: "STU020",
      studentName: "Kato Peter",
      studentNumber: "2024/020",
      className: "S2",
      totalFees: 1450000,
      amountPaid: 500000,
      balance: 950000,
      paymentPercentage: 34.5,
      status: "blocked",
      examFeesPaid: false,
    },
  ],
  exemptStudents: [
    {
      studentId: "STU030",
      studentName: "Achieng Rose",
      studentNumber: "2024/030",
      className: "S4",
      totalFees: 1450000,
      amountPaid: 0,
      balance: 1450000,
      paymentPercentage: 0,
      status: "exempt",
      examFeesPaid: true,
      notes: "Full government scholarship",
    },
  ],
};

/**
 * Term Balance Carryover Service
 * Handles automatic balance carry-forward between academic terms
 * Essential for Ugandan schools with multi-term payment tracking
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  TermBalanceCarryover,
  StudentCumulativeBalance,
  CarryoverOptions,
  CarryoverProcessingResult,
  ArrearsReport,
  AcademicPeriod,
  BalanceAdjustment,
  ClassCarryoverSummary,
  ArrearsAgingBucket,
  ClassArrearsSummary,
  StudentArrearsDetail,
  PreviousTermArrears,
  formatAcademicPeriod,
  compareAcademicPeriods,
  getPreviousTerm,
  calculateTermsInArrears,
} from '../../types/term-balance';

const CARRYOVERS_COLLECTION = 'term_carryovers';
const STUDENTS_COLLECTION = 'students';

/**
 * Generate a unique carryover ID
 */
function generateCarryoverId(studentId: string, fromPeriod: AcademicPeriod, toPeriod: AcademicPeriod): string {
  return `${studentId}_${fromPeriod.year}_${fromPeriod.term}_to_${toPeriod.year}_${toPeriod.term}`;
}

/**
 * Get all carryovers for a school
 */
export async function getSchoolCarryovers(
  schoolId: string,
  period?: AcademicPeriod
): Promise<TermBalanceCarryover[]> {
  try {
    let q = query(
      collection(db, CARRYOVERS_COLLECTION),
      where('schoolId', '==', schoolId),
      orderBy('createdAt', 'desc')
    );

    if (period) {
      q = query(
        collection(db, CARRYOVERS_COLLECTION),
        where('schoolId', '==', schoolId),
        where('toPeriod.year', '==', period.year),
        where('toPeriod.term', '==', period.term)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      appliedAt: doc.data().appliedAt?.toDate(),
    })) as TermBalanceCarryover[];
  } catch (error) {
    console.error('Error fetching carryovers:', error);
    throw error;
  }
}

/**
 * Get carryover history for a specific student
 */
export async function getStudentCarryovers(
  schoolId: string,
  studentId: string
): Promise<TermBalanceCarryover[]> {
  try {
    const q = query(
      collection(db, CARRYOVERS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('studentId', '==', studentId),
      orderBy('toPeriod.year', 'desc'),
      orderBy('toPeriod.term', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      appliedAt: doc.data().appliedAt?.toDate(),
    })) as TermBalanceCarryover[];
  } catch (error) {
    console.error('Error fetching student carryovers:', error);
    throw error;
  }
}

/**
 * Get student's cumulative balance across all terms
 */
export async function getStudentCumulativeBalance(
  schoolId: string,
  studentId: string,
  currentPeriod: AcademicPeriod
): Promise<StudentCumulativeBalance | null> {
  try {
    // Get student data
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
    if (!studentDoc.exists()) {
      return null;
    }
    const student = studentDoc.data();

    // Get all carryovers for this student
    const carryovers = await getStudentCarryovers(schoolId, studentId);

    // Calculate totals
    let carryoverBalance = 0;
    let carryoverCredits = 0;
    let arrearsCount = 0;
    let oldestArrears: AcademicPeriod | undefined;

    carryovers.forEach(carryover => {
      if (carryover.status === 'applied' || carryover.status === 'pending') {
        if (carryover.carryoverType === 'debit') {
          carryoverBalance += carryover.adjustedAmount;
          arrearsCount++;
          if (!oldestArrears || compareAcademicPeriods(carryover.fromPeriod, oldestArrears) < 0) {
            oldestArrears = carryover.fromPeriod;
          }
        } else {
          carryoverCredits += carryover.adjustedAmount;
        }
      }
    });

    const currentTermBalance = student.balance || 0;
    const totalOutstanding = currentTermBalance + carryoverBalance - carryoverCredits;

    return {
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      className: student.className,
      streamName: student.streamName,
      currentPeriod,
      currentTermFees: student.totalFees || 0,
      currentTermPaid: student.amountPaid || 0,
      currentTermBalance,
      carryoverBalance,
      carryoverCredits,
      totalOutstanding,
      carryoverHistory: carryovers,
      hasArrears: totalOutstanding > 0,
      arrearsCount,
      oldestArrears,
    };
  } catch (error) {
    console.error('Error getting cumulative balance:', error);
    throw error;
  }
}

/**
 * Process term-end carryovers for all students
 */
export async function processTermCarryovers(
  options: CarryoverOptions,
  processedBy: string
): Promise<CarryoverProcessingResult> {
  const result: CarryoverProcessingResult = {
    schoolId: options.schoolId,
    fromPeriod: options.fromPeriod,
    toPeriod: options.toPeriod,
    processedAt: new Date(),
    processedBy,
    totalStudentsProcessed: 0,
    studentsWithDebits: 0,
    studentsWithCredits: 0,
    studentsCleared: 0,
    totalDebitCarryover: 0,
    totalCreditCarryover: 0,
    netCarryover: 0,
    classBreakdown: [],
    carryovers: [],
    errors: [],
  };

  try {
    // Build query for students
    let studentsQuery = query(
      collection(db, STUDENTS_COLLECTION),
      where('schoolId', '==', options.schoolId)
    );

    const studentsSnapshot = await getDocs(studentsQuery);
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by class/stream if specified
    let filteredStudents = students;
    if (options.classFilter && options.classFilter.length > 0) {
      filteredStudents = filteredStudents.filter(s => 
        options.classFilter!.includes((s as any).className)
      );
    }
    if (options.streamFilter && options.streamFilter.length > 0) {
      filteredStudents = filteredStudents.filter(s => 
        options.streamFilter!.includes((s as any).streamName)
      );
    }

    // Process each student
    const batch = writeBatch(db);
    const classMap = new Map<string, ClassCarryoverSummary>();

    for (const student of filteredStudents) {
      const studentData = student as any;
      
      try {
        const balance = studentData.balance || 0;
        
        // Skip if balance is below minimum threshold
        if (options.minBalance && Math.abs(balance) < options.minBalance) {
          result.studentsCleared++;
          continue;
        }

        // Determine carryover type and amount
        let carryoverAmount: number;
        let carryoverType: 'debit' | 'credit';

        if (balance > 0) {
          // Student owes money
          carryoverAmount = balance;
          carryoverType = 'debit';
          result.studentsWithDebits++;
          result.totalDebitCarryover += balance;
        } else if (balance < 0 && options.includeCredits) {
          // Student overpaid - carry as credit
          carryoverAmount = Math.abs(balance);
          carryoverType = 'credit';
          result.studentsWithCredits++;
          result.totalCreditCarryover += carryoverAmount;
        } else {
          // Balance is zero or credits not included
          result.studentsCleared++;
          continue;
        }

        // Create carryover record
        const carryoverId = generateCarryoverId(student.id, options.fromPeriod, options.toPeriod);
        const carryover: TermBalanceCarryover = {
          id: carryoverId,
          schoolId: options.schoolId,
          studentId: student.id,
          studentName: `${studentData.firstName} ${studentData.lastName}`,
          className: studentData.className,
          streamName: studentData.streamName,
          fromPeriod: options.fromPeriod,
          fromTermFees: studentData.totalFees || 0,
          fromTermPaid: studentData.amountPaid || 0,
          fromTermBalance: balance,
          toPeriod: options.toPeriod,
          carryoverAmount,
          carryoverType,
          adjustments: [],
          adjustedAmount: carryoverAmount,
          status: options.autoApply ? 'applied' : 'pending',
          appliedAt: options.autoApply ? new Date() : undefined,
          appliedBy: options.autoApply ? processedBy : undefined,
          createdAt: new Date(),
          createdBy: processedBy,
          updatedAt: new Date(),
        };

        // Add to batch
        const carryoverRef = doc(db, CARRYOVERS_COLLECTION, carryoverId);
        batch.set(carryoverRef, {
          ...carryover,
          createdAt: Timestamp.fromDate(carryover.createdAt),
          updatedAt: Timestamp.fromDate(carryover.updatedAt),
          appliedAt: carryover.appliedAt ? Timestamp.fromDate(carryover.appliedAt) : null,
        });

        result.carryovers.push(carryover);

        // Update class breakdown
        const classKey = `${studentData.className}_${studentData.streamName || ''}`;
        if (!classMap.has(classKey)) {
          classMap.set(classKey, {
            className: studentData.className,
            streamName: studentData.streamName,
            totalStudents: 0,
            studentsWithDebits: 0,
            studentsWithCredits: 0,
            totalDebit: 0,
            totalCredit: 0,
            netBalance: 0,
          });
        }
        const classSummary = classMap.get(classKey)!;
        classSummary.totalStudents++;
        if (carryoverType === 'debit') {
          classSummary.studentsWithDebits++;
          classSummary.totalDebit += carryoverAmount;
        } else {
          classSummary.studentsWithCredits++;
          classSummary.totalCredit += carryoverAmount;
        }
        classSummary.netBalance = classSummary.totalDebit - classSummary.totalCredit;

      } catch (studentError) {
        result.errors.push({
          studentId: student.id,
          studentName: `${studentData.firstName} ${studentData.lastName}`,
          error: 'Processing failed',
          details: (studentError as Error).message,
        });
      }

      result.totalStudentsProcessed++;
    }

    // Commit batch
    await batch.commit();

    // Finalize results
    result.netCarryover = result.totalDebitCarryover - result.totalCreditCarryover;
    result.classBreakdown = Array.from(classMap.values());

    return result;
  } catch (error) {
    console.error('Error processing carryovers:', error);
    throw error;
  }
}

/**
 * Apply a balance adjustment to a carryover
 */
export async function applyBalanceAdjustment(
  carryoverId: string,
  adjustment: Omit<BalanceAdjustment, 'id'>
): Promise<TermBalanceCarryover> {
  try {
    const carryoverRef = doc(db, CARRYOVERS_COLLECTION, carryoverId);
    const carryoverDoc = await getDoc(carryoverRef);

    if (!carryoverDoc.exists()) {
      throw new Error('Carryover not found');
    }

    const carryover = carryoverDoc.data() as TermBalanceCarryover;
    const newAdjustment: BalanceAdjustment = {
      ...adjustment,
      id: `adj_${Date.now()}`,
    };

    const updatedAdjustments = [...(carryover.adjustments || []), newAdjustment];
    
    // Calculate new adjusted amount
    const totalAdjustments = updatedAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    const adjustedAmount = Math.max(0, carryover.carryoverAmount - totalAdjustments);

    await updateDoc(carryoverRef, {
      adjustments: updatedAdjustments,
      adjustedAmount,
      updatedAt: Timestamp.now(),
    });

    return {
      ...carryover,
      adjustments: updatedAdjustments,
      adjustedAmount,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error applying adjustment:', error);
    throw error;
  }
}

/**
 * Waive a carryover balance
 */
export async function waiveCarryover(
  carryoverId: string,
  reason: string,
  waivedBy: string
): Promise<TermBalanceCarryover> {
  try {
    const carryoverRef = doc(db, CARRYOVERS_COLLECTION, carryoverId);
    const carryoverDoc = await getDoc(carryoverRef);

    if (!carryoverDoc.exists()) {
      throw new Error('Carryover not found');
    }

    const carryover = carryoverDoc.data() as TermBalanceCarryover;

    // Add waiver adjustment
    const waiverAdjustment: BalanceAdjustment = {
      id: `waiver_${Date.now()}`,
      type: 'waiver',
      amount: carryover.adjustedAmount,
      reason,
      approvedBy: waivedBy,
      approvedAt: new Date(),
    };

    await updateDoc(carryoverRef, {
      status: 'waived',
      adjustments: [...(carryover.adjustments || []), waiverAdjustment],
      adjustedAmount: 0,
      updatedAt: Timestamp.now(),
    });

    return {
      ...carryover,
      status: 'waived',
      adjustments: [...(carryover.adjustments || []), waiverAdjustment],
      adjustedAmount: 0,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error waiving carryover:', error);
    throw error;
  }
}

/**
 * Generate arrears report for the school
 */
export async function generateArrearsReport(
  schoolId: string,
  asOfPeriod: AcademicPeriod,
  generatedBy: string
): Promise<ArrearsReport> {
  try {
    // Get all students with their carryovers
    const studentsQuery = query(
      collection(db, STUDENTS_COLLECTION),
      where('schoolId', '==', schoolId)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    const carryoversQuery = query(
      collection(db, CARRYOVERS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('status', 'in', ['pending', 'applied'])
    );
    const carryoversSnapshot = await getDocs(carryoversQuery);
    
    // Group carryovers by student
    const carryoversByStudent = new Map<string, TermBalanceCarryover[]>();
    carryoversSnapshot.docs.forEach(doc => {
      const carryover = doc.data() as TermBalanceCarryover;
      const existing = carryoversByStudent.get(carryover.studentId) || [];
      existing.push(carryover);
      carryoversByStudent.set(carryover.studentId, existing);
    });

    // Build report
    const report: ArrearsReport = {
      schoolId,
      generatedAt: new Date(),
      generatedBy,
      asOfPeriod,
      totalStudentsWithArrears: 0,
      totalArrearsAmount: 0,
      averageArrearsPerStudent: 0,
      arrearsAging: [],
      arrearsByClass: [],
      studentArrears: [],
    };

    const agingMap = new Map<number, { count: number; amount: number }>();
    const classMap = new Map<string, ClassArrearsSummary>();

    for (const studentDoc of studentsSnapshot.docs) {
      const student = studentDoc.data();
      const studentId = studentDoc.id;
      const carryovers = carryoversByStudent.get(studentId) || [];
      
      // Calculate current term balance
      const currentTermBalance = student.balance || 0;
      
      // Calculate previous terms arrears
      const previousTermsArrears: PreviousTermArrears[] = [];
      let totalPreviousArrears = 0;
      let oldestArrearsAge = 0;

      carryovers
        .filter(c => c.carryoverType === 'debit' && c.adjustedAmount > 0)
        .sort((a, b) => compareAcademicPeriods(a.fromPeriod, b.fromPeriod))
        .forEach(c => {
          const adjustments = (c.adjustments || []).reduce((sum, adj) => sum + adj.amount, 0);
          previousTermsArrears.push({
            period: c.fromPeriod,
            originalBalance: c.carryoverAmount,
            adjustments,
            currentBalance: c.adjustedAmount,
          });
          totalPreviousArrears += c.adjustedAmount;
          
          const age = calculateTermsInArrears(c.fromPeriod, asOfPeriod);
          if (age > oldestArrearsAge) {
            oldestArrearsAge = age;
          }
        });

      const totalOutstanding = currentTermBalance + totalPreviousArrears;

      // Only include students with arrears
      if (totalOutstanding <= 0) continue;

      report.totalStudentsWithArrears++;
      report.totalArrearsAmount += totalOutstanding;

      // Add to aging buckets
      const agingKey = Math.min(oldestArrearsAge, 3); // Cap at 3+ terms
      const existing = agingMap.get(agingKey) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += totalOutstanding;
      agingMap.set(agingKey, existing);

      // Add to class summary
      const classKey = `${student.className}_${student.streamName || ''}`;
      if (!classMap.has(classKey)) {
        classMap.set(classKey, {
          className: student.className,
          streamName: student.streamName,
          totalStudents: 0,
          studentsWithArrears: 0,
          arrearsPercentage: 0,
          totalArrearsAmount: 0,
          averageArrears: 0,
        });
      }
      const classSummary = classMap.get(classKey)!;
      classSummary.totalStudents++;
      classSummary.studentsWithArrears++;
      classSummary.totalArrearsAmount += totalOutstanding;

      // Add student detail
      report.studentArrears.push({
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        className: student.className,
        streamName: student.streamName,
        guardianName: student.guardian?.name || '',
        guardianPhone: student.guardian?.phone || '',
        currentTermBalance,
        previousTermsArrears,
        totalPreviousArrears,
        totalOutstanding,
        arrearsAge: oldestArrearsAge,
        lastPaymentDate: student.lastPaymentDate?.toDate(),
        lastPaymentAmount: student.lastPaymentAmount,
      });
    }

    // Calculate averages and percentages
    if (report.totalStudentsWithArrears > 0) {
      report.averageArrearsPerStudent = report.totalArrearsAmount / report.totalStudentsWithArrears;
    }

    // Build aging buckets
    const agingLabels = ['Current Term', '1 Term Old', '2 Terms Old', '3+ Terms Old'];
    [0, 1, 2, 3].forEach(key => {
      const data = agingMap.get(key) || { count: 0, amount: 0 };
      report.arrearsAging.push({
        label: agingLabels[key],
        termCount: key,
        studentCount: data.count,
        totalAmount: data.amount,
        percentage: report.totalArrearsAmount > 0 
          ? (data.amount / report.totalArrearsAmount) * 100 
          : 0,
      });
    });

    // Finalize class summaries
    classMap.forEach(summary => {
      if (summary.studentsWithArrears > 0) {
        summary.averageArrears = summary.totalArrearsAmount / summary.studentsWithArrears;
        summary.arrearsPercentage = (summary.studentsWithArrears / summary.totalStudents) * 100;
      }
    });
    report.arrearsByClass = Array.from(classMap.values())
      .filter(c => c.studentsWithArrears > 0)
      .sort((a, b) => b.totalArrearsAmount - a.totalArrearsAmount);

    // Sort student arrears by amount descending
    report.studentArrears.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

    return report;
  } catch (error) {
    console.error('Error generating arrears report:', error);
    throw error;
  }
}

// ============================================
// MOCK DATA FUNCTIONS (for development)
// ============================================

const MOCK_CURRENT_PERIOD: AcademicPeriod = { year: 2024, term: 'term_2' };

const MOCK_CARRYOVERS: TermBalanceCarryover[] = [
  {
    id: 'carry_1',
    schoolId: 'school_1',
    studentId: 'stu_1',
    studentName: 'Nakamya Sarah',
    className: 'S.3',
    streamName: 'East',
    fromPeriod: { year: 2024, term: 'term_1' },
    fromTermFees: 1500000,
    fromTermPaid: 1200000,
    fromTermBalance: 300000,
    toPeriod: { year: 2024, term: 'term_2' },
    carryoverAmount: 300000,
    carryoverType: 'debit',
    adjustments: [],
    adjustedAmount: 300000,
    status: 'applied',
    appliedAt: new Date('2024-05-01'),
    appliedBy: 'admin',
    createdAt: new Date('2024-04-30'),
    createdBy: 'system',
    updatedAt: new Date('2024-04-30'),
  },
  {
    id: 'carry_2',
    schoolId: 'school_1',
    studentId: 'stu_2',
    studentName: 'Ochieng Peter',
    className: 'S.2',
    streamName: 'West',
    fromPeriod: { year: 2023, term: 'term_3' },
    fromTermFees: 1400000,
    fromTermPaid: 900000,
    fromTermBalance: 500000,
    toPeriod: { year: 2024, term: 'term_1' },
    carryoverAmount: 500000,
    carryoverType: 'debit',
    adjustments: [
      {
        id: 'adj_1',
        type: 'discount',
        amount: 100000,
        reason: 'Early payment incentive from previous year',
        approvedBy: 'headteacher',
        approvedAt: new Date('2024-01-15'),
      },
    ],
    adjustedAmount: 400000,
    status: 'applied',
    createdAt: new Date('2024-01-05'),
    createdBy: 'system',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'carry_3',
    schoolId: 'school_1',
    studentId: 'stu_3',
    studentName: 'Auma Grace',
    className: 'S.4',
    streamName: 'North',
    fromPeriod: { year: 2024, term: 'term_1' },
    fromTermFees: 1600000,
    fromTermPaid: 1700000,
    fromTermBalance: -100000,
    toPeriod: { year: 2024, term: 'term_2' },
    carryoverAmount: 100000,
    carryoverType: 'credit',
    adjustments: [],
    adjustedAmount: 100000,
    status: 'applied',
    appliedAt: new Date('2024-05-01'),
    appliedBy: 'admin',
    createdAt: new Date('2024-04-30'),
    createdBy: 'system',
    updatedAt: new Date('2024-04-30'),
  },
];

export function getMockCarryovers(schoolId: string): TermBalanceCarryover[] {
  return MOCK_CARRYOVERS.filter(c => c.schoolId === schoolId);
}

export function getMockStudentCarryovers(studentId: string): TermBalanceCarryover[] {
  return MOCK_CARRYOVERS.filter(c => c.studentId === studentId);
}

export function getMockStudentCumulativeBalance(studentId: string): StudentCumulativeBalance {
  const carryovers = getMockStudentCarryovers(studentId);
  
  let carryoverBalance = 0;
  let carryoverCredits = 0;
  let arrearsCount = 0;
  let oldestArrears: AcademicPeriod | undefined;

  carryovers.forEach(c => {
    if (c.carryoverType === 'debit') {
      carryoverBalance += c.adjustedAmount;
      arrearsCount++;
      if (!oldestArrears || compareAcademicPeriods(c.fromPeriod, oldestArrears) < 0) {
        oldestArrears = c.fromPeriod;
      }
    } else {
      carryoverCredits += c.adjustedAmount;
    }
  });

  // Mock current term data
  const currentTermBalance = 250000;
  const totalOutstanding = currentTermBalance + carryoverBalance - carryoverCredits;

  return {
    studentId,
    studentName: 'Nakamya Sarah',
    className: 'S.3',
    streamName: 'East',
    currentPeriod: MOCK_CURRENT_PERIOD,
    currentTermFees: 1500000,
    currentTermPaid: 1250000,
    currentTermBalance,
    carryoverBalance,
    carryoverCredits,
    totalOutstanding,
    carryoverHistory: carryovers,
    hasArrears: totalOutstanding > 0,
    arrearsCount,
    oldestArrears,
  };
}

export function getMockArrearsReport(): ArrearsReport {
  return {
    schoolId: 'school_1',
    generatedAt: new Date(),
    generatedBy: 'admin',
    asOfPeriod: MOCK_CURRENT_PERIOD,
    totalStudentsWithArrears: 45,
    totalArrearsAmount: 28500000,
    averageArrearsPerStudent: 633333,
    arrearsAging: [
      { label: 'Current Term', termCount: 0, studentCount: 25, totalAmount: 12500000, percentage: 43.9 },
      { label: '1 Term Old', termCount: 1, studentCount: 12, totalAmount: 8500000, percentage: 29.8 },
      { label: '2 Terms Old', termCount: 2, studentCount: 5, totalAmount: 4500000, percentage: 15.8 },
      { label: '3+ Terms Old', termCount: 3, studentCount: 3, totalAmount: 3000000, percentage: 10.5 },
    ],
    arrearsByClass: [
      { className: 'S.1', streamName: 'East', totalStudents: 45, studentsWithArrears: 12, arrearsPercentage: 26.7, totalArrearsAmount: 7200000, averageArrears: 600000 },
      { className: 'S.2', streamName: 'West', totalStudents: 42, studentsWithArrears: 10, arrearsPercentage: 23.8, totalArrearsAmount: 6500000, averageArrears: 650000 },
      { className: 'S.3', streamName: 'East', totalStudents: 38, studentsWithArrears: 8, arrearsPercentage: 21.1, totalArrearsAmount: 5800000, averageArrears: 725000 },
      { className: 'S.4', streamName: 'North', totalStudents: 35, studentsWithArrears: 15, arrearsPercentage: 42.9, totalArrearsAmount: 9000000, averageArrears: 600000 },
    ],
    studentArrears: [
      {
        studentId: 'stu_1',
        studentName: 'Nakamya Sarah',
        className: 'S.3',
        streamName: 'East',
        guardianName: 'Nakamya Rose',
        guardianPhone: '+256 772 123 456',
        currentTermBalance: 250000,
        previousTermsArrears: [
          { period: { year: 2024, term: 'term_1' }, originalBalance: 300000, adjustments: 0, currentBalance: 300000 },
        ],
        totalPreviousArrears: 300000,
        totalOutstanding: 550000,
        arrearsAge: 1,
        lastPaymentDate: new Date('2024-06-15'),
        lastPaymentAmount: 500000,
      },
      {
        studentId: 'stu_2',
        studentName: 'Ochieng Peter',
        className: 'S.2',
        streamName: 'West',
        guardianName: 'Ochieng James',
        guardianPhone: '+256 777 456 789',
        currentTermBalance: 350000,
        previousTermsArrears: [
          { period: { year: 2023, term: 'term_3' }, originalBalance: 500000, adjustments: 100000, currentBalance: 400000 },
          { period: { year: 2024, term: 'term_1' }, originalBalance: 200000, adjustments: 0, currentBalance: 200000 },
        ],
        totalPreviousArrears: 600000,
        totalOutstanding: 950000,
        arrearsAge: 2,
        lastPaymentDate: new Date('2024-05-20'),
        lastPaymentAmount: 300000,
      },
    ],
  };
}

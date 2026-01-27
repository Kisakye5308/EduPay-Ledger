/**
 * Residence Fee Service
 * Handles boarding vs day scholar fee management
 * Critical for Ugandan schools with different fee structures
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
  ResidenceType,
  ResidenceFeeStructure,
  StudentResidenceFees,
  BoardingFeeReport,
  BoardingFeeItem,
  FeeAdjustment,
  AppliedFeeItem,
  ResidenceComparison,
  getApplicableFeeCategories,
  getResidenceTypeLabel,
  BOARDING_FEE_CATEGORIES,
} from '../../types/residence';

const FEE_STRUCTURES_COLLECTION = 'fee_structures';
const STUDENT_FEES_COLLECTION = 'student_fees';
const STUDENTS_COLLECTION = 'students';

/**
 * Get all fee structures for a school
 */
export async function getSchoolFeeStructures(
  schoolId: string,
  year?: number,
  term?: string
): Promise<ResidenceFeeStructure[]> {
  try {
    let q = query(
      collection(db, FEE_STRUCTURES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('isActive', '==', true)
    );

    if (year) {
      q = query(q, where('year', '==', year));
    }
    if (term) {
      q = query(q, where('term', '==', term));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ResidenceFeeStructure[];
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    throw error;
  }
}

/**
 * Get fee structure for a specific residence type
 */
export async function getFeeStructureByType(
  schoolId: string,
  residenceType: ResidenceType,
  year: number,
  term: string
): Promise<ResidenceFeeStructure | null> {
  try {
    const q = query(
      collection(db, FEE_STRUCTURES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('residenceType', '==', residenceType),
      where('year', '==', year),
      where('term', '==', term),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as ResidenceFeeStructure;
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    throw error;
  }
}

/**
 * Create or update a fee structure
 */
export async function saveFeeStructure(
  structure: Omit<ResidenceFeeStructure, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ResidenceFeeStructure> {
  try {
    const structureId = `${structure.schoolId}_${structure.residenceType}_${structure.year}_${structure.term}`;
    const structureRef = doc(db, FEE_STRUCTURES_COLLECTION, structureId);

    const now = new Date();
    const existingDoc = await getDoc(structureRef);

    const structureData = {
      ...structure,
      id: structureId,
      updatedAt: Timestamp.fromDate(now),
      createdAt: existingDoc.exists() 
        ? existingDoc.data().createdAt 
        : Timestamp.fromDate(now),
    };

    await setDoc(structureRef, structureData);

    return {
      ...structureData,
      createdAt: structureData.createdAt.toDate(),
      updatedAt: now,
    } as ResidenceFeeStructure;
  } catch (error) {
    console.error('Error saving fee structure:', error);
    throw error;
  }
}

/**
 * Initialize default fee structures for all residence types
 */
export async function initializeDefaultFeeStructures(
  schoolId: string,
  year: number,
  term: string,
  feeAmounts: Record<string, number>,
  createdBy: string
): Promise<ResidenceFeeStructure[]> {
  const residenceTypes: ResidenceType[] = ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder'];
  const structures: ResidenceFeeStructure[] = [];

  for (const residenceType of residenceTypes) {
    const applicableCategories = getApplicableFeeCategories(residenceType, true);
    
    const baseFees: BoardingFeeItem[] = [];
    const optionalFees: BoardingFeeItem[] = [];
    let totalBaseFee = 0;

    for (const category of applicableCategories) {
      const amount = feeAmounts[category.id] || category.baseAmount || 0;
      const item: BoardingFeeItem = {
        categoryId: category.id,
        categoryName: category.name,
        amount,
        description: category.description,
        isRequired: !category.isOptional,
      };

      if (category.isOptional) {
        optionalFees.push(item);
      } else {
        baseFees.push(item);
        totalBaseFee += amount;
      }
    }

    const structure = await saveFeeStructure({
      schoolId,
      residenceType,
      name: `${getResidenceTypeLabel(residenceType)} Fees`,
      description: `Fee structure for ${getResidenceTypeLabel(residenceType).toLowerCase()} students`,
      baseFees,
      optionalFees,
      totalBaseFee,
      isActive: true,
      year,
      term,
      createdBy,
    });

    structures.push(structure);
  }

  return structures;
}

/**
 * Get student's assigned fees based on residence type
 */
export async function getStudentResidenceFees(
  schoolId: string,
  studentId: string
): Promise<StudentResidenceFees | null> {
  try {
    const docRef = doc(db, STUDENT_FEES_COLLECTION, studentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return {
      ...docSnap.data(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as StudentResidenceFees;
  } catch (error) {
    console.error('Error fetching student fees:', error);
    throw error;
  }
}

/**
 * Assign fee structure to a student
 */
export async function assignStudentFees(
  schoolId: string,
  studentId: string,
  studentName: string,
  residenceType: ResidenceType,
  feeStructureId: string,
  year: number,
  term: string,
  optionalFeeIds: string[] = [],
  adjustments: FeeAdjustment[] = []
): Promise<StudentResidenceFees> {
  try {
    // Get the fee structure
    const structure = await getDoc(doc(db, FEE_STRUCTURES_COLLECTION, feeStructureId));
    if (!structure.exists()) {
      throw new Error('Fee structure not found');
    }

    const structureData = structure.data() as ResidenceFeeStructure;

    // Build applied fees
    const appliedFees: AppliedFeeItem[] = [];
    let totalBaseFees = 0;
    let totalOptionalFees = 0;

    // Add required fees
    for (const fee of structureData.baseFees) {
      appliedFees.push({
        categoryId: fee.categoryId,
        categoryName: fee.categoryName,
        originalAmount: fee.amount,
        adjustedAmount: fee.amount,
        isOptional: false,
        isWaived: false,
      });
      totalBaseFees += fee.amount;
    }

    // Add selected optional fees
    for (const fee of structureData.optionalFees) {
      if (optionalFeeIds.includes(fee.categoryId)) {
        appliedFees.push({
          categoryId: fee.categoryId,
          categoryName: fee.categoryName,
          originalAmount: fee.amount,
          adjustedAmount: fee.amount,
          isOptional: true,
          isWaived: false,
        });
        totalOptionalFees += fee.amount;
      }
    }

    const totalFees = totalBaseFees + totalOptionalFees;

    // Calculate adjustments
    let adjustedTotal = totalFees;
    for (const adj of adjustments) {
      if (adj.type === 'addition') {
        adjustedTotal += Math.abs(adj.amount);
      } else {
        adjustedTotal -= Math.abs(adj.amount);
      }
    }
    adjustedTotal = Math.max(0, adjustedTotal);

    // Get current payment info from student record
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
    const studentData = studentDoc.exists() ? studentDoc.data() : {};
    const amountPaid = studentData.amountPaid || 0;

    const studentFees: StudentResidenceFees = {
      studentId,
      studentName,
      residenceType,
      feeStructureId,
      feeStructureName: structureData.name,
      appliedFees,
      totalBaseFees,
      totalOptionalFees,
      totalFees,
      adjustments,
      adjustedTotal,
      amountPaid,
      balance: adjustedTotal - amountPaid,
      year,
      term,
      updatedAt: new Date(),
    };

    // Save to Firestore
    await setDoc(doc(db, STUDENT_FEES_COLLECTION, studentId), {
      ...studentFees,
      updatedAt: Timestamp.now(),
    });

    // Update student record with new total fees
    await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), {
      residenceType,
      totalFees: adjustedTotal,
      balance: adjustedTotal - amountPaid,
      updatedAt: Timestamp.now(),
    });

    return studentFees;
  } catch (error) {
    console.error('Error assigning student fees:', error);
    throw error;
  }
}

/**
 * Change student's residence type (e.g., boarder to day scholar)
 */
export async function changeStudentResidence(
  schoolId: string,
  studentId: string,
  newResidenceType: ResidenceType,
  year: number,
  term: string,
  changedBy: string
): Promise<StudentResidenceFees> {
  try {
    // Get appropriate fee structure
    const newStructure = await getFeeStructureByType(schoolId, newResidenceType, year, term);
    if (!newStructure) {
      throw new Error(`No fee structure found for ${getResidenceTypeLabel(newResidenceType)}`);
    }

    // Get current student fees
    const currentFees = await getStudentResidenceFees(schoolId, studentId);
    
    // Get student info
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    const student = studentDoc.data();

    // Keep any existing adjustments that should carry over
    const existingAdjustments = currentFees?.adjustments.filter(
      adj => adj.type === 'scholarship' || adj.type === 'sibling_discount' || adj.type === 'staff_discount'
    ) || [];

    // Assign new fees
    return await assignStudentFees(
      schoolId,
      studentId,
      `${student.firstName} ${student.lastName}`,
      newResidenceType,
      newStructure.id,
      year,
      term,
      [], // No optional fees selected by default
      existingAdjustments
    );
  } catch (error) {
    console.error('Error changing student residence:', error);
    throw error;
  }
}

/**
 * Apply adjustment to student fees
 */
export async function applyFeeAdjustment(
  studentId: string,
  adjustment: Omit<FeeAdjustment, 'id'>
): Promise<StudentResidenceFees> {
  try {
    const feesDoc = await getDoc(doc(db, STUDENT_FEES_COLLECTION, studentId));
    if (!feesDoc.exists()) {
      throw new Error('Student fees not found');
    }

    const currentFees = feesDoc.data() as StudentResidenceFees;
    const newAdjustment: FeeAdjustment = {
      ...adjustment,
      id: `adj_${Date.now()}`,
    };

    const updatedAdjustments = [...(currentFees.adjustments || []), newAdjustment];
    
    // Recalculate adjusted total
    let adjustedTotal = currentFees.totalFees;
    for (const adj of updatedAdjustments) {
      if (adj.type === 'addition') {
        adjustedTotal += Math.abs(adj.amount);
      } else {
        adjustedTotal -= Math.abs(adj.amount);
      }
    }
    adjustedTotal = Math.max(0, adjustedTotal);

    const balance = adjustedTotal - currentFees.amountPaid;

    await updateDoc(doc(db, STUDENT_FEES_COLLECTION, studentId), {
      adjustments: updatedAdjustments,
      adjustedTotal,
      balance,
      updatedAt: Timestamp.now(),
    });

    // Also update student record
    await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), {
      totalFees: adjustedTotal,
      balance,
      updatedAt: Timestamp.now(),
    });

    return {
      ...currentFees,
      adjustments: updatedAdjustments,
      adjustedTotal,
      balance,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error applying fee adjustment:', error);
    throw error;
  }
}

/**
 * Generate boarding fee report
 */
export async function generateBoardingFeeReport(
  schoolId: string,
  year: number,
  term: string,
  generatedBy: string
): Promise<BoardingFeeReport> {
  try {
    // Get all students
    const studentsQuery = query(
      collection(db, STUDENTS_COLLECTION),
      where('schoolId', '==', schoolId)
    );
    const studentsSnapshot = await getDocs(studentsQuery);

    // Get all student fees
    const feesQuery = query(
      collection(db, STUDENT_FEES_COLLECTION),
      where('year', '==', year),
      where('term', '==', term)
    );
    const feesSnapshot = await getDocs(feesQuery);

    // Build fees map
    const feesMap = new Map<string, StudentResidenceFees>();
    feesSnapshot.docs.forEach(doc => {
      const data = doc.data() as StudentResidenceFees;
      feesMap.set(data.studentId, data);
    });

    // Initialize comparison data
    const comparisonMap = new Map<ResidenceType, ResidenceComparison>();
    const residenceTypes: ResidenceType[] = ['boarder', 'day_scholar', 'half_boarder', 'weekly_boarder', 'external'];
    
    for (const type of residenceTypes) {
      comparisonMap.set(type, {
        residenceType: type,
        label: getResidenceTypeLabel(type),
        studentCount: 0,
        totalFees: 0,
        totalCollected: 0,
        totalBalance: 0,
        collectionRate: 0,
        averageBalance: 0,
      });
    }

    // Process students
    let totalStudents = 0;
    let totalExpectedFees = 0;
    let totalCollected = 0;
    let totalBalance = 0;
    let boardingStudents = 0;
    let boardingFees = 0;
    let boardingCollected = 0;
    let dayStudents = 0;
    let dayFees = 0;
    let dayCollected = 0;

    for (const studentDoc of studentsSnapshot.docs) {
      const student = studentDoc.data();
      const studentFees = feesMap.get(studentDoc.id);
      
      const residenceType: ResidenceType = student.residenceType || 'day_scholar';
      const fees = studentFees?.adjustedTotal || student.totalFees || 0;
      const paid = student.amountPaid || 0;
      const balance = fees - paid;

      // Update comparison
      const comparison = comparisonMap.get(residenceType)!;
      comparison.studentCount++;
      comparison.totalFees += fees;
      comparison.totalCollected += paid;
      comparison.totalBalance += balance;

      // Update totals
      totalStudents++;
      totalExpectedFees += fees;
      totalCollected += paid;
      totalBalance += balance;

      // Boarding vs Day
      if (residenceType === 'boarder' || residenceType === 'weekly_boarder') {
        boardingStudents++;
        boardingFees += fees;
        boardingCollected += paid;
      } else if (residenceType === 'day_scholar' || residenceType === 'half_boarder') {
        dayStudents++;
        dayFees += fees;
        dayCollected += paid;
      }
    }

    // Calculate rates and averages
    const comparisonValues = Array.from(comparisonMap.values());
    for (const comparison of comparisonValues) {
      if (comparison.totalFees > 0) {
        comparison.collectionRate = (comparison.totalCollected / comparison.totalFees) * 100;
      }
      if (comparison.studentCount > 0) {
        comparison.averageBalance = comparison.totalBalance / comparison.studentCount;
      }
    }

    const overallCollectionRate = totalExpectedFees > 0 
      ? (totalCollected / totalExpectedFees) * 100 
      : 0;

    return {
      schoolId,
      year,
      term,
      generatedAt: new Date(),
      generatedBy,
      byResidenceType: Array.from(comparisonMap.values()).filter(c => c.studentCount > 0),
      totalStudents,
      totalExpectedFees,
      totalCollected,
      totalBalance,
      overallCollectionRate,
      boardingStudents,
      boardingFees,
      boardingCollected,
      dayStudents,
      dayFees,
      dayCollected,
    };
  } catch (error) {
    console.error('Error generating boarding fee report:', error);
    throw error;
  }
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

const MOCK_FEE_STRUCTURES: ResidenceFeeStructure[] = [
  {
    id: 'struct_boarder_2024_term_2',
    schoolId: 'school_1',
    residenceType: 'boarder',
    name: 'Boarder Fees',
    description: 'Full boarding students',
    baseFees: [
      { categoryId: 'tuition', categoryName: 'Tuition', amount: 800000, isRequired: true },
      { categoryId: 'boarding_fees', categoryName: 'Boarding Fees', amount: 500000, isRequired: true },
      { categoryId: 'full_meals', categoryName: 'Full Meals', amount: 400000, isRequired: true },
      { categoryId: 'beddings', categoryName: 'Beddings', amount: 50000, isRequired: true },
      { categoryId: 'medical_fees', categoryName: 'Medical Fees', amount: 50000, isRequired: true },
      { categoryId: 'development_levy', categoryName: 'Development Levy', amount: 100000, isRequired: true },
      { categoryId: 'exam_fees', categoryName: 'Exam Fees', amount: 80000, isRequired: true },
    ],
    optionalFees: [
      { categoryId: 'computer_lab', categoryName: 'Computer Lab', amount: 50000, isRequired: false },
      { categoryId: 'laundry', categoryName: 'Laundry Services', amount: 30000, isRequired: false },
    ],
    totalBaseFee: 1980000,
    isActive: true,
    year: 2024,
    term: 'term_2',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin',
  },
  {
    id: 'struct_day_2024_term_2',
    schoolId: 'school_1',
    residenceType: 'day_scholar',
    name: 'Day Scholar Fees',
    description: 'Day students',
    baseFees: [
      { categoryId: 'tuition', categoryName: 'Tuition', amount: 800000, isRequired: true },
      { categoryId: 'development_levy', categoryName: 'Development Levy', amount: 100000, isRequired: true },
      { categoryId: 'exam_fees', categoryName: 'Exam Fees', amount: 80000, isRequired: true },
    ],
    optionalFees: [
      { categoryId: 'lunch_program', categoryName: 'Lunch Program', amount: 200000, isRequired: false },
      { categoryId: 'transport', categoryName: 'School Transport', amount: 150000, isRequired: false },
      { categoryId: 'computer_lab', categoryName: 'Computer Lab', amount: 50000, isRequired: false },
    ],
    totalBaseFee: 980000,
    isActive: true,
    year: 2024,
    term: 'term_2',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin',
  },
];

export function getMockFeeStructures(schoolId: string): ResidenceFeeStructure[] {
  return MOCK_FEE_STRUCTURES;
}

export function getMockBoardingFeeReport(): BoardingFeeReport {
  return {
    schoolId: 'school_1',
    year: 2024,
    term: 'term_2',
    generatedAt: new Date(),
    generatedBy: 'admin',
    byResidenceType: [
      { residenceType: 'boarder', label: 'Boarder', studentCount: 85, totalFees: 168300000, totalCollected: 134640000, totalBalance: 33660000, collectionRate: 80.0, averageBalance: 396000 },
      { residenceType: 'day_scholar', label: 'Day Scholar', studentCount: 120, totalFees: 117600000, totalCollected: 100296000, totalBalance: 17304000, collectionRate: 85.3, averageBalance: 144200 },
      { residenceType: 'half_boarder', label: 'Half Boarder', studentCount: 25, totalFees: 32500000, totalCollected: 27625000, totalBalance: 4875000, collectionRate: 85.0, averageBalance: 195000 },
      { residenceType: 'weekly_boarder', label: 'Weekly Boarder', studentCount: 15, totalFees: 27000000, totalCollected: 21600000, totalBalance: 5400000, collectionRate: 80.0, averageBalance: 360000 },
    ],
    totalStudents: 245,
    totalExpectedFees: 345400000,
    totalCollected: 284161000,
    totalBalance: 61239000,
    overallCollectionRate: 82.3,
    boardingStudents: 100,
    boardingFees: 195300000,
    boardingCollected: 156240000,
    dayStudents: 145,
    dayFees: 150100000,
    dayCollected: 127921000,
  };
}

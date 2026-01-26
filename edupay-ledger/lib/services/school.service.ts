/**
 * School Service
 * 
 * Handles school onboarding, configuration, and management
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
  Timestamp
} from 'firebase/firestore';
import { db, initializeFirebase, COLLECTIONS } from '@/lib/firebase';
import { 
  School, 
  SchoolClass, 
  Stream, 
  FeeStructure, 
  InstallmentRule,
  FeeItem,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES
} from '@/types/school';
import { generateId } from '@/lib/utils';

export interface OnboardingSchoolInput {
  name: string;
  type: 'primary' | 'secondary' | 'mixed';
  district: string;
  address: string;
  phone: string;
  email: string;
  motto?: string;
  academicYear: string;
  currentTerm: 1 | 2 | 3;
  selectedClasses: string[];
  streams: string[];
}

export interface FeeStructureInput {
  name: string;
  totalAmount: number;
  term: 1 | 2 | 3;
  academicYear: string;
  classIds: string[];
  feeItems: Array<{
    name: string;
    amount: number;
    isOptional: boolean;
  }>;
  installments: Array<{
    name: string;
    percentage: number;
    deadlineDate: Date;
    gracePeriodDays?: number;
  }>;
}

/**
 * Creates a new school during onboarding
 */
export async function createSchool(
  input: OnboardingSchoolInput,
  createdByUserId: string
): Promise<{ success: boolean; school?: School; error?: string }> {
  initializeFirebase();

  try {
    const now = Timestamp.now();
    const schoolId = generateId('SCH');

    // Create class structure
    const classes: SchoolClass[] = input.selectedClasses.map((className, index) => {
      const classId = generateId('CLS');
      const level = getClassLevel(className);
      
      // Create streams for this class
      const streams: Stream[] = input.streams.map(streamName => ({
        id: generateId('STR'),
        name: streamName,
        classId,
      }));

      return {
        id: classId,
        name: className,
        level,
        order: index,
        streams,
      };
    });

    const school: School = {
      id: schoolId,
      name: input.name,
      type: input.type,
      location: {
        district: input.district,
        address: input.address,
      },
      contact: {
        phone: input.phone,
        email: input.email,
      },
      academicYear: input.academicYear,
      currentTerm: input.currentTerm,
      classes,
      feeStructures: [],
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore
    await setDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId), school);

    return { success: true, school };
  } catch (error: any) {
    console.error('Failed to create school:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a fee structure for a school
 */
export async function createFeeStructure(
  schoolId: string,
  input: FeeStructureInput
): Promise<{ success: boolean; feeStructure?: FeeStructure; error?: string }> {
  initializeFirebase();

  try {
    const now = Timestamp.now();
    const feeStructureId = generateId('FEE');

    // Create fee items
    const feeItems: FeeItem[] = input.feeItems.map(item => ({
      id: generateId('FIT'),
      name: item.name,
      amount: item.amount,
      isOptional: item.isOptional,
    }));

    // Create installment rules
    const installmentRules: InstallmentRule[] = input.installments.map((inst, index) => ({
      id: generateId('INS'),
      order: index + 1,
      name: inst.name,
      amount: Math.round(input.totalAmount * (inst.percentage / 100)),
      percentage: inst.percentage,
      deadline: Timestamp.fromDate(inst.deadlineDate),
      gracePeriodDays: inst.gracePeriodDays || 0,
      penaltyType: 'flat',
      penaltyAmount: 0,
    }));

    // Validate percentages add up to 100
    const totalPercentage = input.installments.reduce((sum, i) => sum + i.percentage, 0);
    if (totalPercentage !== 100) {
      return { 
        success: false, 
        error: `Installment percentages must total 100% (currently ${totalPercentage}%)` 
      };
    }

    const feeStructure: FeeStructure = {
      id: feeStructureId,
      name: input.name,
      totalAmount: input.totalAmount,
      currency: 'UGX',
      term: input.term,
      academicYear: input.academicYear,
      classIds: input.classIds,
      feeItems,
      installmentRules,
      createdAt: now,
      updatedAt: now,
    };

    // Save fee structure
    await setDoc(doc(db, COLLECTIONS.FEE_STRUCTURES, feeStructureId), feeStructure);

    // Update school with fee structure reference
    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
    const schoolDoc = await getDoc(schoolRef);
    
    if (schoolDoc.exists()) {
      const school = schoolDoc.data() as School;
      await updateDoc(schoolRef, {
        feeStructures: [...school.feeStructures, feeStructure],
        updatedAt: now,
      });
    }

    return { success: true, feeStructure };
  } catch (error: any) {
    console.error('Failed to create fee structure:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gets school by ID
 */
export async function getSchoolById(schoolId: string): Promise<School | null> {
  initializeFirebase();

  const schoolDoc = await getDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId));
  
  if (!schoolDoc.exists()) return null;
  
  return { id: schoolDoc.id, ...schoolDoc.data() } as School;
}

/**
 * Gets fee structures for a school
 */
export async function getSchoolFeeStructures(schoolId: string): Promise<FeeStructure[]> {
  initializeFirebase();

  const school = await getSchoolById(schoolId);
  return school?.feeStructures || [];
}

/**
 * Gets fee structure by ID
 */
export async function getFeeStructureById(feeStructureId: string): Promise<FeeStructure | null> {
  initializeFirebase();

  const feeStructureDoc = await getDoc(doc(db, COLLECTIONS.FEE_STRUCTURES, feeStructureId));
  
  if (!feeStructureDoc.exists()) return null;
  
  return { id: feeStructureDoc.id, ...feeStructureDoc.data() } as FeeStructure;
}

/**
 * Updates school term
 */
export async function updateSchoolTerm(
  schoolId: string,
  term: 1 | 2 | 3,
  academicYear: string
): Promise<boolean> {
  initializeFirebase();

  try {
    await updateDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId), {
      currentTerm: term,
      academicYear,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('Failed to update school term:', error);
    return false;
  }
}

/**
 * Gets class level from class name
 */
function getClassLevel(className: string): 'baby' | 'nursery' | 'primary' | 'secondary' {
  const lowerName = className.toLowerCase();
  
  if (lowerName.includes('baby') || lowerName.includes('nursery')) {
    return lowerName.includes('baby') ? 'baby' : 'nursery';
  }
  
  if (lowerName.startsWith('p') || lowerName.includes('primary')) {
    return 'primary';
  }
  
  return 'secondary';
}

/**
 * Gets default installment structure for Ugandan schools
 * Standard: 3 installments per term
 */
export function getDefaultInstallmentStructure(
  term: 1 | 2 | 3,
  year: number
): Array<{ name: string; percentage: number; deadlineDate: Date }> {
  // Term dates (approximate for Ugandan school calendar)
  const termDates = {
    1: { start: new Date(year, 1, 1), end: new Date(year, 3, 30) }, // Feb - Apr
    2: { start: new Date(year, 4, 15), end: new Date(year, 7, 15) }, // May - Aug
    3: { start: new Date(year, 8, 1), end: new Date(year, 11, 15) }, // Sep - Dec
  };

  const termInfo = termDates[term];
  
  return [
    {
      name: `First Installment (Deposit)`,
      percentage: 50,
      deadlineDate: termInfo.start, // Due at start of term
    },
    {
      name: `Second Installment`,
      percentage: 30,
      deadlineDate: new Date(
        termInfo.start.getTime() + 
        (termInfo.end.getTime() - termInfo.start.getTime()) * 0.4
      ),
    },
    {
      name: `Final Installment`,
      percentage: 20,
      deadlineDate: new Date(
        termInfo.start.getTime() + 
        (termInfo.end.getTime() - termInfo.start.getTime()) * 0.7
      ),
    },
  ];
}

/**
 * Gets school statistics
 */
export async function getSchoolStatistics(schoolId: string): Promise<{
  totalStudents: number;
  totalCollected: number;
  totalOutstanding: number;
  fullyPaidCount: number;
  partialCount: number;
  overdueCount: number;
  noPaidCount: number;
}> {
  initializeFirebase();

  const q = query(
    collection(db, COLLECTIONS.STUDENTS),
    where('schoolId', '==', schoolId),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  
  let totalCollected = 0;
  let totalOutstanding = 0;
  let fullyPaidCount = 0;
  let partialCount = 0;
  let overdueCount = 0;
  let noPaidCount = 0;

  snapshot.docs.forEach(doc => {
    const student = doc.data();
    totalCollected += student.amountPaid || 0;
    totalOutstanding += student.balance || 0;

    switch (student.paymentStatus) {
      case 'fully_paid':
        fullyPaidCount++;
        break;
      case 'partial':
        partialCount++;
        break;
      case 'overdue':
        overdueCount++;
        break;
      case 'no_payment':
        noPaidCount++;
        break;
    }
  });

  return {
    totalStudents: snapshot.size,
    totalCollected,
    totalOutstanding,
    fullyPaidCount,
    partialCount,
    overdueCount,
    noPaidCount,
  };
}

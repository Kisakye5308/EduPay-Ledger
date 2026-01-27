/**
 * Scholarship Service
 * 
 * Firebase service for managing scholarships and bursaries.
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Scholarship,
  StudentScholarship,
  ScholarshipDisbursement,
  ScholarshipReport,
  ScholarshipType,
  ScholarshipStatus,
  calculateScholarshipAmount,
  checkScholarshipEligibility,
} from '@/types/scholarship';

// ============================================================================
// SCHOLARSHIP MANAGEMENT
// ============================================================================

/**
 * Create a new scholarship
 */
export async function createScholarship(
  schoolId: string,
  data: Omit<Scholarship, 'id' | 'schoolId' | 'currentBeneficiaries' | 'disbursedAmount' | 'remainingBudget' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<Scholarship> {
  const scholarshipsRef = collection(db, 'scholarships');
  const docRef = doc(scholarshipsRef);
  
  const scholarship: Scholarship = {
    ...data,
    id: docRef.id,
    schoolId,
    currentBeneficiaries: 0,
    disbursedAmount: 0,
    remainingBudget: data.totalBudget,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy,
  };
  
  await setDoc(docRef, scholarship);
  return scholarship;
}

/**
 * Get all scholarships for a school
 */
export async function getScholarships(
  schoolId: string,
  filters?: {
    status?: ScholarshipStatus;
    type?: ScholarshipType;
    academicYear?: string;
  }
): Promise<Scholarship[]> {
  const scholarshipsRef = collection(db, 'scholarships');
  let q = query(scholarshipsRef, where('schoolId', '==', schoolId), orderBy('name'));
  
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters?.type) {
    q = query(q, where('type', '==', filters.type));
  }
  
  if (filters?.academicYear) {
    q = query(q, where('academicYear', '==', filters.academicYear));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Scholarship);
}

/**
 * Get a single scholarship by ID
 */
export async function getScholarship(scholarshipId: string): Promise<Scholarship | null> {
  const docRef = doc(db, 'scholarships', scholarshipId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() as Scholarship : null;
}

/**
 * Update a scholarship
 */
export async function updateScholarship(
  scholarshipId: string,
  updates: Partial<Scholarship>
): Promise<void> {
  const docRef = doc(db, 'scholarships', scholarshipId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a scholarship (only if no beneficiaries)
 */
export async function deleteScholarship(scholarshipId: string): Promise<void> {
  const scholarship = await getScholarship(scholarshipId);
  if (scholarship && scholarship.currentBeneficiaries > 0) {
    throw new Error('Cannot delete scholarship with active beneficiaries');
  }
  await deleteDoc(doc(db, 'scholarships', scholarshipId));
}

// ============================================================================
// STUDENT SCHOLARSHIP MANAGEMENT
// ============================================================================

/**
 * Award scholarship to a student
 */
export async function awardScholarship(
  schoolId: string,
  studentId: string,
  scholarshipId: string,
  studentDetails: {
    studentName: string;
    studentNumber: string;
    classId: string;
    className: string;
    totalFees: number;
    categoryAmounts?: { categoryId: string; amount: number }[];
  },
  academicYear: string,
  term: 1 | 2 | 3,
  awardedBy: string,
  customAmount?: number
): Promise<StudentScholarship> {
  const scholarship = await getScholarship(scholarshipId);
  if (!scholarship) {
    throw new Error('Scholarship not found');
  }
  
  if (scholarship.status !== 'active') {
    throw new Error('Scholarship is not active');
  }
  
  if (scholarship.maxBeneficiaries && scholarship.currentBeneficiaries >= scholarship.maxBeneficiaries) {
    throw new Error('Scholarship has reached maximum beneficiaries');
  }
  
  // Calculate amount
  const allocatedAmount = customAmount || calculateScholarshipAmount(
    scholarship,
    studentDetails.totalFees,
    studentDetails.categoryAmounts
  );
  
  if (allocatedAmount > scholarship.remainingBudget) {
    throw new Error('Insufficient scholarship budget');
  }
  
  const studentScholarshipsRef = collection(db, 'studentScholarships');
  const docRef = doc(studentScholarshipsRef);
  
  const studentScholarship: StudentScholarship = {
    id: docRef.id,
    studentId,
    studentName: studentDetails.studentName,
    studentNumber: studentDetails.studentNumber,
    classId: studentDetails.classId,
    className: studentDetails.className,
    schoolId,
    scholarshipId,
    scholarshipName: scholarship.name,
    scholarshipType: scholarship.type,
    sponsorName: scholarship.sponsor.name,
    coverageType: scholarship.coverageType,
    coveragePercentage: scholarship.coveragePercentage,
    coverageAmount: scholarship.coverageAmount,
    coveredCategories: scholarship.coveredCategories,
    academicYear,
    term,
    startDate: Timestamp.now(),
    endDate: scholarship.endDate,
    allocatedAmount,
    disbursedAmount: 0,
    remainingAmount: allocatedAmount,
    applicationStatus: 'direct_award',
    approvedBy: awardedBy,
    approvedAt: Timestamp.now(),
    status: 'active',
    disbursements: [],
    notes: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Use batch write to update both documents
  const batch = writeBatch(db);
  batch.set(docRef, studentScholarship);
  batch.update(doc(db, 'scholarships', scholarshipId), {
    currentBeneficiaries: scholarship.currentBeneficiaries + 1,
    remainingBudget: scholarship.remainingBudget - allocatedAmount,
    updatedAt: Timestamp.now(),
  });
  
  await batch.commit();
  return studentScholarship;
}

/**
 * Get student scholarships
 */
export async function getStudentScholarships(
  studentId: string,
  academicYear?: string,
  term?: 1 | 2 | 3
): Promise<StudentScholarship[]> {
  const studentScholarshipsRef = collection(db, 'studentScholarships');
  let q = query(studentScholarshipsRef, where('studentId', '==', studentId));
  
  if (academicYear) {
    q = query(q, where('academicYear', '==', academicYear));
  }
  
  if (term) {
    q = query(q, where('term', '==', term));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as StudentScholarship);
}

/**
 * Get all beneficiaries of a scholarship
 */
export async function getScholarshipBeneficiaries(
  scholarshipId: string,
  academicYear?: string
): Promise<StudentScholarship[]> {
  const studentScholarshipsRef = collection(db, 'studentScholarships');
  let q = query(
    studentScholarshipsRef,
    where('scholarshipId', '==', scholarshipId),
    where('status', '==', 'active')
  );
  
  if (academicYear) {
    q = query(q, where('academicYear', '==', academicYear));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as StudentScholarship);
}

/**
 * Disburse scholarship funds
 */
export async function disburseScholarship(
  studentScholarshipId: string,
  amount: number,
  categoryAllocations: { categoryId: string; categoryName: string; amount: number }[],
  processedBy: string,
  paymentId?: string,
  notes?: string
): Promise<ScholarshipDisbursement> {
  const studentScholarshipRef = doc(db, 'studentScholarships', studentScholarshipId);
  const studentScholarshipDoc = await getDoc(studentScholarshipRef);
  
  if (!studentScholarshipDoc.exists()) {
    throw new Error('Student scholarship not found');
  }
  
  const studentScholarship = studentScholarshipDoc.data() as StudentScholarship;
  
  if (amount > studentScholarship.remainingAmount) {
    throw new Error('Disbursement amount exceeds remaining scholarship amount');
  }
  
  const disbursement: ScholarshipDisbursement = {
    id: `disb-${Date.now()}`,
    studentScholarshipId,
    studentId: studentScholarship.studentId,
    scholarshipId: studentScholarship.scholarshipId,
    amount,
    term: studentScholarship.term,
    academicYear: studentScholarship.academicYear,
    date: Timestamp.now(),
    categoryAllocations,
    paymentId,
    processedBy,
    notes,
    createdAt: Timestamp.now(),
  };
  
  // Update student scholarship
  const newDisbursedAmount = studentScholarship.disbursedAmount + amount;
  const newRemainingAmount = studentScholarship.allocatedAmount - newDisbursedAmount;
  
  const batch = writeBatch(db);
  
  batch.update(studentScholarshipRef, {
    disbursedAmount: newDisbursedAmount,
    remainingAmount: newRemainingAmount,
    disbursements: [...studentScholarship.disbursements, disbursement],
    status: newRemainingAmount <= 0 ? 'completed' : 'active',
    updatedAt: Timestamp.now(),
  });
  
  // Update main scholarship disbursed amount
  const scholarshipRef = doc(db, 'scholarships', studentScholarship.scholarshipId);
  const scholarshipDoc = await getDoc(scholarshipRef);
  if (scholarshipDoc.exists()) {
    const scholarship = scholarshipDoc.data() as Scholarship;
    batch.update(scholarshipRef, {
      disbursedAmount: scholarship.disbursedAmount + amount,
      updatedAt: Timestamp.now(),
    });
  }
  
  await batch.commit();
  return disbursement;
}

/**
 * Suspend a student's scholarship
 */
export async function suspendStudentScholarship(
  studentScholarshipId: string,
  reason: string
): Promise<void> {
  const docRef = doc(db, 'studentScholarships', studentScholarshipId);
  await updateDoc(docRef, {
    status: 'suspended',
    suspensionReason: reason,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Reactivate a suspended scholarship
 */
export async function reactivateStudentScholarship(
  studentScholarshipId: string
): Promise<void> {
  const docRef = doc(db, 'studentScholarships', studentScholarshipId);
  await updateDoc(docRef, {
    status: 'active',
    suspensionReason: null,
    updatedAt: Timestamp.now(),
  });
}

// ============================================================================
// SCHOLARSHIP REPORTS
// ============================================================================

/**
 * Generate scholarship report
 */
export async function generateScholarshipReport(
  schoolId: string,
  academicYear: string,
  term: 1 | 2 | 3,
  generatedBy: string
): Promise<ScholarshipReport> {
  // Get all scholarships for the school
  const scholarships = await getScholarships(schoolId, { academicYear });
  
  // Get all student scholarships
  const studentScholarshipsRef = collection(db, 'studentScholarships');
  const q = query(
    studentScholarshipsRef,
    where('schoolId', '==', schoolId),
    where('academicYear', '==', academicYear),
    where('term', '==', term)
  );
  const snapshot = await getDocs(q);
  const studentScholarships = snapshot.docs.map(doc => doc.data() as StudentScholarship);
  
  // Calculate by type
  const byTypeMap = new Map<ScholarshipType, { count: number; beneficiaries: number; amount: number }>();
  scholarships.forEach(s => {
    const beneficiaries = studentScholarships.filter(ss => ss.scholarshipId === s.id);
    const current = byTypeMap.get(s.type) || { count: 0, beneficiaries: 0, amount: 0 };
    byTypeMap.set(s.type, {
      count: current.count + 1,
      beneficiaries: current.beneficiaries + beneficiaries.length,
      amount: current.amount + beneficiaries.reduce((sum, ss) => sum + ss.allocatedAmount, 0),
    });
  });
  
  const report: ScholarshipReport = {
    schoolId,
    academicYear,
    term,
    generatedAt: Timestamp.now(),
    generatedBy,
    summary: {
      totalScholarships: scholarships.length,
      activeScholarships: scholarships.filter(s => s.status === 'active').length,
      totalBeneficiaries: studentScholarships.length,
      totalBudget: scholarships.reduce((sum, s) => sum + s.totalBudget, 0),
      totalDisbursed: scholarships.reduce((sum, s) => sum + s.disbursedAmount, 0),
      totalRemaining: scholarships.reduce((sum, s) => sum + s.remainingBudget, 0),
      byType: Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
    },
    scholarships: scholarships.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      sponsorName: s.sponsor.name,
      beneficiaries: s.currentBeneficiaries,
      budget: s.totalBudget,
      disbursed: s.disbursedAmount,
      status: s.status,
    })),
    beneficiaries: studentScholarships.map(ss => ({
      studentId: ss.studentId,
      studentName: ss.studentName,
      studentNumber: ss.studentNumber,
      className: ss.className,
      scholarshipName: ss.scholarshipName,
      sponsorName: ss.sponsorName,
      amount: ss.allocatedAmount,
      status: ss.status,
    })),
  };
  
  return report;
}

/**
 * Get scholarship statistics for dashboard
 */
export async function getScholarshipStats(
  schoolId: string,
  academicYear: string,
  term: 1 | 2 | 3
): Promise<{
  totalScholarships: number;
  totalBeneficiaries: number;
  totalAmount: number;
  disbursedAmount: number;
}> {
  const scholarships = await getScholarships(schoolId, { academicYear, status: 'active' });
  
  const studentScholarshipsRef = collection(db, 'studentScholarships');
  const q = query(
    studentScholarshipsRef,
    where('schoolId', '==', schoolId),
    where('academicYear', '==', academicYear),
    where('term', '==', term),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  const studentScholarships = snapshot.docs.map(doc => doc.data() as StudentScholarship);
  
  return {
    totalScholarships: scholarships.length,
    totalBeneficiaries: studentScholarships.length,
    totalAmount: studentScholarships.reduce((sum, ss) => sum + ss.allocatedAmount, 0),
    disbursedAmount: studentScholarships.reduce((sum, ss) => sum + ss.disbursedAmount, 0),
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockScholarships: Scholarship[] = [
  {
    id: 'sch-001',
    schoolId: 'school-001',
    name: 'Government Capitation Grant',
    description: 'Universal Primary Education government support for tuition fees',
    type: 'government',
    code: 'GOV-UPE',
    sponsor: {
      name: 'Ministry of Education and Sports',
      type: 'organization',
      contactPerson: 'District Education Officer',
      phone: '+256701234567',
    },
    coverageType: 'partial_amount',
    coverageAmount: 50000,
    currentBeneficiaries: 120,
    academicYear: '2026',
    terms: [1, 2, 3],
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    endDate: Timestamp.fromDate(new Date('2026-12-31')),
    eligibility: {
      requiresApplication: false,
    },
    totalBudget: 6000000,
    disbursedAmount: 4800000,
    remainingBudget: 1200000,
    status: 'active',
    isRenewable: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin',
  },
  {
    id: 'sch-002',
    schoolId: 'school-001',
    name: 'World Vision Child Sponsorship',
    description: 'NGO sponsorship covering full school fees for vulnerable children',
    type: 'ngo',
    code: 'WV-2026',
    sponsor: {
      name: 'World Vision Uganda',
      type: 'organization',
      contactPerson: 'John Mukasa',
      email: 'john.mukasa@worldvision.org',
      phone: '+256702345678',
    },
    coverageType: 'full',
    maxBeneficiaries: 25,
    currentBeneficiaries: 20,
    academicYear: '2026',
    terms: [1, 2, 3],
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    endDate: Timestamp.fromDate(new Date('2026-12-31')),
    eligibility: {
      classes: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
      requiresApplication: true,
      customCriteria: 'Orphans and vulnerable children with verified family income below UGX 100,000/month',
    },
    totalBudget: 36250000,
    disbursedAmount: 29000000,
    remainingBudget: 7250000,
    status: 'active',
    isRenewable: true,
    renewalDeadline: Timestamp.fromDate(new Date('2026-10-31')),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin',
  },
  {
    id: 'sch-003',
    schoolId: 'school-001',
    name: 'St. Mary\'s Church Bursary',
    description: 'Church-sponsored bursary for children of church members',
    type: 'church',
    code: 'SMC-BUR',
    sponsor: {
      name: 'St. Mary\'s Catholic Church',
      type: 'organization',
      contactPerson: 'Fr. Joseph Okello',
      phone: '+256703456789',
    },
    coverageType: 'partial_percentage',
    coveragePercentage: 50,
    maxBeneficiaries: 15,
    currentBeneficiaries: 12,
    academicYear: '2026',
    terms: [1, 2, 3],
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    endDate: Timestamp.fromDate(new Date('2026-12-31')),
    eligibility: {
      requiresApplication: true,
      customCriteria: 'Active church members for at least 2 years',
    },
    totalBudget: 10875000,
    disbursedAmount: 8700000,
    remainingBudget: 2175000,
    status: 'active',
    isRenewable: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin',
  },
  {
    id: 'sch-004',
    schoolId: 'school-001',
    name: 'Merit Scholarship - Academic Excellence',
    description: 'Scholarship for top 3 students in each class',
    type: 'merit',
    code: 'MERIT-TOP3',
    sponsor: {
      name: 'School Management',
      type: 'organization',
    },
    coverageType: 'partial_percentage',
    coveragePercentage: 25,
    currentBeneficiaries: 24,
    academicYear: '2026',
    terms: [1, 2, 3],
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    endDate: Timestamp.fromDate(new Date('2026-12-31')),
    eligibility: {
      minGradePoint: 80,
      requiresApplication: false,
    },
    totalBudget: 8700000,
    disbursedAmount: 5800000,
    remainingBudget: 2900000,
    status: 'active',
    isRenewable: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: 'admin',
  },
];

export const mockStudentScholarships: StudentScholarship[] = [
  {
    id: 'ss-001',
    studentId: 'STU001',
    studentName: 'Nakato Sarah',
    studentNumber: '2024/001',
    classId: 'S4',
    className: 'Senior 4',
    schoolId: 'school-001',
    scholarshipId: 'sch-002',
    scholarshipName: 'World Vision Child Sponsorship',
    scholarshipType: 'ngo',
    sponsorName: 'World Vision Uganda',
    coverageType: 'full',
    academicYear: '2026',
    term: 1,
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    endDate: Timestamp.fromDate(new Date('2026-12-31')),
    allocatedAmount: 1450000,
    disbursedAmount: 1450000,
    remainingAmount: 0,
    applicationStatus: 'approved',
    approvedBy: 'admin',
    approvedAt: Timestamp.fromDate(new Date('2025-12-15')),
    status: 'completed',
    disbursements: [],
    notes: 'Full scholarship - vulnerable child',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'ss-002',
    studentId: 'STU005',
    studentName: 'Wasswa David',
    studentNumber: '2024/005',
    classId: 'S3',
    className: 'Senior 3',
    schoolId: 'school-001',
    scholarshipId: 'sch-003',
    scholarshipName: 'St. Mary\'s Church Bursary',
    scholarshipType: 'church',
    sponsorName: 'St. Mary\'s Catholic Church',
    coverageType: 'partial_percentage',
    coveragePercentage: 50,
    academicYear: '2026',
    term: 1,
    startDate: Timestamp.fromDate(new Date('2026-01-01')),
    endDate: Timestamp.fromDate(new Date('2026-12-31')),
    allocatedAmount: 725000,
    disbursedAmount: 725000,
    remainingAmount: 0,
    applicationStatus: 'approved',
    approvedBy: 'admin',
    status: 'completed',
    disbursements: [],
    notes: 'Church member bursary',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

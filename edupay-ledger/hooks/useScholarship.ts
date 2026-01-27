/**
 * useScholarship Hook
 * 
 * Manages scholarship data, beneficiaries, and reports.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Scholarship,
  StudentScholarship,
  ScholarshipReport,
  ScholarshipType,
  ScholarshipStatus,
} from '@/types/scholarship';
import {
  getScholarships,
  getScholarship,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  getStudentScholarships,
  getScholarshipBeneficiaries,
  awardScholarship,
  disburseScholarship,
  suspendStudentScholarship,
  reactivateStudentScholarship,
  generateScholarshipReport,
  getScholarshipStats,
  mockScholarships,
  mockStudentScholarships,
} from '@/lib/services/scholarship.service';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================================================
// SCHOLARSHIPS LIST HOOK
// ============================================================================

export interface UseScholarshipsReturn {
  scholarships: Scholarship[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: Omit<Scholarship, 'id' | 'schoolId' | 'currentBeneficiaries' | 'disbursedAmount' | 'remainingBudget' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<Scholarship | null>;
  update: (id: string, updates: Partial<Scholarship>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useScholarships(filters?: {
  status?: ScholarshipStatus;
  type?: ScholarshipType;
  academicYear?: string;
}): UseScholarshipsReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScholarships = useCallback(async () => {
    if (!schoolId && !USE_MOCK_DATA) {
      setScholarships([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        let filtered = [...mockScholarships];
        if (filters?.status) {
          filtered = filtered.filter(s => s.status === filters.status);
        }
        if (filters?.type) {
          filtered = filtered.filter(s => s.type === filters.type);
        }
        if (filters?.academicYear) {
          filtered = filtered.filter(s => s.academicYear === filters.academicYear);
        }
        setScholarships(filtered);
      } else {
        const data = await getScholarships(schoolId!, filters);
        setScholarships(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scholarships';
      setError(message);
      setScholarships(mockScholarships);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, filters?.status, filters?.type, filters?.academicYear]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const createHandler = async (
    data: Omit<Scholarship, 'id' | 'schoolId' | 'currentBeneficiaries' | 'disbursedAmount' | 'remainingBudget' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<Scholarship | null> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return null;

    try {
      const scholarship = await createScholarship(schoolId, { ...data, createdBy: user.displayName }, user.displayName);
      setScholarships(prev => [...prev, scholarship]);
      return scholarship;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scholarship');
      return null;
    }
  };

  const updateHandler = async (id: string, updates: Partial<Scholarship>): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await updateScholarship(id, updates);
      setScholarships(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scholarship');
      return false;
    }
  };

  const removeHandler = async (id: string): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await deleteScholarship(id);
      setScholarships(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scholarship');
      return false;
    }
  };

  return {
    scholarships,
    isLoading,
    error,
    refresh: fetchScholarships,
    create: createHandler,
    update: updateHandler,
    remove: removeHandler,
  };
}

// ============================================================================
// STUDENT SCHOLARSHIPS HOOK
// ============================================================================

export interface UseStudentScholarshipsReturn {
  scholarships: StudentScholarship[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalAmount: number;
  totalDisbursed: number;
  activeCount: number;
}

export function useStudentScholarships(
  studentId: string,
  academicYear?: string,
  term?: 1 | 2 | 3
): UseStudentScholarshipsReturn {
  const [scholarships, setScholarships] = useState<StudentScholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScholarships = useCallback(async () => {
    if (!studentId) {
      setScholarships([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        const filtered = mockStudentScholarships.filter(ss => 
          ss.studentId === studentId &&
          (!academicYear || ss.academicYear === academicYear) &&
          (!term || ss.term === term)
        );
        setScholarships(filtered);
      } else {
        const data = await getStudentScholarships(studentId, academicYear, term);
        setScholarships(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load student scholarships';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, academicYear, term]);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const totalAmount = scholarships.reduce((sum, s) => sum + s.allocatedAmount, 0);
  const totalDisbursed = scholarships.reduce((sum, s) => sum + s.disbursedAmount, 0);
  const activeCount = scholarships.filter(s => s.status === 'active').length;

  return {
    scholarships,
    isLoading,
    error,
    refresh: fetchScholarships,
    totalAmount,
    totalDisbursed,
    activeCount,
  };
}

// ============================================================================
// SCHOLARSHIP BENEFICIARIES HOOK
// ============================================================================

export interface UseScholarshipBeneficiariesReturn {
  beneficiaries: StudentScholarship[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  award: (
    studentId: string,
    studentDetails: {
      studentName: string;
      studentNumber: string;
      classId: string;
      className: string;
      totalFees: number;
    },
    term: 1 | 2 | 3,
    customAmount?: number
  ) => Promise<StudentScholarship | null>;
  disburse: (
    studentScholarshipId: string,
    amount: number,
    categoryAllocations: { categoryId: string; categoryName: string; amount: number }[]
  ) => Promise<boolean>;
  suspend: (studentScholarshipId: string, reason: string) => Promise<boolean>;
  reactivate: (studentScholarshipId: string) => Promise<boolean>;
}

export function useScholarshipBeneficiaries(
  scholarshipId: string,
  academicYear?: string
): UseScholarshipBeneficiariesReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [beneficiaries, setBeneficiaries] = useState<StudentScholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBeneficiaries = useCallback(async () => {
    if (!scholarshipId) {
      setBeneficiaries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        const filtered = mockStudentScholarships.filter(ss => 
          ss.scholarshipId === scholarshipId &&
          (!academicYear || ss.academicYear === academicYear)
        );
        setBeneficiaries(filtered);
      } else {
        const data = await getScholarshipBeneficiaries(scholarshipId, academicYear);
        setBeneficiaries(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load beneficiaries';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [scholarshipId, academicYear]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const awardHandler = async (
    studentId: string,
    studentDetails: {
      studentName: string;
      studentNumber: string;
      classId: string;
      className: string;
      totalFees: number;
    },
    term: 1 | 2 | 3,
    customAmount?: number
  ): Promise<StudentScholarship | null> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return null;

    try {
      const studentScholarship = await awardScholarship(
        schoolId,
        studentId,
        scholarshipId,
        studentDetails,
        academicYear || new Date().getFullYear().toString(),
        term,
        user.displayName,
        customAmount
      );
      setBeneficiaries(prev => [...prev, studentScholarship]);
      return studentScholarship;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award scholarship');
      return null;
    }
  };

  const disburseHandler = async (
    studentScholarshipId: string,
    amount: number,
    categoryAllocations: { categoryId: string; categoryName: string; amount: number }[]
  ): Promise<boolean> => {
    if (!user?.displayName || USE_MOCK_DATA) return false;

    try {
      await disburseScholarship(
        studentScholarshipId,
        amount,
        categoryAllocations,
        user.displayName
      );
      await fetchBeneficiaries();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disburse scholarship');
      return false;
    }
  };

  const suspendHandler = async (studentScholarshipId: string, reason: string): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await suspendStudentScholarship(studentScholarshipId, reason);
      setBeneficiaries(prev => 
        prev.map(b => b.id === studentScholarshipId ? { ...b, status: 'suspended' as const, suspensionReason: reason } : b)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend scholarship');
      return false;
    }
  };

  const reactivateHandler = async (studentScholarshipId: string): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await reactivateStudentScholarship(studentScholarshipId);
      setBeneficiaries(prev => 
        prev.map(b => b.id === studentScholarshipId ? { ...b, status: 'active' as const, suspensionReason: undefined } : b)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate scholarship');
      return false;
    }
  };

  return {
    beneficiaries,
    isLoading,
    error,
    refresh: fetchBeneficiaries,
    award: awardHandler,
    disburse: disburseHandler,
    suspend: suspendHandler,
    reactivate: reactivateHandler,
  };
}

// ============================================================================
// SCHOLARSHIP REPORT HOOK
// ============================================================================

export interface UseScholarshipReportReturn {
  stats: {
    totalScholarships: number;
    totalBeneficiaries: number;
    totalAmount: number;
    disbursedAmount: number;
  } | null;
  report: ScholarshipReport | null;
  isLoading: boolean;
  error: string | null;
  generateReport: () => Promise<ScholarshipReport | null>;
  refresh: () => Promise<void>;
}

export function useScholarshipReport(
  academicYear?: string,
  term?: 1 | 2 | 3
): UseScholarshipReportReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const [stats, setStats] = useState<UseScholarshipReportReturn['stats']>(null);
  const [report, setReport] = useState<ScholarshipReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!schoolId && !USE_MOCK_DATA) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        const mockStats = {
          totalScholarships: mockScholarships.length,
          totalBeneficiaries: mockStudentScholarships.length,
          totalAmount: mockStudentScholarships.reduce((sum, s) => sum + s.allocatedAmount, 0),
          disbursedAmount: mockStudentScholarships.reduce((sum, s) => sum + s.disbursedAmount, 0),
        };
        setStats(mockStats);
      } else {
        const data = await getScholarshipStats(schoolId!, currentYear, currentTerm);
        setStats(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scholarship stats';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, currentYear, currentTerm]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const generateReportHandler = async (): Promise<ScholarshipReport | null> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return null;

    setIsLoading(true);
    try {
      const newReport = await generateScholarshipReport(
        schoolId,
        currentYear,
        currentTerm,
        user.displayName
      );
      setReport(newReport);
      return newReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    report,
    isLoading,
    error,
    generateReport: generateReportHandler,
    refresh: fetchStats,
  };
}

// ============================================================================
// COMBINED HOOK WITH AUTH
// ============================================================================

export function useFirebaseScholarships() {
  const { user, loading: authLoading } = useAuth();
  const scholarships = useScholarships();
  const report = useScholarshipReport();

  return {
    ...scholarships,
    stats: report.stats,
    generateReport: report.generateReport,
    isAuthenticated: !!user,
    authLoading,
  };
}

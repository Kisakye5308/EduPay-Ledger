/**
 * useExamClearance Hook
 * 
 * Manages exam clearance data, thresholds, and reports.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  ClearanceThreshold,
  StudentClearance,
  ClearanceReport,
  ClearanceCheckResult,
  ClearanceStatus,
} from '@/types/exam-clearance';
import {
  getClearanceThresholds,
  saveClearanceThreshold,
  deleteClearanceThreshold,
  checkStudentClearance,
  getStudentClearance,
  updateStudentClearance,
  grantConditionalClearance,
  grantExemption,
  fulfillConditionalClearance,
  processClassClearance,
  generateClearanceReport,
  getClearanceStats,
  mockClearanceThresholds,
  mockClearanceReport,
} from '@/lib/services/exam-clearance.service';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================================================
// CLEARANCE THRESHOLDS HOOK
// ============================================================================

export interface UseClearanceThresholdsReturn {
  thresholds: ClearanceThreshold[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveThreshold: (data: Omit<ClearanceThreshold, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<ClearanceThreshold | null>;
  deleteThreshold: (id: string) => Promise<boolean>;
}

export function useClearanceThresholds(): UseClearanceThresholdsReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [thresholds, setThresholds] = useState<ClearanceThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    if (!schoolId && !USE_MOCK_DATA) {
      setThresholds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        setThresholds(mockClearanceThresholds);
      } else {
        const data = await getClearanceThresholds(schoolId!);
        setThresholds(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load clearance thresholds';
      setError(message);
      setThresholds(mockClearanceThresholds); // Fallback to mock
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const saveThresholdHandler = async (
    data: Omit<ClearanceThreshold, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ): Promise<ClearanceThreshold | null> => {
    if (!schoolId || USE_MOCK_DATA) return null;

    try {
      const threshold = await saveClearanceThreshold(schoolId, data, existingId);
      if (existingId) {
        setThresholds(prev => prev.map(t => t.id === existingId ? threshold : t));
      } else {
        setThresholds(prev => [...prev, threshold]);
      }
      return threshold;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save threshold');
      return null;
    }
  };

  const deleteThresholdHandler = async (id: string): Promise<boolean> => {
    if (!schoolId || USE_MOCK_DATA) return false;

    try {
      await deleteClearanceThreshold(schoolId, id);
      setThresholds(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete threshold');
      return false;
    }
  };

  return {
    thresholds,
    isLoading,
    error,
    refresh: fetchThresholds,
    saveThreshold: saveThresholdHandler,
    deleteThreshold: deleteThresholdHandler,
  };
}

// ============================================================================
// STUDENT CLEARANCE HOOK
// ============================================================================

export interface UseStudentClearanceReturn {
  clearance: StudentClearance | null;
  checkResult: ClearanceCheckResult | null;
  isLoading: boolean;
  error: string | null;
  checkClearance: () => Promise<void>;
  grantConditional: (details: { promiseAmount: number; promiseDate: Date; promisedBy: string }) => Promise<boolean>;
  grantExempt: (details: { reason: string; documentRef?: string }) => Promise<boolean>;
  fulfillCondition: () => Promise<boolean>;
  updateStatus: (status: ClearanceStatus, notes?: string) => Promise<boolean>;
}

export function useStudentClearance(
  studentId: string,
  academicYear?: string,
  term?: 1 | 2 | 3,
  examType: string = 'end_of_term'
): UseStudentClearanceReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const [clearance, setClearance] = useState<StudentClearance | null>(null);
  const [checkResult, setCheckResult] = useState<ClearanceCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClearance = useCallback(async () => {
    if (!studentId) {
      setClearance(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        // Mock clearance data
        const mockClearance: StudentClearance = {
          id: 'clr-001',
          studentId,
          studentName: 'Nakato Sarah',
          studentNumber: '2024/001',
          classId: 'S4',
          className: 'Senior 4',
          schoolId: 'school-001',
          academicYear: currentYear,
          term: currentTerm,
          examType,
          totalFees: 1450000,
          amountPaid: 1015000,
          balance: 435000,
          paymentPercentage: 70,
          examFeesPaid: true,
          requiredCategoriesPaid: true,
          status: 'cleared',
          isConditional: false,
          isExempt: false,
          notes: '',
          history: [],
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
        };
        setClearance(mockClearance);
        setCheckResult({
          studentId,
          canSitForExam: true,
          status: 'cleared',
          paymentPercentage: 70,
          amountNeeded: 0,
          missingCategories: [],
          recommendations: [],
        });
      } else {
        const data = await getStudentClearance(studentId, currentYear, currentTerm, examType);
        setClearance(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clearance');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, currentYear, currentTerm, examType]);

  useEffect(() => {
    fetchClearance();
  }, [fetchClearance]);

  const checkClearanceHandler = async () => {
    if (!schoolId || USE_MOCK_DATA) return;

    setIsLoading(true);
    try {
      const result = await checkStudentClearance(schoolId, studentId, examType, currentYear, currentTerm);
      setCheckResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check clearance');
    } finally {
      setIsLoading(false);
    }
  };

  const grantConditional = async (details: { promiseAmount: number; promiseDate: Date; promisedBy: string }): Promise<boolean> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return false;

    try {
      const updated = await grantConditionalClearance(
        schoolId,
        studentId,
        currentYear,
        currentTerm,
        examType,
        details,
        user.displayName
      );
      setClearance(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant conditional clearance');
      return false;
    }
  };

  const grantExempt = async (details: { reason: string; documentRef?: string }): Promise<boolean> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return false;

    try {
      const updated = await grantExemption(
        schoolId,
        studentId,
        currentYear,
        currentTerm,
        examType,
        details,
        user.displayName
      );
      setClearance(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant exemption');
      return false;
    }
  };

  const fulfillCondition = async (): Promise<boolean> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return false;

    try {
      const updated = await fulfillConditionalClearance(
        schoolId,
        studentId,
        currentYear,
        currentTerm,
        examType,
        user.displayName
      );
      setClearance(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fulfill conditional clearance');
      return false;
    }
  };

  const updateStatus = async (status: ClearanceStatus, notes?: string): Promise<boolean> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return false;

    try {
      const updated = await updateStudentClearance(
        schoolId,
        studentId,
        currentYear,
        currentTerm,
        examType,
        { status, notes },
        user.displayName
      );
      setClearance(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update clearance status');
      return false;
    }
  };

  return {
    clearance,
    checkResult,
    isLoading,
    error,
    checkClearance: checkClearanceHandler,
    grantConditional,
    grantExempt,
    fulfillCondition,
    updateStatus,
  };
}

// ============================================================================
// CLEARANCE REPORT HOOK
// ============================================================================

export interface UseClearanceReportReturn {
  report: ClearanceReport | null;
  stats: {
    totalStudents: number;
    cleared: number;
    blocked: number;
    conditional: number;
    clearanceRate: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  generateReport: () => Promise<ClearanceReport | null>;
  processClass: (classId: string) => Promise<{ processed: number; cleared: number; blocked: number } | null>;
  refresh: () => Promise<void>;
}

export function useClearanceReport(
  academicYear?: string,
  term?: 1 | 2 | 3,
  examType: string = 'end_of_term'
): UseClearanceReportReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const [report, setReport] = useState<ClearanceReport | null>(null);
  const [stats, setStats] = useState<UseClearanceReportReturn['stats']>(null);
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
        setReport(mockClearanceReport);
        setStats({
          totalStudents: mockClearanceReport.summary.totalStudents,
          cleared: mockClearanceReport.summary.cleared,
          blocked: mockClearanceReport.summary.blocked,
          conditional: mockClearanceReport.summary.conditional,
          clearanceRate: mockClearanceReport.summary.clearanceRate,
        });
      } else {
        const statsData = await getClearanceStats(schoolId!, currentYear, currentTerm);
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clearance stats');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, currentYear, currentTerm]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const generateReportHandler = async (): Promise<ClearanceReport | null> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) {
      return mockClearanceReport;
    }

    setIsLoading(true);
    try {
      const newReport = await generateClearanceReport(
        schoolId,
        currentYear,
        currentTerm,
        examType,
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

  const processClassHandler = async (classId: string): Promise<{ processed: number; cleared: number; blocked: number } | null> => {
    if (!schoolId || !user?.displayName || USE_MOCK_DATA) return null;

    setIsLoading(true);
    try {
      const result = await processClassClearance(
        schoolId,
        classId,
        currentYear,
        currentTerm,
        examType,
        user.displayName
      );
      await fetchStats(); // Refresh stats after processing
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process class clearance');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    report,
    stats,
    isLoading,
    error,
    generateReport: generateReportHandler,
    processClass: processClassHandler,
    refresh: fetchStats,
  };
}

// ============================================================================
// COMBINED HOOK WITH AUTH
// ============================================================================

export function useFirebaseExamClearance() {
  const { user, loading: authLoading } = useAuth();
  const thresholds = useClearanceThresholds();
  const report = useClearanceReport();

  return {
    ...thresholds,
    report: report.report,
    stats: report.stats,
    generateReport: report.generateReport,
    processClass: report.processClass,
    isAuthenticated: !!user,
    authLoading,
  };
}

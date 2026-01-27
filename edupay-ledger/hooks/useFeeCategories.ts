/**
 * useFeeCategories Hook
 * 
 * Manages fee categories, student fee breakdowns, and payment allocations.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  FeeCategory,
  FeeStructureWithCategories,
  StudentFeeBreakdown,
  StudentFeeCategoryStatus,
  PaymentCategoryAllocation,
  CategoryCollectionReport,
  StandardFeeCategory,
  allocatePaymentByPriority,
  allocatePaymentProportionally,
} from '@/types/fee-category';
import {
  getFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  getStudentFeeBreakdown,
  getStudentFeeHistory,
  initializeStudentFeeBreakdown,
  recordPaymentWithCategories,
  getPaymentAllocation,
  generateCategoryCollectionReport,
  getCategoryCollectionSummary,
  mockFeeCategories,
  mockStudentFeeBreakdown,
} from '@/lib/services/fee-category.service';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================================================
// FEE CATEGORIES HOOK
// ============================================================================

export interface UseFeeCategoriesReturn {
  categories: FeeCategory[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createCategory: (data: Omit<FeeCategory, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>) => Promise<FeeCategory | null>;
  updateCategory: (id: string, updates: Partial<FeeCategory>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
}

export function useFeeCategories(): UseFeeCategoriesReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!schoolId && !USE_MOCK_DATA) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        setCategories(mockFeeCategories);
      } else {
        const data = await getFeeCategories(schoolId!);
        setCategories(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fee categories';
      setError(message);
      setCategories(mockFeeCategories); // Fallback to mock
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategoryHandler = async (
    data: Omit<FeeCategory, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>
  ): Promise<FeeCategory | null> => {
    if (!schoolId || USE_MOCK_DATA) return null;

    try {
      const category = await createFeeCategory(schoolId, data);
      setCategories(prev => [...prev, category].sort((a, b) => a.priority - b.priority));
      return category;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      return null;
    }
  };

  const updateCategoryHandler = async (id: string, updates: Partial<FeeCategory>): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await updateFeeCategory(id, updates);
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, ...updates } : c)).sort((a, b) => a.priority - b.priority)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      return false;
    }
  };

  const deleteCategoryHandler = async (id: string): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await deleteFeeCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      return false;
    }
  };

  return {
    categories,
    isLoading,
    error,
    refresh: fetchCategories,
    createCategory: createCategoryHandler,
    updateCategory: updateCategoryHandler,
    deleteCategory: deleteCategoryHandler,
  };
}

// ============================================================================
// FEE STRUCTURES HOOK
// ============================================================================

export interface UseFeeStructuresReturn {
  structures: FeeStructureWithCategories[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createStructure: (data: Omit<FeeStructureWithCategories, 'id' | 'schoolId' | 'totalAmount' | 'createdAt' | 'updatedAt'>) => Promise<FeeStructureWithCategories | null>;
  updateStructure: (id: string, updates: Partial<FeeStructureWithCategories>) => Promise<boolean>;
  getStructureForStudent: (classId: string, studentType: 'boarder' | 'day_scholar') => FeeStructureWithCategories | null;
}

export function useFeeStructures(filters?: {
  academicYear?: string;
  term?: 1 | 2 | 3;
}): UseFeeStructuresReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  const [structures, setStructures] = useState<FeeStructureWithCategories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStructures = useCallback(async () => {
    if (!schoolId && !USE_MOCK_DATA) {
      setStructures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        // Mock fee structure
        const mockStructure: FeeStructureWithCategories = {
          id: 'fs-001',
          schoolId: 'school-001',
          name: 'Senior 4 Boarding',
          academicYear: '2026',
          term: 1,
          studentType: 'boarder',
          applicableClasses: ['S4'],
          categories: [
            { categoryId: 'cat-tuition', categoryName: 'Tuition', categoryCode: 'TUI', amount: 800000, isOptional: false },
            { categoryId: 'cat-boarding', categoryName: 'Boarding Fees', categoryCode: 'BRD', amount: 450000, isOptional: false },
            { categoryId: 'cat-exam', categoryName: 'Examination Fees', categoryCode: 'EXM', amount: 100000, isOptional: false },
            { categoryId: 'cat-computer', categoryName: 'Computer Lab', categoryCode: 'COM', amount: 50000, isOptional: true },
            { categoryId: 'cat-development', categoryName: 'Development Levy', categoryCode: 'DEV', amount: 50000, isOptional: false },
          ],
          totalAmount: 1450000,
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
        };
        setStructures([mockStructure]);
      } else {
        const data = await getFeeStructures(schoolId!, filters);
        setStructures(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fee structures';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, filters?.academicYear, filters?.term]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const createStructureHandler = async (
    data: Omit<FeeStructureWithCategories, 'id' | 'schoolId' | 'totalAmount' | 'createdAt' | 'updatedAt'>
  ): Promise<FeeStructureWithCategories | null> => {
    if (!schoolId || USE_MOCK_DATA) return null;

    try {
      const structure = await createFeeStructure(schoolId, data);
      setStructures(prev => [...prev, structure]);
      return structure;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fee structure');
      return null;
    }
  };

  const updateStructureHandler = async (id: string, updates: Partial<FeeStructureWithCategories>): Promise<boolean> => {
    if (USE_MOCK_DATA) return false;

    try {
      await updateFeeStructure(id, updates);
      setStructures(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fee structure');
      return false;
    }
  };

  const getStructureForStudent = (
    classId: string,
    studentType: 'boarder' | 'day_scholar'
  ): FeeStructureWithCategories | null => {
    return structures.find(s =>
      s.applicableClasses.includes(classId) &&
      (s.studentType === studentType || s.studentType === 'both')
    ) || null;
  };

  return {
    structures,
    isLoading,
    error,
    refresh: fetchStructures,
    createStructure: createStructureHandler,
    updateStructure: updateStructureHandler,
    getStructureForStudent,
  };
}

// ============================================================================
// STUDENT FEE BREAKDOWN HOOK
// ============================================================================

export interface UseStudentFeeBreakdownReturn {
  breakdown: StudentFeeBreakdown | null;
  feeHistory: StudentFeeBreakdown[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  allocatePayment: (
    amount: number,
    method: 'priority' | 'proportional' | 'manual',
    manualAllocations?: { categoryId: string; amount: number }[]
  ) => { categoryId: string; categoryName: string; amount: number }[];
}

export function useStudentFeeBreakdown(
  studentId: string,
  academicYear?: string,
  term?: 1 | 2 | 3
): UseStudentFeeBreakdownReturn {
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const [breakdown, setBreakdown] = useState<StudentFeeBreakdown | null>(null);
  const [feeHistory, setFeeHistory] = useState<StudentFeeBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async () => {
    if (!studentId) {
      setBreakdown(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        setBreakdown(mockStudentFeeBreakdown);
        setFeeHistory([mockStudentFeeBreakdown]);
      } else {
        const [current, history] = await Promise.all([
          getStudentFeeBreakdown(studentId, currentYear, currentTerm),
          getStudentFeeHistory(studentId),
        ]);
        setBreakdown(current);
        setFeeHistory(history);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fee breakdown';
      setError(message);
      setBreakdown(mockStudentFeeBreakdown); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [studentId, currentYear, currentTerm]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  const allocatePayment = (
    amount: number,
    method: 'priority' | 'proportional' | 'manual',
    manualAllocations?: { categoryId: string; amount: number }[]
  ): { categoryId: string; categoryName: string; amount: number }[] => {
    if (!breakdown) return [];

    if (method === 'manual' && manualAllocations) {
      return manualAllocations.map(a => {
        const cat = breakdown.categories.find(c => c.categoryId === a.categoryId);
        return {
          categoryId: a.categoryId,
          categoryName: cat?.categoryName || 'Unknown',
          amount: a.amount,
        };
      });
    }

    const allocations = method === 'priority'
      ? allocatePaymentByPriority(amount, breakdown.categories)
      : allocatePaymentProportionally(amount, breakdown.categories);

    return allocations.map(a => {
      const cat = breakdown.categories.find(c => c.categoryId === a.categoryId);
      return {
        categoryId: a.categoryId,
        categoryName: cat?.categoryName || 'Unknown',
        amount: a.amount,
      };
    });
  };

  return {
    breakdown,
    feeHistory,
    isLoading,
    error,
    refresh: fetchBreakdown,
    allocatePayment,
  };
}

// ============================================================================
// CATEGORY COLLECTION REPORT HOOK
// ============================================================================

export interface UseCategoryReportReturn {
  report: CategoryCollectionReport | null;
  summary: {
    categoryId: string;
    categoryName: string;
    categoryCode: string;
    collected: number;
    expected: number;
    percentage: number;
  }[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCategoryCollectionReport(
  academicYear?: string,
  term?: 1 | 2 | 3
): UseCategoryReportReturn {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const [report, setReport] = useState<CategoryCollectionReport | null>(null);
  const [summary, setSummary] = useState<UseCategoryReportReturn['summary']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!schoolId && !USE_MOCK_DATA) {
      setReport(null);
      setSummary([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        // Mock summary
        const mockSummary = [
          { categoryId: 'cat-tuition', categoryName: 'Tuition', categoryCode: 'TUI', collected: 45000000, expected: 64000000, percentage: 70.3 },
          { categoryId: 'cat-boarding', categoryName: 'Boarding Fees', categoryCode: 'BRD', collected: 28800000, expected: 36000000, percentage: 80.0 },
          { categoryId: 'cat-exam', categoryName: 'Examination Fees', categoryCode: 'EXM', collected: 6400000, expected: 8000000, percentage: 80.0 },
          { categoryId: 'cat-computer', categoryName: 'Computer Lab', categoryCode: 'COM', collected: 2800000, expected: 4000000, percentage: 70.0 },
          { categoryId: 'cat-development', categoryName: 'Development Levy', categoryCode: 'DEV', collected: 3500000, expected: 4000000, percentage: 87.5 },
        ];
        setSummary(mockSummary);
      } else {
        const [fullReport, summaryData] = await Promise.all([
          generateCategoryCollectionReport(schoolId!, currentYear, currentTerm),
          getCategoryCollectionSummary(schoolId!, currentYear, currentTerm),
        ]);
        setReport(fullReport);
        setSummary(summaryData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load collection report';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, currentYear, currentTerm]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    report,
    summary,
    isLoading,
    error,
    refresh: fetchReport,
  };
}

// Export combined hook with auth
export function useFirebaseFeeCategories() {
  const { user, loading: authLoading } = useAuth();
  const categories = useFeeCategories();

  return {
    ...categories,
    isAuthenticated: !!user,
    authLoading,
  };
}

/**
 * Residence Fee Hooks
 * React hooks for managing boarding vs day scholar fees
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  ResidenceType,
  ResidenceFeeStructure,
  StudentResidenceFees,
  BoardingFeeReport,
  FeeAdjustment,
  getResidenceTypeLabel,
} from '../types/residence';
import {
  getSchoolFeeStructures,
  getFeeStructureByType,
  saveFeeStructure,
  initializeDefaultFeeStructures,
  getStudentResidenceFees,
  assignStudentFees,
  changeStudentResidence,
  applyFeeAdjustment,
  generateBoardingFeeReport,
  getMockFeeStructures,
  getMockBoardingFeeReport,
} from '../lib/services/residence.service';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================
// Hook: useFeeStructures
// Get all fee structures for the school
// ============================================
export function useFeeStructures(year?: number, term?: string) {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const [structures, setStructures] = useState<ResidenceFeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStructures = useCallback(async () => {
    if (!schoolId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        setStructures(getMockFeeStructures(schoolId));
      } else {
        const data = await getSchoolFeeStructures(schoolId, year, term);
        setStructures(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, year, term]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Group by residence type
  const byResidenceType = structures.reduce((acc, structure) => {
    acc[structure.residenceType] = structure;
    return acc;
  }, {} as Record<ResidenceType, ResidenceFeeStructure>);

  return {
    structures,
    byResidenceType,
    isLoading,
    error,
    refresh: fetchStructures,
  };
}

// ============================================
// Hook: useFeeStructureManagement
// Create and update fee structures
// ============================================
export function useFeeStructureManagement() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveStructure = useCallback(async (
    structure: Omit<ResidenceFeeStructure, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!schoolId) {
      setError('No school selected');
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (useMockData) {
        return { ...structure, id: `mock_${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
      }
      return await saveFeeStructure(structure);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [schoolId]);

  const initializeStructures = useCallback(async (
    year: number,
    term: string,
    feeAmounts: Record<string, number>
  ) => {
    if (!schoolId || !user?.uid) {
      setError('Not authenticated');
      return null;
    }

    setIsInitializing(true);
    setError(null);

    try {
      if (useMockData) {
        return getMockFeeStructures(schoolId);
      }
      return await initializeDefaultFeeStructures(schoolId, year, term, feeAmounts, user.uid);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [schoolId, user?.uid]);

  return {
    saveStructure,
    initializeStructures,
    isSaving,
    isInitializing,
    error,
  };
}

// ============================================
// Hook: useStudentResidenceFees
// Get a student's fee assignment
// ============================================
export function useStudentResidenceFees(studentId: string) {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const [fees, setFees] = useState<StudentResidenceFees | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    if (!schoolId || !studentId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Return mock student fees
        setFees({
          studentId,
          studentName: 'Nakamya Sarah',
          residenceType: 'boarder',
          feeStructureId: 'struct_boarder_2024_term_2',
          feeStructureName: 'Boarder Fees',
          appliedFees: [
            { categoryId: 'tuition', categoryName: 'Tuition', originalAmount: 800000, adjustedAmount: 800000, isOptional: false, isWaived: false },
            { categoryId: 'boarding_fees', categoryName: 'Boarding Fees', originalAmount: 500000, adjustedAmount: 500000, isOptional: false, isWaived: false },
            { categoryId: 'full_meals', categoryName: 'Full Meals', originalAmount: 400000, adjustedAmount: 400000, isOptional: false, isWaived: false },
          ],
          totalBaseFees: 1980000,
          totalOptionalFees: 50000,
          totalFees: 2030000,
          adjustments: [
            { id: 'adj_1', type: 'scholarship', description: 'Merit Scholarship', amount: 200000, appliedBy: 'admin', appliedAt: new Date('2024-01-15') }
          ],
          adjustedTotal: 1830000,
          amountPaid: 1500000,
          balance: 330000,
          year: 2024,
          term: 'term_2',
          updatedAt: new Date(),
        });
      } else {
        const data = await getStudentResidenceFees(schoolId, studentId);
        setFees(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, studentId]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return {
    fees,
    isLoading,
    error,
    refresh: fetchFees,
  };
}

// ============================================
// Hook: useStudentFeeAssignment
// Assign and update student fees
// ============================================
export function useStudentFeeAssignment() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const [isAssigning, setIsAssigning] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignFees = useCallback(async (
    studentId: string,
    studentName: string,
    residenceType: ResidenceType,
    feeStructureId: string,
    year: number,
    term: string,
    optionalFeeIds?: string[],
    adjustments?: FeeAdjustment[]
  ) => {
    if (!schoolId) {
      setError('No school selected');
      return null;
    }

    setIsAssigning(true);
    setError(null);

    try {
      if (useMockData) {
        return {
          studentId,
          studentName,
          residenceType,
          feeStructureId,
          feeStructureName: `${getResidenceTypeLabel(residenceType)} Fees`,
          appliedFees: [],
          totalBaseFees: 0,
          totalOptionalFees: 0,
          totalFees: 0,
          adjustments: adjustments || [],
          adjustedTotal: 0,
          amountPaid: 0,
          balance: 0,
          year,
          term,
          updatedAt: new Date(),
        } as StudentResidenceFees;
      }

      return await assignStudentFees(
        schoolId,
        studentId,
        studentName,
        residenceType,
        feeStructureId,
        year,
        term,
        optionalFeeIds,
        adjustments
      );
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsAssigning(false);
    }
  }, [schoolId]);

  const changeResidence = useCallback(async (
    studentId: string,
    newResidenceType: ResidenceType,
    year: number,
    term: string
  ) => {
    if (!schoolId || !user?.uid) {
      setError('Not authenticated');
      return null;
    }

    setIsChanging(true);
    setError(null);

    try {
      if (useMockData) {
        return {
          studentId,
          residenceType: newResidenceType,
        } as StudentResidenceFees;
      }

      return await changeStudentResidence(schoolId, studentId, newResidenceType, year, term, user.uid);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsChanging(false);
    }
  }, [schoolId, user?.uid]);

  const addAdjustment = useCallback(async (
    studentId: string,
    adjustment: Omit<FeeAdjustment, 'id'>
  ) => {
    if (!user?.uid) {
      setError('Not authenticated');
      return null;
    }

    setIsAssigning(true);
    setError(null);

    try {
      if (useMockData) {
        return { success: true };
      }

      return await applyFeeAdjustment(studentId, adjustment);
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsAssigning(false);
    }
  }, [user?.uid]);

  return {
    assignFees,
    changeResidence,
    addAdjustment,
    isAssigning,
    isChanging,
    error,
  };
}

// ============================================
// Hook: useBoardingFeeReport
// Generate boarding vs day scholar report
// ============================================
export function useBoardingFeeReport(year?: number, term?: string) {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const [report, setReport] = useState<BoardingFeeReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = year || new Date().getFullYear();
  const currentTerm = term || 'term_2';

  const generateReport = useCallback(async () => {
    if (!schoolId || !user?.uid) {
      setError('Not authenticated');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (useMockData) {
        const mockReport = getMockBoardingFeeReport();
        setReport(mockReport);
        return mockReport;
      }

      const newReport = await generateBoardingFeeReport(schoolId, currentYear, currentTerm, user.uid);
      setReport(newReport);
      return newReport;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [schoolId, user?.uid, currentYear, currentTerm]);

  // Auto-load on mount
  useEffect(() => {
    if (schoolId) {
      setIsLoading(true);
      if (useMockData) {
        setReport(getMockBoardingFeeReport());
        setIsLoading(false);
      } else {
        generateReport().finally(() => setIsLoading(false));
      }
    }
  }, [schoolId]);

  return {
    report,
    isLoading,
    isGenerating,
    error,
    generateReport,
    refresh: generateReport,
  };
}

// ============================================
// Wrapper Hooks
// ============================================

export function useFirebaseFeeStructures(year?: number, term?: string) {
  return useFeeStructures(year, term);
}

export function useFirebaseStudentResidenceFees(studentId: string) {
  return useStudentResidenceFees(studentId);
}

export function useFirebaseBoardingFeeReport(year?: number, term?: string) {
  return useBoardingFeeReport(year, term);
}

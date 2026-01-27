/**
 * End-of-Term Financial Summary Hooks
 * React hooks for term-end reporting functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  generateTermFinancialSummary,
  getSavedSummaries,
  getOutstandingStudents,
  getMockTermSummary,
  getMockOutstandingStudents,
} from '../lib/services/term-summary.service';
import {
  TermFinancialSummary,
  StudentOutstandingItem,
  GenerateReportRequest,
  ExportFormat,
  sortStudentsByBalance,
  filterOutstandingStudents,
  groupStudentsByClass,
} from '../types/term-summary';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================
// TERM SUMMARY HOOK
// ============================================

export function useTermSummary(schoolId: string, term?: string, year?: number) {
  const [summary, setSummary] = useState<TermFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    request: Omit<GenerateReportRequest, 'schoolId'>,
    userId: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSummary(getMockTermSummary());
        return getMockTermSummary();
      }

      const result = await generateTermFinancialSummary(
        { ...request, schoolId },
        userId
      );
      setSummary(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  return { summary, isLoading, error, generate };
}

// ============================================
// SAVED SUMMARIES HOOK
// ============================================

export function useSavedSummaries(schoolId: string) {
  const [summaries, setSummaries] = useState<TermFinancialSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      setSummaries([getMockTermSummary()]);
      setIsLoading(false);
      return;
    }

    getSavedSummaries(schoolId)
      .then(setSummaries)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [schoolId]);

  return { summaries, isLoading, error };
}

// ============================================
// OUTSTANDING STUDENTS HOOK
// ============================================

export function useOutstandingStudents(
  schoolId: string,
  minBalance: number = 0,
  classFilter?: string
) {
  const [students, setStudents] = useState<StudentOutstandingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      let mockStudents = getMockOutstandingStudents();
      if (minBalance > 0) {
        mockStudents = filterOutstandingStudents(mockStudents, minBalance);
      }
      if (classFilter) {
        mockStudents = mockStudents.filter(s => s.className === classFilter);
      }
      setStudents(mockStudents);
      setIsLoading(false);
      return;
    }

    getOutstandingStudents(schoolId, minBalance, classFilter)
      .then(setStudents)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [schoolId, minBalance, classFilter]);

  // Derived data
  const totalOutstanding = useMemo(
    () => students.reduce((sum, s) => sum + s.balance, 0),
    [students]
  );

  const byClass = useMemo(() => groupStudentsByClass(students), [students]);

  const sorted = useCallback(
    (order: 'asc' | 'desc' = 'desc') => sortStudentsByBalance(students, order),
    [students]
  );

  return {
    students,
    totalOutstanding,
    byClass,
    sorted,
    count: students.length,
    isLoading,
    error,
  };
}

// ============================================
// REPORT EXPORT HOOK
// ============================================

export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReport = useCallback(async (
    summary: TermFinancialSummary,
    format: ExportFormat,
    options?: {
      includeStudentDetails?: boolean;
      includeCharts?: boolean;
    }
  ) => {
    setIsExporting(true);
    setError(null);

    try {
      // In production, this would generate actual files
      // For now, we'll simulate the export
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (format === 'pdf') {
        // Generate PDF
        console.log('Generating PDF report...');
      } else if (format === 'excel') {
        // Generate Excel
        console.log('Generating Excel report...');
      } else if (format === 'csv') {
        // Generate CSV
        console.log('Generating CSV report...');
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportReport, isExporting, error };
}

// ============================================
// COLLECTION TRENDS HOOK
// ============================================

export function useCollectionTrends(summary: TermFinancialSummary | null) {
  const trends = useMemo(() => {
    if (!summary) return null;

    const weeklyData = summary.weeklyCollection;
    const totalWeeks = weeklyData.length;
    
    // Calculate trend (simple linear regression)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    weeklyData.forEach((week, i) => {
      sumX += i;
      sumY += week.amount;
      sumXY += i * week.amount;
      sumX2 += i * i;
    });

    const slope = totalWeeks > 1
      ? (totalWeeks * sumXY - sumX * sumY) / (totalWeeks * sumX2 - sumX * sumX)
      : 0;

    const trendDirection = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
    const averageWeeklyCollection = sumY / totalWeeks;

    // Find best and worst weeks
    const sortedWeeks = [...weeklyData].sort((a, b) => b.amount - a.amount);
    const bestWeek = sortedWeeks[0];
    const worstWeek = sortedWeeks[sortedWeeks.length - 1];

    return {
      trendDirection,
      slope,
      averageWeeklyCollection,
      bestWeek,
      worstWeek,
      weeklyData,
    };
  }, [summary]);

  return trends;
}

// ============================================
// CLASS PERFORMANCE HOOK
// ============================================

export function useClassPerformance(summary: TermFinancialSummary | null) {
  const performance = useMemo(() => {
    if (!summary) return null;

    const classes = summary.collectionByClass;
    
    // Sort by collection rate
    const sortedByRate = [...classes].sort((a, b) => b.collectionRate - a.collectionRate);
    const topPerformers = sortedByRate.slice(0, 3);
    const bottomPerformers = sortedByRate.slice(-3).reverse();

    // Calculate averages
    const avgCollectionRate = classes.reduce((sum, c) => sum + c.collectionRate, 0) / classes.length;
    const avgFullyPaidRate = classes.reduce((sum, c) => 
      sum + (c.fullyPaidCount / c.totalStudents * 100), 0) / classes.length;

    return {
      classes,
      topPerformers,
      bottomPerformers,
      avgCollectionRate,
      avgFullyPaidRate,
    };
  }, [summary]);

  return performance;
}

// ============================================
// COMBINED REPORTING HOOK
// ============================================

export function useTermReporting(schoolId: string, userId: string) {
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 1');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'students' | 'trends'>('overview');

  const { summary, isLoading: summaryLoading, generate } = useTermSummary(schoolId);
  const { summaries: savedSummaries, isLoading: savedLoading } = useSavedSummaries(schoolId);
  const { students: outstandingStudents, totalOutstanding, isLoading: studentsLoading } = 
    useOutstandingStudents(schoolId);
  const trends = useCollectionTrends(summary);
  const classPerformance = useClassPerformance(summary);
  const { exportReport, isExporting } = useReportExport();

  const isLoading = summaryLoading || savedLoading || studentsLoading;

  const generateReport = useCallback(async () => {
    return generate({
      term: selectedTerm,
      year: selectedYear,
      includeStudentDetails: true,
      includeClassBreakdown: true,
      includePaymentMethods: true,
      includeScholarships: true,
      includeArrears: true,
      includeTrends: true,
    }, userId);
  }, [generate, selectedTerm, selectedYear, userId]);

  return {
    // State
    selectedTerm,
    selectedYear,
    activeTab,
    // Data
    summary,
    savedSummaries,
    outstandingStudents,
    totalOutstanding,
    trends,
    classPerformance,
    // Status
    isLoading,
    isExporting,
    // Actions
    setSelectedTerm,
    setSelectedYear,
    setActiveTab,
    generateReport,
    exportReport: (format: ExportFormat) => summary && exportReport(summary, format),
  };
}

/**
 * useReports Hook
 * Manages reports page state with filtering, audit logs, and report generation
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getMockReportData,
  getActionConfig,
  type AuditLogEntry,
  type AuditActionType,
  type ReportStats,
  type ClassCollectionData,
  type MonthlyTrendData,
  type PaymentChannelData,
  type StellarAuditStats,
  type GeneratedReport,
  type ReportFilters,
} from '@/lib/services/reports.service';

// ============================================================================
// TYPES
// ============================================================================

export type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'this_term' | 'custom';

interface UseReportsOptions {
  pageSize?: number;
}

interface UseReportsReturn {
  // Data
  stats: ReportStats;
  auditLogs: AuditLogEntry[];
  filteredLogs: AuditLogEntry[];
  classCollection: ClassCollectionData[];
  monthlyTrend: MonthlyTrendData[];
  channelBreakdown: PaymentChannelData[];
  stellarStats: StellarAuditStats;
  recentReports: GeneratedReport[];
  
  // Filters
  filters: ReportFilters;
  setFilters: (filters: Partial<ReportFilters>) => void;
  dateRange: DateRangePreset;
  setDateRange: (range: DateRangePreset) => void;
  clearFilters: () => void;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  pageSize: number;
  paginatedLogs: AuditLogEntry[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Status
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => void;
  generateReport: (type: GeneratedReport['type'], format: GeneratedReport['format']) => Promise<GeneratedReport>;
  exportAuditLogs: (format: 'csv' | 'excel' | 'pdf') => Promise<void>;
  
  // Helpers
  getActionConfig: typeof getActionConfig;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDateRangeFromPreset(preset: DateRangePreset): { from: Date | null; to: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return { from: today, to: now };
    case 'this_week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return { from: weekStart, to: now };
    }
    case 'this_month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: monthStart, to: now };
    }
    case 'this_term': {
      // Assuming term started in January
      const termStart = new Date(today.getFullYear(), 0, 1);
      return { from: termStart, to: now };
    }
    case 'custom':
    default:
      return { from: null, to: null };
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `UGX ${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `UGX ${(amount / 1000).toFixed(0)}K`;
  }
  return `UGX ${amount.toLocaleString()}`;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { pageSize = 10 } = options;
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [stats, setStats] = useState<ReportStats>({
    totalExpected: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    totalStudents: 0,
    fullyPaidCount: 0,
    partialPaidCount: 0,
    noPaidCount: 0,
    overdueCount: 0,
    averagePayment: 0,
    totalPayments: 0,
    paymentsThisMonth: 0,
    collectedVsLastMonth: 0,
    studentsVsLastTerm: 0,
  });
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [classCollection, setClassCollection] = useState<ClassCollectionData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<PaymentChannelData[]>([]);
  const [stellarStats, setStellarStats] = useState<StellarAuditStats>({
    totalAnchored: 0,
    pendingAnchor: 0,
    failedAnchor: 0,
    lastSyncTime: new Date(),
    networkStatus: 'disconnected',
    walletAddress: '',
  });
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
  
  // Filter state
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_term');
  const [filters, setFiltersState] = useState<ReportFilters>({
    dateFrom: null,
    dateTo: null,
    actionType: 'all',
    search: '',
    term: 'term1_2026',
    className: 'all',
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Load data
  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      setTimeout(() => {
        const mockData = getMockReportData();
        
        setStats(mockData.stats);
        setAuditLogs(mockData.auditLogs);
        setClassCollection(mockData.classCollection);
        setMonthlyTrend(mockData.monthlyTrend);
        setChannelBreakdown(mockData.channelBreakdown);
        setStellarStats(mockData.stellarStats);
        setRecentReports(mockData.recentReports);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError('Failed to load report data');
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Update date range based on preset
  useEffect(() => {
    if (dateRange !== 'custom') {
      const { from, to } = getDateRangeFromPreset(dateRange);
      setFiltersState(prev => ({
        ...prev,
        dateFrom: from,
        dateTo: to,
      }));
    }
  }, [dateRange]);
  
  // Filter audit logs
  const filteredLogs = useMemo(() => {
    let result = [...auditLogs];
    
    // Filter by action type
    if (filters.actionType && filters.actionType !== 'all') {
      result = result.filter(log => log.action === filters.actionType);
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      result = result.filter(log => log.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(log => log.timestamp <= filters.dateTo!);
    }
    
    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(log =>
        log.details.toLowerCase().includes(searchLower) ||
        log.actor.toLowerCase().includes(searchLower) ||
        log.studentName?.toLowerCase().includes(searchLower) ||
        log.studentId?.toLowerCase().includes(searchLower) ||
        log.stellarTxHash?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [auditLogs, filters]);
  
  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage, pageSize]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  
  // Filter setters
  const setFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setDateRange('this_term');
    setFiltersState({
      dateFrom: null,
      dateTo: null,
      actionType: 'all',
      search: '',
      term: 'term1_2026',
      className: 'all',
    });
  }, []);
  
  // Pagination methods
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);
  
  // Report generation
  const generateReport = useCallback(async (
    type: GeneratedReport['type'],
    format: GeneratedReport['format']
  ): Promise<GeneratedReport> => {
    // Simulate report generation
    const report: GeneratedReport = {
      id: `rpt-${Date.now()}`,
      name: getReportName(type),
      type,
      generatedAt: new Date(),
      generatedBy: 'Current User',
      dateRange: {
        from: filters.dateFrom || new Date(),
        to: filters.dateTo || new Date(),
      },
      format,
      status: 'generating',
    };
    
    // Add to recent reports
    setRecentReports(prev => [report, ...prev].slice(0, 10));
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update status
    const completedReport = { ...report, status: 'ready' as const };
    setRecentReports(prev =>
      prev.map(r => r.id === report.id ? completedReport : r)
    );
    
    return completedReport;
  }, [filters.dateFrom, filters.dateTo]);
  
  // Export audit logs
  const exportAuditLogs = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    // Simulate export
    console.log(`Exporting ${filteredLogs.length} audit logs as ${format}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would trigger a download
    alert(`Export complete! Downloaded audit_logs.${format}`);
  }, [filteredLogs]);
  
  return {
    // Data
    stats,
    auditLogs,
    filteredLogs,
    classCollection,
    monthlyTrend,
    channelBreakdown,
    stellarStats,
    recentReports,
    
    // Filters
    filters,
    setFilters,
    dateRange,
    setDateRange,
    clearFilters,
    
    // Pagination
    currentPage,
    totalPages,
    pageSize,
    paginatedLogs,
    goToPage,
    nextPage,
    prevPage,
    
    // Status
    isLoading,
    error,
    
    // Actions
    refreshData: loadData,
    generateReport,
    exportAuditLogs,
    
    // Helpers
    getActionConfig,
    formatCurrency,
    formatPercentage,
  };
}

// Helper to get report name from type
function getReportName(type: GeneratedReport['type']): string {
  const names: Record<GeneratedReport['type'], string> = {
    collection_summary: 'Collection Summary Report',
    audit_trail: 'Audit Trail Report',
    class_report: 'Class Collection Report',
    student_ledger: 'Student Ledger Report',
    bank_reconciliation: 'Bank Reconciliation Report',
  };
  return names[type] || 'Report';
}

export default useReports;

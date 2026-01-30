/**
 * usePayments Hook
 * Manages payment data, filtering, and statistics
 * Ready for Firebase integration
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PaymentListItem,
  PaymentStats,
  PaymentFilters,
  PaymentActivity,
  ChannelBreakdown,
  CollectionTrend,
  getMockPaymentData,
  getPayments as getFirebasePayments,
  getPaymentStats as getFirebasePaymentStats,
} from "@/lib/services/payments.service";
import { PaymentChannel, PaymentRecordStatus } from "@/types/payment";

// ============================================================================
// TYPES
// ============================================================================

interface UsePaymentsOptions {
  pageSize?: number;
  useMockData?: boolean;
  schoolId?: string;
}

interface UsePaymentsReturn {
  // Data
  payments: PaymentListItem[];
  stats: PaymentStats;
  activities: PaymentActivity[];
  channelBreakdown: ChannelBreakdown[];
  collectionTrend: CollectionTrend[];

  // Filters
  filters: PaymentFilters;
  setFilters: (filters: Partial<PaymentFilters>) => void;
  resetFilters: () => void;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;

  // State
  isLoading: boolean;
  error: string | null;
  refresh: () => void;

  // Available filter options
  availableChannels: string[];
  availableStatuses: string[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_FILTERS: PaymentFilters = {
  search: "",
  channel: "All",
  status: "All",
  dateFrom: null,
  dateTo: null,
  sortBy: "date",
  sortOrder: "desc",
};

const AVAILABLE_CHANNELS = [
  "All",
  "momo_mtn",
  "momo_airtel",
  "bank_transfer",
  "cash",
  "cheque",
  "other",
];
const AVAILABLE_STATUSES = ["All", "pending", "cleared", "reversed", "failed"];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePayments(
  options: UsePaymentsOptions = {},
): UsePaymentsReturn {
  const {
    pageSize = 10,
    useMockData = true,
    schoolId = "school-001",
  } = options;

  // State
  const [allPayments, setAllPayments] = useState<PaymentListItem[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    todayCollection: 0,
    todayCount: 0,
    weekCollection: 0,
    weekCount: 0,
    monthCollection: 0,
    monthCount: 0,
    pendingVerification: 0,
    clearedCount: 0,
    totalCollection: 0,
    averagePayment: 0,
  });
  const [activities, setActivities] = useState<PaymentActivity[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<ChannelBreakdown[]>(
    [],
  );
  const [collectionTrend, setCollectionTrend] = useState<CollectionTrend[]>([]);
  const [filters, setFiltersState] = useState<PaymentFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockData = getMockPaymentData();
        setAllPayments(mockData.payments);
        setStats(mockData.stats);
        setActivities(mockData.activities);
        setChannelBreakdown(mockData.channelBreakdown);
        setCollectionTrend(mockData.collectionTrend);
      } else {
        // Fetch from Firebase
        const [paymentsResult, statsData] = await Promise.all([
          getFirebasePayments(schoolId, filters, pageSize),
          getFirebasePaymentStats(schoolId),
        ]);

        setAllPayments(paymentsResult.payments);
        setStats(statsData);

        // Generate activities from recent payments
        const recentActivities: PaymentActivity[] = paymentsResult.payments
          .slice(0, 10)
          .map((p) => ({
            id: `act-${p.id}`,
            type: "payment_recorded" as const,
            description: `Payment of UGX ${p.amount.toLocaleString()} from ${p.studentName}`,
            amount: p.amount,
            studentName: p.studentName,
            performedBy: p.recordedBy,
            timestamp: p.recordedAt,
          }));
        setActivities(recentActivities);

        // Calculate channel breakdown from payments
        const channelMap = new Map<
          PaymentChannel,
          { amount: number; count: number }
        >();
        paymentsResult.payments.forEach((p) => {
          const existing = channelMap.get(p.channel) || { amount: 0, count: 0 };
          channelMap.set(p.channel, {
            amount: existing.amount + p.amount,
            count: existing.count + 1,
          });
        });

        const totalAmount = Array.from(channelMap.values()).reduce(
          (sum, c) => sum + c.amount,
          0,
        );
        const channelLabels: Record<PaymentChannel, string> = {
          momo_mtn: "MTN MoMo",
          momo_airtel: "Airtel Money",
          bank_transfer: "Bank Transfer",
          cash: "Cash",
          cheque: "Cheque",
          other: "Other",
        };

        const breakdown: ChannelBreakdown[] = Array.from(
          channelMap.entries(),
        ).map(([channel, data]) => ({
          channel,
          label: channelLabels[channel] || channel,
          amount: data.amount,
          count: data.count,
          percentage:
            totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
        }));
        setChannelBreakdown(breakdown);

        // Generate collection trend for last 7 days
        const trend: CollectionTrend[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const dayPayments = paymentsResult.payments.filter(
            (p) => p.recordedAt.toISOString().split("T")[0] === dateStr,
          );
          trend.push({
            date: dateStr,
            amount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
            count: dayPayments.length,
          });
        }
        setCollectionTrend(trend);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }, [useMockData, schoolId, filters, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredPayments = useMemo(() => {
    let result = [...allPayments];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (payment) =>
          payment.studentName.toLowerCase().includes(searchLower) ||
          payment.receiptNumber.toLowerCase().includes(searchLower) ||
          payment.transactionRef.toLowerCase().includes(searchLower) ||
          payment.studentId.toLowerCase().includes(searchLower),
      );
    }

    // Channel filter
    if (filters.channel && filters.channel !== "All") {
      result = result.filter((payment) => payment.channel === filters.channel);
    }

    // Status filter
    if (filters.status && filters.status !== "All") {
      result = result.filter((payment) => payment.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(
        (payment) => payment.recordedAt >= filters.dateFrom!,
      );
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((payment) => payment.recordedAt <= endDate);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "date":
          comparison = a.recordedAt.getTime() - b.recordedAt.getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "student":
          comparison = a.studentName.localeCompare(b.studentName);
          break;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [allPayments, filters]);

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ============================================================================
  // FILTER MANAGEMENT
  // ============================================================================

  const setFilters = useCallback((newFilters: Partial<PaymentFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    payments: paginatedPayments,
    stats,
    activities,
    channelBreakdown,
    collectionTrend,
    filters,
    setFilters,
    resetFilters,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    isLoading,
    error,
    refresh: fetchData,
    availableChannels: AVAILABLE_CHANNELS,
    availableStatuses: AVAILABLE_STATUSES,
  };
}

// Re-export types for convenience
export type {
  PaymentListItem,
  PaymentStats,
  PaymentFilters,
  PaymentActivity,
  ChannelBreakdown,
  CollectionTrend,
};

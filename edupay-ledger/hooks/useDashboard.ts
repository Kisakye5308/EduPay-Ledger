/**
 * useDashboard Hook
 * 
 * Custom hook for managing dashboard state and data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  DashboardData, 
  getDashboardData, 
  getMockDashboardData,
  subscribeToDashboard 
} from '@/lib/services/dashboard.service';

interface UseDashboardOptions {
  schoolId?: string;
  realtime?: boolean;
  useMockData?: boolean;
}

interface UseDashboardReturn {
  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { 
    schoolId, 
    realtime = false, 
    useMockData = true // Default to mock data for development
  } = options;

  const [data, setData] = useState<DashboardData>(() => ({
    stats: {
      totalCollected: 0,
      collectionTarget: 0,
      outstanding: 0,
      overdue30Days: 0,
      collectionProgress: 0,
      percentageChange: '0%',
      totalStudents: 0,
      activeStudents: 0,
      fullyPaidStudents: 0,
      partialStudents: 0,
      overdueStudents: 0,
      noPaymentStudents: 0,
    },
    heatmap: [],
    recentActivity: [],
    installmentStats: [],
    isLoading: true,
  }));

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Use mock data for development
        const mockData = getMockDashboardData();
        setData(mockData);
      } else if (schoolId) {
        // Fetch real data from Firebase
        const dashboardData = await getDashboardData(schoolId);
        setData(dashboardData);
        if (dashboardData.error) {
          setError(dashboardData.error);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, useMockData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    // For mock data, just load once
    if (useMockData) {
      fetchData();
      return;
    }

    // For real data with real-time updates
    if (realtime && schoolId) {
      const unsubscribe = subscribeToDashboard(schoolId, (newData) => {
        setData(newData);
        setIsLoading(false);
        if (newData.error) {
          setError(newData.error);
        }
      });

      return () => unsubscribe();
    }

    // For real data without real-time updates
    if (schoolId) {
      fetchData();
    }
  }, [schoolId, realtime, useMockData, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}

export default useDashboard;

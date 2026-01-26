/**
 * Custom Hooks for Firebase Services
 * Provides React hooks for accessing Firebase data with real-time updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuth } from '@/contexts/AuthContext';
import {
  getDashboardStats,
  getWeeklyTrend,
  getMonthlyTrend,
  getPaymentChannelDistribution,
  getRecentActivity,
  getQuickStats,
  getDashboardAlerts,
  subscribeToRecentActivity,
  type DashboardStats,
  type RecentActivity,
  type DashboardAlert,
} from '@/services/firebase/dashboard.service';
import {
  getStudents,
  getStudent,
  getStudentStats,
  searchStudents,
  subscribeToStudents,
  type StudentFilters,
  type StudentStats,
} from '@/services/firebase/students.service';
import {
  getPayments,
  getPaymentStats,
  subscribeToPayments,
  subscribeToTodayPayments,
  type PaymentFilters,
  type PaymentStats,
} from '@/services/firebase/payments.service';
import {
  getSchoolSettings,
  getTerms,
  getCurrentTerm,
  getClasses,
  subscribeToSchoolSettings,
  type SchoolSettings,
  type Term,
  type SchoolClass,
} from '@/services/firebase/settings.service';
import type { Student } from '@/types/student';
import type { Payment } from '@/types/payment';

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats(termId?: string) {
  const { user } = useFirebaseAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats(user.schoolId, termId);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, termId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Hook for real-time recent activity
 */
export function useRecentActivity() {
  const { user } = useFirebaseAuth();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRecentActivity(
      user.schoolId,
      (data) => {
        setActivities(data);
        setLoading(false);
      },
      (error) => {
        console.error('Activity subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.schoolId]);

  return { activities, loading };
}

/**
 * Hook for dashboard alerts
 */
export function useDashboardAlerts() {
  const { user } = useFirebaseAuth();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      try {
        const data = await getDashboardAlerts(user.schoolId);
        setAlerts(data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user?.schoolId]);

  return { alerts, loading };
}

/**
 * Hook for chart data
 */
export function useDashboardCharts(termId?: string) {
  const { user } = useFirebaseAuth();
  const [weeklyTrend, setWeeklyTrend] = useState<{ day: string; amount: number }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; amount: number }[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<{ channel: string; amount: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const fetchChartData = async () => {
      try {
        const [weekly, monthly, channels] = await Promise.all([
          getWeeklyTrend(user.schoolId),
          getMonthlyTrend(user.schoolId),
          getPaymentChannelDistribution(user.schoolId, termId),
        ]);

        setWeeklyTrend(weekly);
        setMonthlyTrend(monthly);
        setChannelDistribution(channels);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user?.schoolId, termId]);

  return { weeklyTrend, monthlyTrend, channelDistribution, loading };
}

// ============================================================================
// STUDENT HOOKS
// ============================================================================

/**
 * Hook for students list with filters
 */
export function useStudents(filters: Partial<StudentFilters> = {}) {
  const { user } = useFirebaseAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { students: data } = await getStudents({
        schoolId: user.schoolId,
        ...filters,
      });
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, error, refetch: fetchStudents };
}

/**
 * Hook for real-time student updates
 */
export function useStudentsRealtime() {
  const { user } = useFirebaseAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToStudents(
      user.schoolId,
      (data) => {
        setStudents(data);
        setLoading(false);
      },
      (error) => {
        console.error('Students subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.schoolId]);

  return { students, loading };
}

/**
 * Hook for single student
 */
export function useStudent(studentId: string | null) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setStudent(null);
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await getStudent(studentId);
        setStudent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  return { student, loading, error };
}

/**
 * Hook for student statistics
 */
export function useStudentStats() {
  const { user } = useFirebaseAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await getStudentStats(user.schoolId);
        setStats(data);
      } catch (error) {
        console.error('Error fetching student stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.schoolId]);

  return { stats, loading };
}

/**
 * Hook for student search
 */
export function useStudentSearch(searchTerm: string, debounceMs: number = 300) {
  const { user } = useFirebaseAuth();
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.schoolId || !searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const data = await searchStudents(user.schoolId, searchTerm);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [user?.schoolId, searchTerm, debounceMs]);

  return { results, loading };
}

// ============================================================================
// PAYMENT HOOKS
// ============================================================================

/**
 * Hook for payments list
 */
export function usePayments(filters: Partial<PaymentFilters> = {}) {
  const { user } = useFirebaseAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { payments: data } = await getPayments({
        schoolId: user.schoolId,
        ...filters,
      });
      setPayments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refetch: fetchPayments };
}

/**
 * Hook for real-time payment updates
 */
export function usePaymentsRealtime(filters?: { studentId?: string; termId?: string }) {
  const { user } = useFirebaseAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPayments(
      user.schoolId,
      (data) => {
        setPayments(data);
        setLoading(false);
      },
      (error) => {
        console.error('Payments subscription error:', error);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [user?.schoolId, filters]);

  return { payments, loading };
}

/**
 * Hook for today's payments in real-time
 */
export function useTodayPayments() {
  const { user } = useFirebaseAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToTodayPayments(
      user.schoolId,
      (data) => {
        setPayments(data);
        setTotal(data.reduce((sum, p) => sum + (p.status === 'cleared' ? p.amount : 0), 0));
        setLoading(false);
      },
      (error) => {
        console.error('Today payments subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.schoolId]);

  return { payments, total, loading };
}

/**
 * Hook for payment statistics
 */
export function usePaymentStats(termId?: string) {
  const { user } = useFirebaseAuth();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await getPaymentStats(user.schoolId, termId);
        setStats(data);
      } catch (error) {
        console.error('Error fetching payment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.schoolId, termId]);

  return { stats, loading };
}

// ============================================================================
// SETTINGS HOOKS
// ============================================================================

/**
 * Hook for school settings with real-time updates
 */
export function useSchoolSettings() {
  const { user } = useFirebaseAuth();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToSchoolSettings(
      user.schoolId,
      (data) => {
        setSettings(data);
        setLoading(false);
      },
      (error) => {
        console.error('Settings subscription error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.schoolId]);

  return { settings, loading };
}

/**
 * Hook for terms
 */
export function useTerms() {
  const { user } = useFirebaseAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const fetchTerms = async () => {
      try {
        const [allTerms, current] = await Promise.all([
          getTerms(user.schoolId),
          getCurrentTerm(user.schoolId),
        ]);
        setTerms(allTerms);
        setCurrentTerm(current);
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [user?.schoolId]);

  return { terms, currentTerm, loading };
}

/**
 * Hook for classes
 */
export function useClasses() {
  const { user } = useFirebaseAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        const data = await getClasses(user.schoolId);
        setClasses(data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user?.schoolId]);

  return { classes, loading };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to format currency in Ugandan Shillings
 */
export function useCurrencyFormat() {
  const { settings } = useSchoolSettings();
  
  const format = useCallback((amount: number): string => {
    const symbol = settings?.currencySymbol || 'UGX';
    return `${symbol} ${amount.toLocaleString('en-UG')}`;
  }, [settings?.currencySymbol]);

  const formatCompact = useCallback((amount: number): string => {
    const symbol = settings?.currencySymbol || 'UGX';
    if (amount >= 1000000) {
      return `${symbol} ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol} ${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol} ${amount.toLocaleString('en-UG')}`;
  }, [settings?.currencySymbol]);

  return { format, formatCompact };
}

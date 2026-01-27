/**
 * Firebase Data Hooks
 * 
 * Provides hooks that automatically connect to Firebase using the authenticated user's school.
 * These hooks wrap the existing hooks and inject the schoolId from AuthContext.
 */

'use client';

import { useFirebaseAuth } from '@/contexts/AuthContext';
import { useDashboard } from './useDashboard';
import { useStudents } from './useStudents';
import { usePayments } from './usePayments';
import { useReports } from './useReports';
import { useSettings } from './useSettings';

// Environment check - use mock data in development when not connected to Firebase
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

/**
 * Dashboard hook with automatic Firebase connection
 */
export function useFirebaseDashboard(options: { realtime?: boolean } = {}) {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  
  const dashboard = useDashboard({
    schoolId: user?.schoolId,
    realtime: options.realtime ?? true,
    useMockData: USE_MOCK_DATA || !user?.schoolId,
  });

  return {
    ...dashboard,
    isAuthenticated: !!user,
    authLoading,
  };
}

/**
 * Students hook with automatic Firebase connection
 */
export function useFirebaseStudents(options: { pageSize?: number } = {}) {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  
  const students = useStudents({
    schoolId: user?.schoolId,
    pageSize: options.pageSize ?? 10,
    useMockData: USE_MOCK_DATA || !user?.schoolId,
  });

  return {
    ...students,
    isAuthenticated: !!user,
    authLoading,
  };
}

/**
 * Payments hook with automatic Firebase connection
 */
export function useFirebasePayments(options: { pageSize?: number } = {}) {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  
  const payments = usePayments({
    schoolId: user?.schoolId,
    pageSize: options.pageSize ?? 10,
    useMockData: USE_MOCK_DATA || !user?.schoolId,
  });

  return {
    ...payments,
    isAuthenticated: !!user,
    authLoading,
    currentUser: user,
  };
}

/**
 * Reports hook with automatic Firebase connection
 */
export function useFirebaseReports(options: { pageSize?: number } = {}) {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  
  const reports = useReports({
    pageSize: options.pageSize ?? 10,
  });

  return {
    ...reports,
    isAuthenticated: !!user,
    authLoading,
    schoolId: user?.schoolId,
  };
}

/**
 * Settings hook with automatic Firebase connection
 */
export function useFirebaseSettings() {
  const { user, isLoading: authLoading, hasPermission } = useFirebaseAuth();
  
  const settings = useSettings();

  return {
    ...settings,
    isAuthenticated: !!user,
    authLoading,
    canManageSettings: hasPermission('manage_settings'),
    canManageUsers: hasPermission('manage_users'),
  };
}

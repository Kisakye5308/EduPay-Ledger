/**
 * useSettings Hook
 * Comprehensive state management for system settings
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMockSettingsData,
  getRoleConfig,
  getLogLevelConfig,
  type SchoolInfo,
  type AcademicTerm,
  type ClassConfig,
  type FeeTemplate,
  type UserAccount,
  type SMSConfig,
  type PaymentGateway,
  type StellarConfig,
  type BackupConfig,
  type SystemLog,
  type SystemStatus,
  type NotificationPrefs,
  type AppSettings,
} from '@/lib/services/settings.service';

export interface SettingsState {
  schoolInfo: SchoolInfo;
  currentTerm: AcademicTerm;
  classes: ClassConfig[];
  users: UserAccount[];
  feeTemplates: FeeTemplate[];
  smsConfig: SMSConfig;
  paymentGateways: PaymentGateway[];
  stellarConfig: StellarConfig;
  backupConfig: BackupConfig;
  systemLogs: SystemLog[];
  systemStatus: SystemStatus;
  notificationPrefs: NotificationPrefs;
  appSettings: AppSettings;
}

export interface UseSettingsReturn {
  // State
  settings: SettingsState | null;
  isLoading: boolean;
  error: Error | null;
  
  // UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // User Management
  filteredUsers: UserAccount[];
  userRoleFilter: string;
  setUserRoleFilter: (role: string) => void;
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<UserAccount>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // System Logs
  filteredLogs: SystemLog[];
  logFilters: { level: string; category: string; dateRange: string };
  setLogFilters: (filters: { level: string; category: string; dateRange: string }) => void;
  
  // Settings Updates
  updateSchoolInfo: (data: Partial<SchoolInfo>) => Promise<void>;
  updateSMSConfig: (data: Partial<SMSConfig>) => Promise<void>;
  updateStellarConfig: (data: Partial<StellarConfig>) => Promise<void>;
  updateBackupConfig: (data: Partial<BackupConfig>) => Promise<void>;
  updateNotificationPrefs: (data: Partial<NotificationPrefs>) => Promise<void>;
  updateAppSettings: (data: Partial<AppSettings>) => Promise<void>;
  togglePaymentGateway: (id: string) => Promise<void>;
  
  // Actions
  testSMSConnection: () => Promise<{ success: boolean; message: string }>;
  sendTestSMS: (phone: string) => Promise<{ success: boolean; message: string }>;
  syncPaymentGateways: () => Promise<void>;
  createBackup: () => Promise<{ success: boolean; message: string }>;
  restoreBackup: (backupId: string) => Promise<void>;
  exportData: (format: 'json' | 'csv' | 'pdf') => Promise<void>;
  
  // Helpers
  getRoleConfig: typeof getRoleConfig;
  getLogLevelConfig: typeof getLogLevelConfig;
  refreshData: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  // Core state
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [logFilters, setLogFilters] = useState({ level: 'all', category: 'all', dateRange: 'today' });
  
  // Load initial data
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        const data = getMockSettingsData();
        setSettings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);
  
  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!settings) return [];
    let users = settings.users;
    
    if (userRoleFilter !== 'all') {
      users = users.filter(u => u.role === userRoleFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    }
    
    return users;
  }, [settings, userRoleFilter, searchQuery]);
  
  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!settings) return [];
    let logs = settings.systemLogs;
    
    if (logFilters.level !== 'all') {
      logs = logs.filter(l => l.level === logFilters.level);
    }
    
    if (logFilters.category !== 'all') {
      logs = logs.filter(l => l.category === logFilters.category);
    }
    
    if (logFilters.dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      logs = logs.filter(l => l.timestamp >= today);
    } else if (logFilters.dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      logs = logs.filter(l => l.timestamp >= weekAgo);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [settings, logFilters]);
  
  // User management
  const addUser = useCallback(async (user: Omit<UserAccount, 'id' | 'createdAt'>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      const newUser: UserAccount = {
        ...user,
        id: `user-${Date.now()}`,
        createdAt: new Date(),
      };
      return { ...prev, users: [...prev.users, newUser] };
    });
  }, []);
  
  const updateUser = useCallback(async (id: string, data: Partial<UserAccount>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        users: prev.users.map(u => u.id === id ? { ...u, ...data } : u),
      };
    });
  }, []);
  
  const deleteUser = useCallback(async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, users: prev.users.filter(u => u.id !== id) };
    });
  }, []);
  
  // Settings updates
  const updateSchoolInfo = useCallback(async (data: Partial<SchoolInfo>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, schoolInfo: { ...prev.schoolInfo, ...data } };
    });
  }, []);
  
  const updateSMSConfig = useCallback(async (data: Partial<SMSConfig>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, smsConfig: { ...prev.smsConfig, ...data } };
    });
  }, []);
  
  const updateStellarConfig = useCallback(async (data: Partial<StellarConfig>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, stellarConfig: { ...prev.stellarConfig, ...data } };
    });
  }, []);
  
  const updateBackupConfig = useCallback(async (data: Partial<BackupConfig>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, backupConfig: { ...prev.backupConfig, ...data } };
    });
  }, []);
  
  const updateNotificationPrefs = useCallback(async (data: Partial<NotificationPrefs>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, notificationPrefs: { ...prev.notificationPrefs, ...data } };
    });
  }, []);
  
  const updateAppSettings = useCallback(async (data: Partial<AppSettings>) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return { ...prev, appSettings: { ...prev.appSettings, ...data } };
    });
  }, []);
  
  const togglePaymentGateway = useCallback(async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        paymentGateways: prev.paymentGateways.map(pg =>
          pg.id === id ? { ...pg, isEnabled: !pg.isEnabled, status: pg.isEnabled ? 'disconnected' : 'connected' as const } : pg
        ),
      };
    });
  }, []);
  
  // Actions
  const testSMSConnection = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'SMS connection test successful. Balance: UGX 45,600' };
  }, []);
  
  const sendTestSMS = useCallback(async (phone: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, message: `Test SMS sent successfully to ${phone}` };
  }, []);
  
  const syncPaymentGateways = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        paymentGateways: prev.paymentGateways.map(pg => ({
          ...pg,
          lastSync: new Date(),
        })),
      };
    });
  }, []);
  
  const createBackup = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        backupConfig: { ...prev.backupConfig, lastBackupTime: new Date() },
      };
    });
    return { success: true, message: 'Backup created successfully. Size: 245MB' };
  }, []);
  
  const restoreBackup = useCallback(async (backupId: string) => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Restored backup:', backupId);
  }, []);
  
  const exportData = useCallback(async (format: 'json' | 'csv' | 'pdf') => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Exported data in format:', format);
    // In production, this would trigger a download
  }, []);
  
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = getMockSettingsData();
    setSettings(data);
    setIsLoading(false);
  }, []);
  
  return {
    settings,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    userRoleFilter,
    setUserRoleFilter,
    addUser,
    updateUser,
    deleteUser,
    filteredLogs,
    logFilters,
    setLogFilters,
    updateSchoolInfo,
    updateSMSConfig,
    updateStellarConfig,
    updateBackupConfig,
    updateNotificationPrefs,
    updateAppSettings,
    togglePaymentGateway,
    testSMSConnection,
    sendTestSMS,
    syncPaymentGateways,
    createBackup,
    restoreBackup,
    exportData,
    getRoleConfig,
    getLogLevelConfig,
    refreshData,
  };
}

/**
 * Payment Promise Hooks
 * React hooks for payment promise tracking and management
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PaymentPromise,
  PromiseWithStatus,
  PromiseSummary,
  PromiseFollowUp,
  ReminderTemplate,
  CreatePromiseRequest,
  PromiseStatus,
  PromisePriority,
  ReminderType,
} from '../types/payment-promise';
import {
  createPaymentPromise,
  getSchoolPromises,
  getStudentPromises,
  updatePromiseStatus,
  recordPaymentOnPromise,
  extendPromiseDueDate,
  cancelPromise,
  getDueReminders,
  recordReminderSent,
  scheduleNextReminder,
  getPromiseFollowUps,
  generatePromiseSummary,
  getReminderTemplates,
  getMockPromises,
  getMockPromiseSummary,
} from '../lib/services/payment-promise.service';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================
// PROMISES LIST HOOK
// ============================================

interface UsePromisesReturn {
  promises: PromiseWithStatus[];
  isLoading: boolean;
  error: string | null;
  filters: {
    status: PromiseStatus[];
    priority: PromisePriority[];
    className: string;
  };
  setFilters: (filters: Partial<UsePromisesReturn['filters']>) => void;
  refresh: () => Promise<void>;
}

export function usePromises(schoolId: string): UsePromisesReturn {
  const [promises, setPromises] = useState<PromiseWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<UsePromisesReturn['filters']>({
    status: [],
    priority: [],
    className: '',
  });

  const fetchPromises = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        let mockPromises = getMockPromises();
        
        // Apply filters
        if (filters.status.length > 0) {
          mockPromises = mockPromises.filter(p => filters.status.includes(p.status));
        }
        if (filters.priority.length > 0) {
          mockPromises = mockPromises.filter(p => filters.priority.includes(p.priority));
        }
        if (filters.className) {
          mockPromises = mockPromises.filter(p => p.studentClass === filters.className);
        }
        
        setPromises(mockPromises);
      } else {
        const data = await getSchoolPromises(schoolId, {
          status: filters.status.length > 0 ? filters.status : undefined,
          priority: filters.priority.length > 0 ? filters.priority : undefined,
          className: filters.className || undefined,
        });
        setPromises(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promises');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, filters]);

  useEffect(() => {
    fetchPromises();
  }, [fetchPromises]);

  const setFilters = useCallback((updates: Partial<UsePromisesReturn['filters']>) => {
    setFiltersState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    promises,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchPromises,
  };
}

// ============================================
// STUDENT PROMISES HOOK
// ============================================

export function useStudentPromises(schoolId: string, studentId: string) {
  const [promises, setPromises] = useState<PromiseWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromises = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        const mockPromises = getMockPromises().filter(p => p.studentId === studentId);
        setPromises(mockPromises);
      } else {
        const data = await getStudentPromises(schoolId, studentId);
        setPromises(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promises');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, studentId]);

  useEffect(() => {
    fetchPromises();
  }, [fetchPromises]);

  return { promises, isLoading, error, refresh: fetchPromises };
}

// ============================================
// PROMISE MANAGEMENT HOOK
// ============================================

interface UsePromiseManagementReturn {
  createPromise: (
    request: CreatePromiseRequest,
    studentInfo: { name: string; className: string; guardianName: string; guardianPhone: string; guardianEmail?: string }
  ) => Promise<PaymentPromise>;
  updateStatus: (promiseId: string, status: PromiseStatus, notes?: string) => Promise<void>;
  recordPayment: (promiseId: string, paymentId: string, amount: number) => Promise<void>;
  extendDueDate: (promiseId: string, newDueDate: Date, reason: string) => Promise<void>;
  cancel: (promiseId: string, reason: string) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
}

export function usePromiseManagement(
  schoolId: string,
  userId: string
): UsePromiseManagementReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPromise = useCallback(async (
    request: CreatePromiseRequest,
    studentInfo: { name: string; className: string; guardianName: string; guardianPhone: string; guardianEmail?: string }
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (useMockData) {
        // Return mock promise
        const mockPromise: PaymentPromise = {
          id: `promise_${Date.now()}`,
          schoolId,
          studentId: request.studentId,
          studentName: studentInfo.name,
          studentClass: studentInfo.className,
          promisedAmount: request.promisedAmount,
          promiseDate: new Date(),
          dueDate: request.dueDate,
          gracePeriodDays: request.gracePeriodDays ?? 7,
          guardianName: studentInfo.guardianName,
          guardianPhone: studentInfo.guardianPhone,
          guardianEmail: studentInfo.guardianEmail,
          status: 'pending',
          priority: request.priority ?? 'medium',
          amountPaid: 0,
          paymentIds: [],
          reminderCount: 0,
          notes: request.notes,
          reason: request.reason,
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date(),
        };
        return mockPromise;
      }

      return await createPaymentPromise(schoolId, request, studentInfo, userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create promise';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [schoolId, userId]);

  const updateStatus = useCallback(async (
    promiseId: string,
    status: PromiseStatus,
    notes?: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!useMockData) {
        await updatePromiseStatus(promiseId, status, notes);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recordPayment = useCallback(async (
    promiseId: string,
    paymentId: string,
    amount: number
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!useMockData) {
        await recordPaymentOnPromise(promiseId, paymentId, amount);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record payment';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const extendDueDate = useCallback(async (
    promiseId: string,
    newDueDate: Date,
    reason: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!useMockData) {
        await extendPromiseDueDate(promiseId, newDueDate, reason, userId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extend due date';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [userId]);

  const cancel = useCallback(async (promiseId: string, reason: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!useMockData) {
        await cancelPromise(promiseId, reason);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel promise';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    createPromise,
    updateStatus,
    recordPayment,
    extendDueDate,
    cancel,
    isProcessing,
    error,
  };
}

// ============================================
// PROMISE SUMMARY HOOK
// ============================================

export function usePromiseSummary(schoolId: string) {
  const [summary, setSummary] = useState<PromiseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        setSummary(getMockPromiseSummary());
      } else {
        const data = await generatePromiseSummary(schoolId);
        setSummary(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, refresh: fetchSummary };
}

// ============================================
// PROMISE REMINDERS HOOK
// ============================================

interface UseRemindersReturn {
  dueReminders: PromiseWithStatus[];
  templates: ReminderTemplate[];
  isLoading: boolean;
  error: string | null;
  sendReminder: (
    promiseId: string,
    type: ReminderType,
    message: string,
    sentTo: string
  ) => Promise<void>;
  scheduleReminder: (promiseId: string, nextDate: Date) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReminders(schoolId: string, userId: string): UseRemindersReturn {
  const [dueReminders, setDueReminders] = useState<PromiseWithStatus[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Mock due reminders
        const mockPromises = getMockPromises();
        setDueReminders(mockPromises.filter(p => 
          p.nextReminderDate && new Date(p.nextReminderDate) <= new Date()
        ));
        
        // Mock templates
        setTemplates([
          {
            id: 'template_1',
            schoolId,
            name: 'Initial Reminder',
            type: 'sms',
            message: 'Dear {guardianName}, reminder that payment of {amount} for {studentName} is due {dueDate}.',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      } else {
        const [reminders, templateData] = await Promise.all([
          getDueReminders(schoolId),
          getReminderTemplates(schoolId),
        ]);
        setDueReminders(reminders);
        setTemplates(templateData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendReminder = useCallback(async (
    promiseId: string,
    type: ReminderType,
    message: string,
    sentTo: string
  ) => {
    if (!useMockData) {
      await recordReminderSent(promiseId, type, message, userId, sentTo);
    }
    await fetchData();
  }, [userId, fetchData]);

  const scheduleReminderFn = useCallback(async (promiseId: string, nextDate: Date) => {
    if (!useMockData) {
      await scheduleNextReminder(promiseId, nextDate);
    }
    await fetchData();
  }, [fetchData]);

  return {
    dueReminders,
    templates,
    isLoading,
    error,
    sendReminder,
    scheduleReminder: scheduleReminderFn,
    refresh: fetchData,
  };
}

// ============================================
// FOLLOW-UPS HOOK
// ============================================

export function usePromiseFollowUps(promiseId: string) {
  const [followUps, setFollowUps] = useState<PromiseFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    if (!promiseId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Mock follow-ups
        setFollowUps([
          {
            id: 'followup_1',
            promiseId,
            actionType: 'reminder_sent',
            actionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            performedBy: 'bursar',
            notes: 'SMS reminder sent',
          },
          {
            id: 'followup_2',
            promiseId,
            actionType: 'phone_call',
            actionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            performedBy: 'bursar',
            notes: 'Parent promised to pay by Friday',
            outcome: 'Positive',
          },
        ]);
      } else {
        const data = await getPromiseFollowUps(promiseId);
        setFollowUps(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups');
    } finally {
      setIsLoading(false);
    }
  }, [promiseId]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  return { followUps, isLoading, error, refresh: fetchFollowUps };
}

// ============================================
// URGENT PROMISES HOOK (FOR DASHBOARD)
// ============================================

export function useUrgentPromises(schoolId: string) {
  const [urgentPromises, setUrgentPromises] = useState<PromiseWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUrgent() {
      setIsLoading(true);
      try {
        if (useMockData) {
          const all = getMockPromises();
          setUrgentPromises(
            all.filter(p => 
              p.urgencyLevel === 'high' || 
              p.urgencyLevel === 'critical'
            ).slice(0, 5)
          );
        } else {
          const all = await getSchoolPromises(schoolId, {
            status: ['due', 'overdue', 'partial'],
          });
          setUrgentPromises(
            all.filter(p => 
              p.urgencyLevel === 'high' || 
              p.urgencyLevel === 'critical'
            ).slice(0, 5)
          );
        }
      } catch {
        setUrgentPromises([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUrgent();
  }, [schoolId]);

  return { urgentPromises, isLoading };
}

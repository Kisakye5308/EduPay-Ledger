/**
 * Parent Portal Hooks
 * React hooks for parent-facing features
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ParentAccount,
  ParentStudentFeeOverview,
  ParentPaymentHistoryItem,
  FeeStatement,
  PaymentReceipt,
  ParentAnnouncement,
  ParentDashboardSummary,
  NotificationPreferences,
} from '../types/parent-portal';
import {
  getParentAccount,
  getParentByPhone,
  updateNotificationPreferences,
  getParentStudentFeeOverview,
  getParentPaymentHistory,
  generateFeeStatement,
  generatePaymentReceipt,
  getParentAnnouncements,
  getParentDashboardSummary,
  getMockParentAccount,
  getMockParentDashboard,
  getMockAnnouncements,
} from '../lib/services/parent-portal.service';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================
// PARENT ACCOUNT HOOK
// ============================================

export function useParentAccount(parentId: string | null) {
  const [account, setAccount] = useState<ParentAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!parentId) {
      setAccount(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        setAccount(getMockParentAccount());
      } else {
        const data = await getParentAccount(parentId);
        setAccount(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    if (!parentId || useMockData) return;
    
    await updateNotificationPreferences(parentId, preferences);
    await fetchAccount();
  }, [parentId, fetchAccount]);

  return { account, isLoading, error, refresh: fetchAccount, updatePreferences };
}

// ============================================
// PARENT DASHBOARD HOOK
// ============================================

export function useParentDashboard(parentId: string | null) {
  const [dashboard, setDashboard] = useState<ParentDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!parentId) {
      setDashboard(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        setDashboard(getMockParentDashboard());
      } else {
        const data = await getParentDashboardSummary(parentId);
        setDashboard(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, isLoading, error, refresh: fetchDashboard };
}

// ============================================
// STUDENT FEE OVERVIEW HOOK
// ============================================

export function useStudentFeeOverview(studentId: string | null) {
  const [overview, setOverview] = useState<ParentStudentFeeOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      if (!studentId) {
        setOverview(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (useMockData) {
          // Return mock overview
          setOverview({
            studentId,
            studentName: 'Sarah Nakamya',
            className: 'S.3',
            residenceType: 'boarder',
            currentTerm: {
              term: 'Term 2',
              year: 2024,
              totalFees: 1500000,
              totalPaid: 1050000,
              balance: 450000,
              paymentProgress: 70,
            },
            feeBreakdown: [
              { category: 'Tuition', amount: 900000, paid: 630000, balance: 270000 },
              { category: 'Boarding', amount: 375000, paid: 262500, balance: 112500 },
              { category: 'Development', amount: 150000, paid: 105000, balance: 45000 },
              { category: 'Other', amount: 75000, paid: 52500, balance: 22500 },
            ],
            clearanceStatus: {
              isCleared: true,
              clearanceType: 'partial',
              minimumRequired: 900000,
              message: 'Cleared for examinations',
            },
            previousBalance: 0,
            totalOwed: 450000,
          });
        } else {
          const data = await getParentStudentFeeOverview(studentId);
          setOverview(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fee overview');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOverview();
  }, [studentId]);

  return { overview, isLoading, error };
}

// ============================================
// PAYMENT HISTORY HOOK
// ============================================

export function usePaymentHistory(studentIds: string[]) {
  const [payments, setPayments] = useState<ParentPaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      if (studentIds.length === 0) {
        setPayments([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (useMockData) {
          setPayments([
            {
              id: 'pay_1',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              amount: 200000,
              method: 'mtn_mobile',
              reference: 'TXN123456',
              studentName: 'Sarah Nakamya',
              status: 'completed',
              receiptNumber: 'RCP/2024/001',
            },
            {
              id: 'pay_2',
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              amount: 350000,
              method: 'bank_transfer',
              reference: 'BNK789012',
              studentName: 'James Nakamya',
              status: 'completed',
              receiptNumber: 'RCP/2024/002',
            },
            {
              id: 'pay_3',
              date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              amount: 500000,
              method: 'cash',
              reference: 'CSH001',
              studentName: 'Sarah Nakamya',
              status: 'completed',
              receiptNumber: 'RCP/2024/003',
            },
          ]);
        } else {
          const data = await getParentPaymentHistory(studentIds);
          setPayments(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment history');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, [studentIds.join(',')]);

  return { payments, isLoading, error };
}

// ============================================
// FEE STATEMENT HOOK
// ============================================

export function useFeeStatement(studentId: string | null) {
  const [statement, setStatement] = useState<FeeStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (schoolInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  }) => {
    if (!studentId) return null;

    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        const mockStatement: FeeStatement = {
          id: `stmt_${Date.now()}`,
          generatedAt: new Date(),
          schoolName: schoolInfo.name,
          schoolAddress: schoolInfo.address,
          schoolPhone: schoolInfo.phone,
          schoolEmail: schoolInfo.email,
          schoolLogo: schoolInfo.logo,
          studentId,
          studentName: 'Sarah Nakamya',
          className: 'S.3',
          admissionNumber: 'STU-001',
          guardianName: 'Mrs. Grace Nakamya',
          guardianPhone: '+256772123456',
          term: 'Term 2',
          year: 2024,
          feeItems: [
            { description: 'Tuition Fee', amount: 900000 },
            { description: 'Boarding Fee', amount: 375000 },
            { description: 'Development Levy', amount: 150000 },
            { description: 'Examination Fee', amount: 45000 },
            { description: 'Computer Lab', amount: 30000 },
          ],
          totalFees: 1500000,
          payments: [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), amount: 500000, reference: 'CSH001', method: 'cash' },
            { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), amount: 350000, reference: 'BNK789012', method: 'bank_transfer' },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), amount: 200000, reference: 'TXN123456', method: 'mtn_mobile' },
          ],
          totalPaid: 1050000,
          previousBalance: 0,
          totalOwed: 1500000,
          currentBalance: 450000,
        };
        setStatement(mockStatement);
        return mockStatement;
      } else {
        const data = await generateFeeStatement(studentId, schoolInfo);
        setStatement(data);
        return data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate statement');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  return { statement, isLoading, error, generate };
}

// ============================================
// PAYMENT RECEIPT HOOK
// ============================================

export function usePaymentReceipt() {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    paymentId: string,
    schoolInfo: { name: string; address: string; phone: string; code: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      if (useMockData) {
        const mockReceipt: PaymentReceipt = {
          receiptNumber: 'RCP/2024/001',
          generatedAt: new Date(),
          schoolName: schoolInfo.name,
          schoolAddress: schoolInfo.address,
          schoolPhone: schoolInfo.phone,
          studentName: 'Sarah Nakamya',
          className: 'S.3',
          admissionNumber: 'STU-001',
          amount: 200000,
          amountInWords: 'Two Hundred Thousand Uganda Shillings Only',
          paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          paymentMethod: 'MTN Mobile Money',
          reference: 'TXN123456',
          allocations: [{ category: 'School Fees', amount: 200000 }],
          previousBalance: 650000,
          balanceAfter: 450000,
          receivedBy: 'Bursar',
        };
        setReceipt(mockReceipt);
        return mockReceipt;
      } else {
        const data = await generatePaymentReceipt(paymentId, schoolInfo);
        setReceipt(data);
        return data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate receipt');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { receipt, isLoading, error, generate };
}

// ============================================
// ANNOUNCEMENTS HOOK
// ============================================

export function useAnnouncements(
  schoolId: string,
  studentClasses: string[],
  studentResidenceTypes: string[]
) {
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      setIsLoading(true);
      setError(null);

      try {
        if (useMockData) {
          setAnnouncements(getMockAnnouncements());
        } else {
          const data = await getParentAnnouncements(schoolId, studentClasses, studentResidenceTypes);
          setAnnouncements(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnouncements();
  }, [schoolId, studentClasses.join(','), studentResidenceTypes.join(',')]);

  return { announcements, isLoading, error };
}

// ============================================
// QUICK PAY HOOK
// ============================================

export function useQuickPay() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePay = useCallback(async (
    studentId: string,
    amount: number,
    phoneNumber: string,
    provider: 'mtn' | 'airtel' | 'bank'
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      // This would integrate with actual payment providers
      // For now, simulate the request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (useMockData) {
        return {
          success: true,
          transactionId: `TXN${Date.now()}`,
          message: 'Payment request sent. Please check your phone to complete.',
        };
      }

      // Real implementation would call payment gateway
      throw new Error('Payment gateway not configured');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      return { success: false, message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { initiatePay, isProcessing, error };
}

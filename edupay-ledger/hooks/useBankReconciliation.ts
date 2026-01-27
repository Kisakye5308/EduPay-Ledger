/**
 * Bank Reconciliation Hooks
 * React hooks for bank statement reconciliation functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getReconciliationSessions,
  getSessionTransactions,
  getReconciliationSummary,
  createReconciliationSession,
  manualMatch,
  unmatchTransaction,
  ignoreTransaction,
  parseBankStatement,
  getMockReconciliationSessions,
  getMockTransactions,
} from '../lib/services/bank-reconciliation.service';
import {
  ReconciliationSession,
  BankTransactionWithStatus,
  ReconciliationSummary,
  ReconciliationStatus,
  BankTransaction,
  BankImportConfig,
  UGANDA_BANK_CONFIGS,
} from '../types/bank-reconciliation';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ============================================
// RECONCILIATION SESSIONS HOOK
// ============================================

export function useReconciliationSessions(schoolId: string) {
  const [sessions, setSessions] = useState<ReconciliationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      setSessions(getMockReconciliationSessions());
      setIsLoading(false);
      return;
    }

    getReconciliationSessions(schoolId)
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [schoolId]);

  const refresh = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setSessions(getMockReconciliationSessions());
      return;
    }
    const data = await getReconciliationSessions(schoolId);
    setSessions(data);
  }, [schoolId]);

  return { sessions, isLoading, error, refresh };
}

// ============================================
// SESSION TRANSACTIONS HOOK
// ============================================

export function useSessionTransactions(
  schoolId: string,
  sessionId: string | null,
  statusFilter?: ReconciliationStatus
) {
  const [transactions, setTransactions] = useState<BankTransactionWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !sessionId) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      let mockTx = getMockTransactions();
      if (statusFilter) {
        mockTx = mockTx.filter(tx => tx.status === statusFilter);
      }
      setTransactions(mockTx);
      setIsLoading(false);
      return;
    }

    getSessionTransactions(schoolId, sessionId, statusFilter)
      .then(setTransactions)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [schoolId, sessionId, statusFilter]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    
    if (USE_MOCK_DATA) {
      let mockTx = getMockTransactions();
      if (statusFilter) {
        mockTx = mockTx.filter(tx => tx.status === statusFilter);
      }
      setTransactions(mockTx);
      return;
    }

    const data = await getSessionTransactions(schoolId, sessionId, statusFilter);
    setTransactions(data);
  }, [schoolId, sessionId, statusFilter]);

  // Group by status
  const byStatus = useMemo(() => {
    const grouped: { [key: string]: BankTransactionWithStatus[] } = {
      pending: [],
      matched: [],
      manual_match: [],
      unmatched: [],
      ignored: [],
      disputed: [],
    };
    transactions.forEach((tx) => {
      if (grouped[tx.status]) {
        grouped[tx.status].push(tx);
      }
    });
    return grouped;
  }, [transactions]);

  // Totals
  const totals = useMemo(() => {
    const credits = transactions.filter(tx => tx.type === 'credit');
    const debits = transactions.filter(tx => tx.type === 'debit');
    return {
      totalCredits: credits.reduce((sum, tx) => sum + tx.amount, 0),
      totalDebits: debits.reduce((sum, tx) => sum + tx.amount, 0),
      creditCount: credits.length,
      debitCount: debits.length,
    };
  }, [transactions]);

  return { 
    transactions, 
    byStatus, 
    totals, 
    isLoading, 
    error, 
    refresh 
  };
}

// ============================================
// RECONCILIATION SUMMARY HOOK
// ============================================

export function useReconciliationSummary(
  schoolId: string,
  sessionId: string | null
) {
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId || !sessionId) {
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (USE_MOCK_DATA) {
      // Mock summary
      setSummary({
        sessionId,
        totalBankCredits: 12500000,
        totalBankDebits: 350000,
        totalSystemPayments: 12750000,
        matchedAmount: 11800000,
        unmatchedBankAmount: 700000,
        unmatchedSystemAmount: 950000,
        variance: -250000,
        matchRate: 84.4,
        byStatus: [
          { status: 'matched', count: 38, amount: 11500000 },
          { status: 'manual_match', count: 2, amount: 300000 },
          { status: 'unmatched', count: 5, amount: 700000 },
          { status: 'ignored', count: 3, amount: 15000 },
        ],
        byPaymentMethod: [],
      });
      setIsLoading(false);
      return;
    }

    getReconciliationSummary(schoolId, sessionId)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [schoolId, sessionId]);

  return { summary, isLoading, error };
}

// ============================================
// RECONCILIATION ACTIONS HOOK
// ============================================

export function useReconciliationActions(schoolId: string, onSuccess?: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const match = useCallback(async (
    transactionId: string,
    paymentId: string,
    userId: string,
    notes?: string
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!USE_MOCK_DATA) {
        await manualMatch(schoolId, transactionId, paymentId, userId, notes);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [schoolId, onSuccess]);

  const unmatch = useCallback(async (transactionId: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!USE_MOCK_DATA) {
        await unmatchTransaction(schoolId, transactionId);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [schoolId, onSuccess]);

  const ignore = useCallback(async (
    transactionId: string,
    reason: string,
    userId: string
  ) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!USE_MOCK_DATA) {
        await ignoreTransaction(schoolId, transactionId, reason, userId);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [schoolId, onSuccess]);

  return { match, unmatch, ignore, isProcessing, error };
}

// ============================================
// IMPORT WIZARD HOOK
// ============================================

export type ImportStep = 'upload' | 'configure' | 'preview' | 'importing' | 'complete';

export function useImportWizard(schoolId: string, userId: string) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [bankConfig, setBankConfig] = useState<BankImportConfig | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<BankTransaction[]>([]);
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [session, setSession] = useState<ReconciliationSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse file
  const parseFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n');
      
      // Simple CSV parsing
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows: Record<string, unknown>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, unknown> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }

      setRawData(rows);
      setStep('configure');
    } catch (err: any) {
      setError(`Failed to parse file: ${err.message}`);
    }
  }, []);

  // Auto-detect bank from columns
  const detectBank = useCallback(() => {
    if (rawData.length === 0) return null;
    
    const columns = Object.keys(rawData[0]);
    
    for (const [bankKey, config] of Object.entries(UGANDA_BANK_CONFIGS)) {
      const hasDateCol = columns.some(c => c.includes(config.dateColumn));
      const hasAmountCol = columns.some(c => c.includes(config.amountColumn));
      
      if (hasDateCol && hasAmountCol) {
        return { key: bankKey, config };
      }
    }
    
    return null;
  }, [rawData]);

  // Apply bank configuration
  const applyConfig = useCallback((config: BankImportConfig) => {
    setBankConfig(config);
    const transactions = parseBankStatement(rawData, config);
    setParsedTransactions(transactions);
    setStep('preview');
  }, [rawData]);

  // Start import
  const startImport = useCallback(async () => {
    if (!bankConfig || parsedTransactions.length === 0) {
      setError('No transactions to import');
      return;
    }

    setIsProcessing(true);
    setStep('importing');
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        // Mock session creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSession({
          id: `mock-${Date.now()}`,
          schoolId,
          bankAccountName,
          bankAccountNumber,
          statementPeriodStart: new Date(),
          statementPeriodEnd: new Date(),
          fileName: file?.name || 'statement.csv',
          importedAt: new Date(),
          importedBy: userId,
          status: 'in_progress',
          totalTransactions: parsedTransactions.length,
          totalCredits: parsedTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
          totalDebits: parsedTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
          matchedCount: Math.floor(parsedTransactions.length * 0.85),
          unmatchedCount: Math.ceil(parsedTransactions.length * 0.15),
          ignoredCount: 0,
        });
      } else {
        const newSession = await createReconciliationSession(
          schoolId,
          bankAccountName,
          bankAccountNumber,
          file?.name || 'statement.csv',
          parsedTransactions,
          userId
        );
        setSession(newSession);
      }
      
      setStep('complete');
    } catch (err: any) {
      setError(err.message);
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [schoolId, userId, bankConfig, parsedTransactions, bankAccountName, bankAccountNumber, file]);

  // Reset wizard
  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setBankConfig(null);
    setParsedTransactions([]);
    setBankAccountName('');
    setBankAccountNumber('');
    setSession(null);
    setError(null);
  }, []);

  return {
    step,
    file,
    rawData,
    bankConfig,
    parsedTransactions,
    bankAccountName,
    bankAccountNumber,
    session,
    isProcessing,
    error,
    // Actions
    parseFile,
    detectBank,
    applyConfig,
    setBankAccountName,
    setBankAccountNumber,
    startImport,
    reset,
    setStep,
    // Available configs
    availableBankConfigs: UGANDA_BANK_CONFIGS,
  };
}

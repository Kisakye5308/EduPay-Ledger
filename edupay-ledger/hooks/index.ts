export { useAuth } from './useAuth';
export { useOffline, useOfflineQueue } from './useOffline';
export { useInstallments } from './useInstallments';
export { useDashboard } from './useDashboard';
export { useStudents } from './useStudents';
export { usePayments } from './usePayments';
export { useReports } from './useReports';
export { useSettings } from './useSettings';

// Firebase hooks
export {
  useDashboardStats,
  useRecentActivity,
  useDashboardAlerts,
  useDashboardCharts,
  useStudents as useStudentsFirebase,
  useStudentsRealtime,
  useStudent,
  useStudentStats,
  useStudentSearch,
  usePayments as usePaymentsFirebase,
  usePaymentsRealtime,
  useTodayPayments,
  usePaymentStats,
  useSchoolSettings,
  useTerms,
  useClasses,
  useCurrencyFormat,
} from './useFirebase';

// Fee Category hooks
export {
  useFeeCategories,
  useFeeStructures,
  useStudentFeeBreakdown,
  useCategoryCollectionReport,
  useFirebaseFeeCategories,
} from './useFeeCategories';

// Exam Clearance hooks
export {
  useClearanceThresholds,
  useStudentClearance,
  useClearanceReport,
  useFirebaseExamClearance,
} from './useExamClearance';

// Scholarship hooks
export {
  useScholarships,
  useStudentScholarships,
  useScholarshipBeneficiaries,
  useScholarshipReport,
  useFirebaseScholarships,
} from './useScholarship';

// Term Balance Carryover hooks
export {
  useTermCarryovers,
  useStudentTermBalance,
  useCarryoverProcessing,
  useCarryoverAdjustments,
  useArrearsReport,
  useFirebaseTermCarryovers,
  useFirebaseStudentTermBalance,
  useFirebaseCarryoverProcessing,
  useFirebaseCarryoverAdjustments,
  useFirebaseArrearsReport,
} from './useTermBalance';

// Residence/Boarding Fee hooks
export {
  useFeeStructures,
  useFeeStructureManagement,
  useStudentResidenceFees,
  useStudentFeeAssignment,
  useBoardingFeeReport,
  useFirebaseFeeStructures,
  useFirebaseStudentResidenceFees,
  useFirebaseBoardingFeeReport,
} from './useResidenceFees';

// Bulk Import hooks
export {
  useImportWizard,
  useImportHistory,
  useFileDrop,
} from './useBulkImport';
export type { ImportStep } from './useBulkImport';

// Payment Promise hooks
export {
  usePromises,
  useStudentPromises,
  usePromiseManagement,
  usePromiseSummary,
  useReminders,
  usePromiseFollowUps,
  useUrgentPromises,
} from './usePaymentPromise';

// Parent Portal hooks
export {
  useParentAccount,
  useParentDashboard,
  useStudentFeeOverview,
  usePaymentHistory,
  useFeeStatement,
  usePaymentReceipt,
  useAnnouncements,
  useQuickPay,
} from './useParentPortal';

// Quick Actions Dashboard hooks
export {
  useDailySummary,
  usePendingTasks,
  useDashboardAlerts,
  useQuickActions,
  useQuickSearch,
  useKeyboardShortcuts,
  useBursarDashboard,
} from './useQuickActions';

// Bank Reconciliation hooks
export {
  useReconciliationSessions,
  useSessionTransactions,
  useReconciliationSummary,
  useReconciliationActions,
  useImportWizard as useReconciliationImportWizard,
} from './useBankReconciliation';

// End-of-Term Financial Summary hooks
export {
  useTermSummary,
  useSavedSummaries,
  useOutstandingStudents,
  useReportExport,
  useCollectionTrends,
  useClassPerformance,
  useTermReporting,
} from './useTermSummary';

/**
 * Term Balance Carryover Components
 * UI components for displaying and managing term balance carryovers
 */

'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Modal, ProgressBar } from '../ui';
import {
  TermBalanceCarryover,
  StudentCumulativeBalance,
  ArrearsReport,
  ArrearsAgingBucket,
  ClassArrearsSummary,
  StudentArrearsDetail,
  AcademicPeriod,
  formatAcademicPeriod,
} from '../../types/term-balance';

// Utility function
function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// StudentCumulativeBalanceCard
// Shows a student's total balance across terms
// ============================================
interface StudentCumulativeBalanceCardProps {
  balance: StudentCumulativeBalance | null;
  isLoading?: boolean;
  onRecordPayment?: () => void;
  onViewHistory?: () => void;
}

export function StudentCumulativeBalanceCard({
  balance,
  isLoading,
  onRecordPayment,
  onViewHistory,
}: StudentCumulativeBalanceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <div className="text-center py-8 text-slate-500">
          <span className="material-symbols-outlined text-4xl mb-2">account_balance</span>
          <p>No balance information available</p>
        </div>
      </Card>
    );
  }

  const hasArrears = balance.totalOutstanding > 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          Cumulative Balance
        </h3>
        {hasArrears && (
          <Badge variant="danger" className="text-xs">
            {balance.arrearsCount} {balance.arrearsCount === 1 ? 'Term' : 'Terms'} in Arrears
          </Badge>
        )}
      </div>

      {/* Current Term Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Current Term Fees</p>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
            {formatUGX(balance.currentTermFees)}
          </p>
        </div>
        <div className="text-center p-3 bg-success/10 rounded-lg">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Paid This Term</p>
          <p className="text-lg font-bold text-success">
            {formatUGX(balance.currentTermPaid)}
          </p>
        </div>
        <div className="text-center p-3 bg-warning/10 rounded-lg">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Term Balance</p>
          <p className="text-lg font-bold text-warning">
            {formatUGX(balance.currentTermBalance)}
          </p>
        </div>
      </div>

      {/* Carryover Section */}
      {(balance.carryoverBalance > 0 || balance.carryoverCredits > 0) && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-4">
          <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
            Balance Carried Forward
          </h4>
          <div className="space-y-2">
            {balance.carryoverBalance > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Previous Terms Arrears
                  {balance.oldestArrears && (
                    <span className="text-xs text-slate-400 ml-1">
                      (from {formatAcademicPeriod(balance.oldestArrears)})
                    </span>
                  )}
                </span>
                <span className="font-bold text-danger">{formatUGX(balance.carryoverBalance)}</span>
              </div>
            )}
            {balance.carryoverCredits > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Credits (Overpayments)</span>
                <span className="font-bold text-success">-{formatUGX(balance.carryoverCredits)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total Outstanding */}
      <div className={`p-4 rounded-lg ${hasArrears ? 'bg-danger/10' : 'bg-success/10'}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Outstanding</p>
            <p className="text-xs text-slate-500">
              {balance.currentPeriod && formatAcademicPeriod(balance.currentPeriod)}
            </p>
          </div>
          <p className={`text-2xl font-bold ${hasArrears ? 'text-danger' : 'text-success'}`}>
            {formatUGX(balance.totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        {onRecordPayment && (
          <Button
            variant="primary"
            className="flex-1"
            icon={<span className="material-symbols-outlined text-sm">add_card</span>}
            onClick={onRecordPayment}
          >
            Record Payment
          </Button>
        )}
        {onViewHistory && (
          <Button
            variant="outline"
            className="flex-1"
            icon={<span className="material-symbols-outlined text-sm">history</span>}
            onClick={onViewHistory}
          >
            View History
          </Button>
        )}
      </div>
    </Card>
  );
}

// ============================================
// CarryoverHistoryList
// Shows history of carryovers for a student
// ============================================
interface CarryoverHistoryListProps {
  carryovers: TermBalanceCarryover[];
  isLoading?: boolean;
  onAdjust?: (carryover: TermBalanceCarryover) => void;
  onWaive?: (carryover: TermBalanceCarryover) => void;
}

export function CarryoverHistoryList({
  carryovers,
  isLoading,
  onAdjust,
  onWaive,
}: CarryoverHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (carryovers.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">history</span>
        <p>No carryover history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {carryovers.map(carryover => (
        <div
          key={carryover.id}
          className={`p-4 rounded-lg border ${
            carryover.status === 'waived'
              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
              : carryover.carryoverType === 'credit'
              ? 'bg-success/5 border-success/20'
              : 'bg-warning/5 border-warning/20'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium">
                {formatAcademicPeriod(carryover.fromPeriod)} → {formatAcademicPeriod(carryover.toPeriod)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Original: {formatUGX(carryover.fromTermFees)} • Paid: {formatUGX(carryover.fromTermPaid)}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant={
                  carryover.status === 'waived' ? 'secondary' :
                  carryover.status === 'applied' ? 'success' :
                  carryover.status === 'disputed' ? 'danger' : 'warning'
                }
                className="text-xs"
              >
                {carryover.status}
              </Badge>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${
                carryover.carryoverType === 'credit' ? 'text-success' : 'text-warning'
              }`}>
                {carryover.carryoverType === 'credit' ? '-' : '+'}{formatUGX(carryover.adjustedAmount)}
              </span>
              {carryover.adjustments.length > 0 && (
                <span className="text-xs text-slate-500">
                  ({carryover.adjustments.length} adjustment{carryover.adjustments.length > 1 ? 's' : ''})
                </span>
              )}
            </div>

            {carryover.status !== 'waived' && (onAdjust || onWaive) && (
              <div className="flex gap-2">
                {onAdjust && (
                  <button
                    onClick={() => onAdjust(carryover)}
                    className="text-xs text-primary hover:underline"
                  >
                    Adjust
                  </button>
                )}
                {onWaive && (
                  <button
                    onClick={() => onWaive(carryover)}
                    className="text-xs text-danger hover:underline"
                  >
                    Waive
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Show adjustments */}
          {carryover.adjustments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 mb-2">Adjustments:</p>
              {carryover.adjustments.map(adj => (
                <div key={adj.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>{adj.type}: {adj.reason}</span>
                  <span className="text-success">-{formatUGX(adj.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// ArrearsReportDashboard
// Comprehensive arrears report display
// ============================================
interface ArrearsReportDashboardProps {
  report: ArrearsReport | null;
  isLoading?: boolean;
  onGenerateReport?: () => void;
  onContactStudent?: (student: StudentArrearsDetail) => void;
  onExport?: () => void;
}

export function ArrearsReportDashboard({
  report,
  isLoading,
  onGenerateReport,
  onContactStudent,
  onExport,
}: ArrearsReportDashboardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'by-class' | 'students'>('summary');
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentArrearsDetail | null>(null);

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">assessment</span>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
          No Arrears Report Available
        </h3>
        <p className="text-slate-500 mb-6">Generate a report to view arrears analysis</p>
        {onGenerateReport && (
          <Button variant="primary" onClick={onGenerateReport}>
            Generate Report
          </Button>
        )}
      </Card>
    );
  }

  const handleContactClick = (student: StudentArrearsDetail) => {
    setSelectedStudent(student);
    setShowContactModal(true);
    if (onContactStudent) onContactStudent(student);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Arrears Report</h2>
          <p className="text-sm text-slate-500">
            As of {formatAcademicPeriod(report.asOfPeriod)} • Generated {report.generatedAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          {onExport && (
            <Button
              variant="outline"
              icon={<span className="material-symbols-outlined text-sm">download</span>}
              onClick={onExport}
            >
              Export
            </Button>
          )}
          {onGenerateReport && (
            <Button
              variant="primary"
              icon={<span className="material-symbols-outlined text-sm">refresh</span>}
              onClick={onGenerateReport}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-danger/5 border border-danger/20">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-danger">people</span>
            <Badge variant="danger">Critical</Badge>
          </div>
          <p className="text-2xl font-bold text-danger">{report.totalStudentsWithArrears}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Students with Arrears</p>
        </Card>

        <Card className="bg-warning/5 border border-warning/20">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-warning">payments</span>
          </div>
          <p className="text-2xl font-bold text-warning">{formatUGX(report.totalArrearsAmount)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Arrears</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
          </div>
          <p className="text-2xl font-bold text-primary">{formatUGX(report.averageArrearsPerStudent)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Average per Student</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-outlined text-slate-600">schedule</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {report.arrearsAging.find(a => a.termCount >= 2)?.studentCount || 0}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">2+ Terms Overdue</p>
        </Card>
      </div>

      {/* Aging Analysis */}
      <Card>
        <h3 className="font-bold text-lg mb-4">Arrears Aging Analysis</h3>
        <div className="space-y-3">
          {report.arrearsAging.map(bucket => (
            <div key={bucket.label} className="flex items-center gap-4">
              <div className="w-32 text-sm text-slate-600 dark:text-slate-400">{bucket.label}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        bucket.termCount === 0 ? 'bg-warning' :
                        bucket.termCount === 1 ? 'bg-orange-500' :
                        bucket.termCount === 2 ? 'bg-danger' : 'bg-red-700'
                      }`}
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{bucket.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-32 text-right">
                <p className="text-sm font-bold">{formatUGX(bucket.totalAmount)}</p>
                <p className="text-xs text-slate-500">{bucket.studentCount} students</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'summary', label: 'Summary', icon: 'dashboard' },
          { id: 'by-class', label: 'By Class', icon: 'school' },
          { id: 'students', label: 'Student List', icon: 'people' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'by-class' && (
        <div className="grid gap-4">
          {report.arrearsByClass.map(classSummary => (
            <Card key={`${classSummary.className}_${classSummary.streamName}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg">
                    {classSummary.className}
                    {classSummary.streamName && ` - ${classSummary.streamName}`}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {classSummary.studentsWithArrears} of {classSummary.totalStudents} students ({classSummary.arrearsPercentage.toFixed(1)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-danger">{formatUGX(classSummary.totalArrearsAmount)}</p>
                  <p className="text-sm text-slate-500">Avg: {formatUGX(classSummary.averageArrears)}</p>
                </div>
              </div>
              <ProgressBar
                value={classSummary.arrearsPercentage}
                max={100}
                className="mt-3"
                color={classSummary.arrearsPercentage > 40 ? 'danger' : classSummary.arrearsPercentage > 25 ? 'warning' : 'primary'}
              />
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'students' && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Class</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Current Term</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Previous Terms</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase">Age</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.studentArrears.slice(0, 20).map(student => (
                  <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-slate-500">{student.guardianPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.className}
                      {student.streamName && ` - ${student.streamName}`}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-warning">
                      {formatUGX(student.currentTermBalance)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-danger">
                      {formatUGX(student.totalPreviousArrears)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-danger">{formatUGX(student.totalOutstanding)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={student.arrearsAge >= 2 ? 'danger' : student.arrearsAge === 1 ? 'warning' : 'secondary'}
                      >
                        {student.arrearsAge} {student.arrearsAge === 1 ? 'term' : 'terms'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<span className="material-symbols-outlined text-sm">contact_phone</span>}
                        onClick={() => handleContactClick(student)}
                      >
                        Contact
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {report.studentArrears.length > 20 && (
            <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800">
              Showing 20 of {report.studentArrears.length} students. Export for full list.
            </div>
          )}
        </Card>
      )}

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold mb-4">Top Classes by Arrears</h3>
            <div className="space-y-3">
              {report.arrearsByClass.slice(0, 5).map((cls, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-danger text-white' :
                    index === 1 ? 'bg-warning text-white' :
                    'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{cls.className} {cls.streamName}</p>
                    <p className="text-xs text-slate-500">{cls.studentsWithArrears} students</p>
                  </div>
                  <p className="font-bold text-danger">{formatUGX(cls.totalArrearsAmount)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-4">Top Individual Arrears</h3>
            <div className="space-y-3">
              {report.studentArrears.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-danger text-white' :
                    index === 1 ? 'bg-warning text-white' :
                    'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{student.studentName}</p>
                    <p className="text-xs text-slate-500">{student.className} • {student.arrearsAge} term(s)</p>
                  </div>
                  <p className="font-bold text-danger">{formatUGX(student.totalOutstanding)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Guardian"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Student</p>
              <p className="font-medium">{selectedStudent.studentName}</p>
              <p className="text-sm text-slate-500">{selectedStudent.className}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Guardian</p>
              <p className="font-medium">{selectedStudent.guardianName}</p>
              <p className="text-primary font-semibold">{selectedStudent.guardianPhone}</p>
            </div>
            <div className="bg-danger/10 p-4 rounded-lg">
              <p className="text-sm text-slate-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-danger">{formatUGX(selectedStudent.totalOutstanding)}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                icon={<span className="material-symbols-outlined text-sm">call</span>}
                onClick={() => window.open(`tel:${selectedStudent.guardianPhone}`)}
              >
                Call
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                icon={<span className="material-symbols-outlined text-sm">sms</span>}
              >
                Send SMS
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================
// CarryoverProcessingCard
// UI for processing term-end carryovers
// ============================================
interface CarryoverProcessingCardProps {
  onProcess: (fromPeriod: AcademicPeriod, toPeriod: AcademicPeriod) => Promise<void>;
  isProcessing?: boolean;
  lastResult?: {
    processedAt: Date;
    totalStudents: number;
    totalAmount: number;
  };
}

export function CarryoverProcessingCard({
  onProcess,
  isProcessing,
  lastResult,
}: CarryoverProcessingCardProps) {
  const currentYear = new Date().getFullYear();
  const [fromYear, setFromYear] = useState(currentYear);
  const [fromTerm, setFromTerm] = useState<'term_1' | 'term_2' | 'term_3'>('term_1');
  const [toYear, setToYear] = useState(currentYear);
  const [toTerm, setToTerm] = useState<'term_1' | 'term_2' | 'term_3'>('term_2');

  const handleProcess = () => {
    onProcess(
      { year: fromYear, term: fromTerm },
      { year: toYear, term: toTerm }
    );
  };

  return (
    <Card>
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">sync</span>
        Process Term Carryovers
      </h3>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            From Term
          </label>
          <div className="flex gap-2">
            <select
              value={fromYear}
              onChange={(e) => setFromYear(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={fromTerm}
              onChange={(e) => setFromTerm(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              <option value="term_1">Term I</option>
              <option value="term_2">Term II</option>
              <option value="term_3">Term III</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            To Term
          </label>
          <div className="flex gap-2">
            <select
              value={toYear}
              onChange={(e) => setToYear(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={toTerm}
              onChange={(e) => setToTerm(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              <option value="term_1">Term I</option>
              <option value="term_2">Term II</option>
              <option value="term_3">Term III</option>
            </select>
          </div>
        </div>
      </div>

      {lastResult && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
          <p className="text-slate-500">Last processed: {lastResult.processedAt.toLocaleString()}</p>
          <p className="font-medium">
            {lastResult.totalStudents} students • {formatUGX(lastResult.totalAmount)} carried forward
          </p>
        </div>
      )}

      <Button
        variant="primary"
        className="w-full"
        onClick={handleProcess}
        disabled={isProcessing}
        icon={
          isProcessing ? (
            <span className="material-symbols-outlined animate-spin text-sm">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm">play_arrow</span>
          )
        }
      >
        {isProcessing ? 'Processing...' : 'Process Carryovers'}
      </Button>
    </Card>
  );
}

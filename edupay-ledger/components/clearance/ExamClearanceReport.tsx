/**
 * Exam Clearance Components
 * 
 * UI components for managing exam clearance in Ugandan schools.
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import {
  ClearanceReport,
  StudentClearanceSummary,
  ClearanceStatus,
  CLEARANCE_STATUS_LABELS,
  CLEARANCE_STATUS_COLORS,
  EXAM_TYPE_LABELS,
} from '@/types/exam-clearance';
import { useClearanceReport, useStudentClearance, useClearanceThresholds } from '@/hooks/useExamClearance';

// ============================================================================
// CLEARANCE DASHBOARD CARD
// ============================================================================

interface ClearanceDashboardCardProps {
  academicYear?: string;
  term?: 1 | 2 | 3;
  examType?: string;
  onViewDetails?: () => void;
  className?: string;
}

export function ClearanceDashboardCard({
  academicYear,
  term,
  examType = 'end_of_term',
  onViewDetails,
  className = '',
}: ClearanceDashboardCardProps) {
  const { stats, isLoading, generateReport } = useClearanceReport(academicYear, term, examType);

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <span className="material-symbols-outlined text-4xl mb-2">assignment</span>
          <p>No clearance data available</p>
          <Button onClick={() => generateReport()} variant="outline" size="sm" className="mt-4">
            Generate Clearance Report
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Exam Clearance Status</h3>
          <p className="text-sm text-gray-500">{EXAM_TYPE_LABELS[examType] || examType}</p>
        </div>
        {onViewDetails && (
          <Button onClick={onViewDetails} variant="outline" size="sm">
            View Details
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✅</span>
            <span className="text-xs text-green-600 font-medium">
              {((stats.cleared / stats.totalStudents) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.cleared}</p>
          <p className="text-xs text-green-600">Cleared</p>
        </div>

        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">⏳</span>
            <span className="text-xs text-yellow-600 font-medium">
              {((stats.conditional / stats.totalStudents) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.conditional}</p>
          <p className="text-xs text-yellow-600">Conditional</p>
        </div>

        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🚫</span>
            <span className="text-xs text-red-600 font-medium">
              {((stats.blocked / stats.totalStudents) * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.blocked}</p>
          <p className="text-xs text-red-600">Blocked</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.clearanceRate.toFixed(1)}%</p>
          <p className="text-xs text-blue-600">Clearance Rate</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-green-500"
          style={{ width: `${(stats.cleared / stats.totalStudents) * 100}%` }}
        />
        <div
          className="absolute h-full bg-yellow-500"
          style={{
            left: `${(stats.cleared / stats.totalStudents) * 100}%`,
            width: `${(stats.conditional / stats.totalStudents) * 100}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Total: {stats.totalStudents} students</span>
        <span>{stats.totalStudents - stats.cleared - stats.conditional - stats.blocked} pending</span>
      </div>
    </Card>
  );
}

// ============================================================================
// CLEARANCE LIST
// ============================================================================

interface ClearanceListProps {
  students: StudentClearanceSummary[];
  status: ClearanceStatus;
  title: string;
  onStudentClick?: (studentId: string) => void;
  onClearStudent?: (studentId: string) => void;
  onBlockStudent?: (studentId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function ClearanceList({
  students,
  status,
  title,
  onStudentClick,
  onClearStudent,
  onBlockStudent,
  showActions = false,
  className = '',
}: ClearanceListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredStudents = students.filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = CLEARANCE_STATUS_COLORS[status];

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (s: StudentClearanceSummary) => (
        <div
          className={onStudentClick ? 'cursor-pointer hover:text-blue-600' : ''}
          onClick={() => onStudentClick?.(s.studentId)}
        >
          <p className="font-medium text-gray-900">{s.studentName}</p>
          <p className="text-xs text-gray-500">{s.studentNumber} • {s.className}</p>
        </div>
      ),
    },
    {
      key: 'fees',
      header: 'Fee Status',
      render: (s: StudentClearanceSummary) => (
        <div>
          <p className="text-sm text-gray-700">{formatCurrency(s.amountPaid)} paid</p>
          <p className="text-xs text-gray-500">of {formatCurrency(s.totalFees)}</p>
        </div>
      ),
    },
    {
      key: 'percentage',
      header: 'Payment %',
      render: (s: StudentClearanceSummary) => (
        <div className="flex items-center gap-2">
          <div className="flex-grow h-2 bg-gray-200 rounded-full max-w-[100px]">
            <div
              className={`h-2 rounded-full ${
                s.paymentPercentage >= 70 ? 'bg-green-500' :
                s.paymentPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(s.paymentPercentage, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{s.paymentPercentage.toFixed(0)}%</span>
        </div>
      ),
    },
    {
      key: 'examFees',
      header: 'Exam Fees',
      render: (s: StudentClearanceSummary) => (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          s.examFeesPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {s.examFeesPaid ? '✓ Paid' : '✗ Unpaid'}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (s: StudentClearanceSummary) => (
        <span className={`font-medium ${s.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(s.balance)}
        </span>
      ),
    },
  ];

  if (showActions) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      render: (s: StudentClearanceSummary) => (
        <div className="flex gap-2">
          {status === 'blocked' && onClearStudent && (
            <Button size="sm" variant="outline" onClick={() => onClearStudent(s.studentId)}>
              Clear
            </Button>
          )}
          {status === 'cleared' && onBlockStudent && (
            <Button size="sm" variant="outline" onClick={() => onBlockStudent(s.studentId)}>
              Block
            </Button>
          )}
        </div>
      ),
    } as any);
  }

  return (
    <Card className={`p-0 overflow-hidden ${className}`}>
      <div className={`px-6 py-4 border-b ${statusColors.bg} ${statusColors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className={`text-lg font-semibold ${statusColors.text}`}>
              {title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors.bg} ${statusColors.text}`}>
              {students.length}
            </span>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {searchTerm ? 'No students match your search' : 'No students in this category'}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredStudents}
          keyExtractor={(s) => s.studentId}
        />
      )}

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <span>Showing {filteredStudents.length} of {students.length} students</span>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
          <span className="material-symbols-outlined text-sm mr-1">print</span>
          Print List
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// FULL CLEARANCE REPORT PAGE COMPONENT
// ============================================================================

interface ExamClearanceReportProps {
  academicYear?: string;
  term?: 1 | 2 | 3;
  examType?: string;
  className?: string;
}

export function ExamClearanceReport({
  academicYear,
  term,
  examType = 'end_of_term',
  className = '',
}: ExamClearanceReportProps) {
  const currentYear = academicYear || new Date().getFullYear().toString();
  const currentTerm = term || 1;

  const { report, stats, isLoading, generateReport, processClass } = useClearanceReport(
    currentYear,
    currentTerm,
    examType
  );

  const [activeTab, setActiveTab] = useState<'summary' | 'cleared' | 'conditional' | 'blocked' | 'exempt'>('summary');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleGenerateReport = async () => {
    setIsProcessing(true);
    await generateReport();
    setIsProcessing(false);
  };

  const handleProcessClass = async () => {
    if (!selectedClass) return;
    setIsProcessing(true);
    const result = await processClass(selectedClass);
    setIsProcessing(false);
    if (result) {
      alert(`Processed ${result.processed} students: ${result.cleared} cleared, ${result.blocked} blocked`);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Clearance Report</h1>
          <p className="text-gray-500">
            {EXAM_TYPE_LABELS[examType]} • {currentYear} Term {currentTerm}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">Select Class</option>
            {report?.byClass.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={handleProcessClass}
            disabled={!selectedClass || isProcessing}
          >
            Process Class
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerateReport}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Regenerate Report'}
          </Button>
        </div>
      </div>

      {/* Dashboard Card */}
      <ClearanceDashboardCard
        academicYear={currentYear}
        term={currentTerm}
        examType={examType}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { key: 'summary', label: 'Summary', count: null },
            { key: 'cleared', label: 'Cleared', count: report?.clearedStudents.length || 0 },
            { key: 'conditional', label: 'Conditional', count: report?.conditionalStudents.length || 0 },
            { key: 'blocked', label: 'Blocked', count: report?.blockedStudents.length || 0 },
            { key: 'exempt', label: 'Exempt', count: report?.exemptStudents.length || 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && report && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-gray-500">Total Expected</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.summary.totalExpected)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(report.summary.totalCollected)}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(report.summary.totalOutstanding)}</p>
            </Card>
          </div>

          {/* By Class Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Clearance by Class</h3>
            </div>
            <Table
              columns={[
                { key: 'className', header: 'Class', render: (c: any) => <span className="font-medium">{c.className}</span> },
                { key: 'totalStudents', header: 'Students', render: (c: any) => c.totalStudents },
                { key: 'cleared', header: 'Cleared', render: (c: any) => <span className="text-green-600">{c.cleared}</span> },
                { key: 'blocked', header: 'Blocked', render: (c: any) => <span className="text-red-600">{c.blocked}</span> },
                { key: 'clearanceRate', header: 'Rate', render: (c: any) => (
                  <span className={`font-medium ${c.clearanceRate >= 80 ? 'text-green-600' : c.clearanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {c.clearanceRate.toFixed(1)}%
                  </span>
                )},
                { key: 'collected', header: 'Collected', render: (c: any) => formatCurrency(c.collected) },
                { key: 'outstanding', header: 'Outstanding', render: (c: any) => <span className="text-red-600">{formatCurrency(c.outstanding)}</span> },
              ]}
              data={report.byClass}
              keyExtractor={(c) => c.classId}
            />
          </Card>
        </div>
      )}

      {activeTab === 'cleared' && report && (
        <ClearanceList
          students={report.clearedStudents}
          status="cleared"
          title="Cleared Students"
          showActions={false}
        />
      )}

      {activeTab === 'conditional' && report && (
        <ClearanceList
          students={report.conditionalStudents}
          status="conditional"
          title="Conditional Clearance"
          showActions={true}
        />
      )}

      {activeTab === 'blocked' && report && (
        <ClearanceList
          students={report.blockedStudents}
          status="blocked"
          title="Blocked Students"
          showActions={true}
        />
      )}

      {activeTab === 'exempt' && report && (
        <ClearanceList
          students={report.exemptStudents}
          status="exempt"
          title="Exempt Students"
          showActions={false}
        />
      )}
    </div>
  );
}

// ============================================================================
// STUDENT CLEARANCE BADGE
// ============================================================================

interface ClearanceBadgeProps {
  status: ClearanceStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function ClearanceBadge({ status, size = 'md', showIcon = true }: ClearanceBadgeProps) {
  const colors = CLEARANCE_STATUS_COLORS[status];
  const icons: Record<ClearanceStatus, string> = {
    cleared: '✅',
    conditional: '⏳',
    blocked: '🚫',
    exempt: '🎓',
    pending_review: '⏸️',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]}`}>
      {showIcon && <span>{icons[status]}</span>}
      {CLEARANCE_STATUS_LABELS[status]}
    </span>
  );
}

export default ExamClearanceReport;

'use client';

import React, { useState, useMemo } from 'react';
import { Card, Table, Badge, Button, Input, ProgressBar, Modal } from '@/components/ui';
import { useReports } from '@/hooks/useReports';
import type { AuditLogEntry, GeneratedReport, ClassCollectionData } from '@/lib/services/reports.service';

// ============================================================================
// ACTION FILTER CONFIG
// ============================================================================

const ACTION_FILTERS = [
  { key: 'all', label: 'All Actions', icon: 'filter_list' },
  { key: 'payment_recorded', label: 'Payments', icon: 'add_card' },
  { key: 'payment_reversed', label: 'Reversals', icon: 'undo' },
  { key: 'student_enrolled', label: 'Enrollments', icon: 'person_add' },
  { key: 'fee_updated', label: 'Fee Changes', icon: 'price_change' },
  { key: 'report_generated', label: 'Reports', icon: 'description' },
];

const DATE_RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_term', label: 'This Term' },
  { key: 'custom', label: 'Custom Range' },
] as const;

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  variant = 'default' 
}: { 
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}) {
  const variantStyles = {
    default: 'bg-white',
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    danger: 'bg-danger-50 border-danger-200',
    primary: 'bg-primary-50 border-primary-200',
  };

  const iconStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
    primary: 'bg-primary-100 text-primary-600',
  };

  return (
    <div className={`p-5 rounded-xl border ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              <span className="material-symbols-rounded text-sm">
                {trend.value >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span>{trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          <span className="material-symbols-rounded text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function CollectionChart({ data }: { data: { month: string; monthLabel: string; collected: number; expected: number; rate: number }[] }) {
  const maxValue = Math.max(...data.map(d => Math.max(d.collected, d.expected)));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.month} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-gray-700">{item.monthLabel}</span>
            <span className="text-gray-500">{item.rate}%</span>
          </div>
          <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gray-300 rounded-full transition-all duration-500"
              style={{ width: `${(item.expected / maxValue) * 100}%` }}
            />
            <div
              className="absolute h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(item.collected / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-500" />
          <span className="text-gray-600">Collected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">Expected</span>
        </div>
      </div>
    </div>
  );
}

function ChannelBreakdownChart({ data }: { data: { channel: string; label: string; amount: number; count: number; percentage: number }[] }) {
  const colors = ['bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-info-500', 'bg-danger-500'];
  
  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="h-8 flex rounded-lg overflow-hidden">
        {data.map((item, index) => (
          <div
            key={item.channel}
            className={`${colors[index % colors.length]} transition-all duration-500`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.label}: ${item.percentage}%`}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.channel} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
              <span className="text-gray-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{item.count} txn</span>
              <span className="font-medium text-gray-900 w-24 text-right">
                UGX {(item.amount / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassCollectionTable({ data }: { data: ClassCollectionData[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600">Class</th>
            <th className="text-center py-2 px-3 font-medium text-gray-600">Students</th>
            <th className="text-right py-2 px-3 font-medium text-gray-600">Collected</th>
            <th className="text-center py-2 px-3 font-medium text-gray-600">Rate</th>
            <th className="text-center py-2 px-3 font-medium text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map(item => (
            <tr key={item.className} className="hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-900">{item.className}</td>
              <td className="py-2 px-3 text-center text-gray-600">{item.totalStudents}</td>
              <td className="py-2 px-3 text-right text-gray-600">
                UGX {(item.totalCollected / 1000000).toFixed(1)}M
              </td>
              <td className="py-2 px-3">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.collectionRate >= 80 ? 'bg-success-500' :
                        item.collectionRate >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                      }`}
                      style={{ width: `${item.collectionRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8">{item.collectionRate}%</span>
                </div>
              </td>
              <td className="py-2 px-3">
                <div className="flex justify-center gap-1">
                  <span className="px-1.5 py-0.5 text-xs bg-success-100 text-success-700 rounded">{item.fullyPaid}</span>
                  <span className="px-1.5 py-0.5 text-xs bg-warning-100 text-warning-700 rounded">{item.partial}</span>
                  <span className="px-1.5 py-0.5 text-xs bg-danger-100 text-danger-700 rounded">{item.noPaid}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StellarStatusBadge({ status }: { status: 'anchored' | 'pending' | 'failed' | null }) {
  if (!status) return <span className="text-gray-400">—</span>;
  
  const config = {
    anchored: { label: 'Anchored', variant: 'success' as const, icon: 'verified' },
    pending: { label: 'Pending', variant: 'warning' as const, icon: 'schedule' },
    failed: { label: 'Failed', variant: 'danger' as const, icon: 'error' },
  };
  
  const { label, variant, icon } = config[status];
  
  return (
    <Badge variant={variant} className="inline-flex items-center gap-1">
      <span className="material-symbols-rounded text-xs">{icon}</span>
      {label}
    </Badge>
  );
}

function ReportGenerationCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
          <span className="material-symbols-rounded">{icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 group-hover:text-primary-700">{title}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <span className="material-symbols-rounded text-gray-400 group-hover:text-primary-500">
          arrow_forward
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReportsPage() {
  const {
    stats,
    filteredLogs,
    paginatedLogs,
    classCollection,
    monthlyTrend,
    channelBreakdown,
    stellarStats,
    recentReports,
    filters,
    setFilters,
    dateRange,
    setDateRange,
    clearFilters,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    isLoading,
    refreshData,
    generateReport,
    exportAuditLogs,
    getActionConfig,
    formatCurrency,
  } = useReports({ pageSize: 10 });
  
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<GeneratedReport['type']>('collection_summary');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Handle report generation
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await generateReport(selectedReportType, selectedFormat);
      setShowGenerateModal(false);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString('en-UG', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Audit log columns
  const auditColumns: Array<{
    key: string;
    header: string;
    render: (log: AuditLogEntry, index: number) => React.ReactNode;
  }> = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (log: AuditLogEntry) => (
        <div className="text-sm">
          <p className="text-gray-900">{formatTimestamp(log.timestamp)}</p>
          <p className="text-xs text-gray-500">
            {log.timestamp.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLogEntry) => {
        const config = getActionConfig(log.action);
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              config.variant === 'success' ? 'bg-success-100 text-success-600' :
              config.variant === 'danger' ? 'bg-danger-100 text-danger-600' :
              config.variant === 'warning' ? 'bg-warning-100 text-warning-600' :
              config.variant === 'primary' ? 'bg-primary-100 text-primary-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              <span className="material-symbols-rounded text-sm">{config.icon}</span>
            </div>
            <span className="font-medium text-gray-900">{config.label}</span>
          </div>
        );
      },
    },
    {
      key: 'details',
      header: 'Details',
      render: (log: AuditLogEntry) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-1">{log.details}</p>
          {log.studentName && (
            <p className="text-xs text-gray-500">Student: {log.studentName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (log: AuditLogEntry) => (
        log.amount ? (
          <span className="font-medium text-gray-900">
            {formatCurrency(log.amount)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'actor',
      header: 'User',
      render: (log: AuditLogEntry) => (
        <div className="text-sm">
          <p className="text-gray-900">{log.actor}</p>
          <p className="text-xs text-gray-500">{log.actorRole}</p>
        </div>
      ),
    },
    {
      key: 'stellar',
      header: 'Blockchain',
      render: (log: AuditLogEntry) => <StellarStatusBadge status={log.stellarStatus} />,
    },
    {
      key: 'actions',
      header: '',
      render: (log: AuditLogEntry) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
        >
          <span className="material-symbols-rounded text-lg">visibility</span>
        </button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500 mt-1">Collection summaries, audit trails & blockchain verification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-rounded text-lg">refresh</span>
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-rounded text-lg">download</span>
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-rounded text-lg">description</span>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Collected"
          value={`UGX ${(stats.totalCollected / 1000000).toFixed(1)}M`}
          subtitle={`of ${(stats.totalExpected / 1000000).toFixed(1)}M expected`}
          icon="account_balance"
          variant="success"
          trend={{ value: stats.collectedVsLastMonth, label: 'vs last month' }}
        />
        <StatsCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          subtitle={`${stats.fullyPaidCount} fully paid students`}
          icon="percent"
          variant="primary"
        />
        <StatsCard
          title="Outstanding Balance"
          value={`UGX ${(stats.totalOutstanding / 1000000).toFixed(1)}M`}
          subtitle={`${stats.overdueCount} overdue accounts`}
          icon="warning"
          variant="warning"
        />
        <StatsCard
          title="Total Payments"
          value={stats.totalPayments.toLocaleString()}
          subtitle={`${stats.paymentsThisMonth} this month`}
          icon="receipt_long"
          trend={{ value: stats.studentsVsLastTerm, label: 'vs last term' }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Collection Trend */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Monthly Collection Trend</h3>
                  <p className="text-sm text-gray-500">Collection vs expected by month</p>
                </div>
                <select
                  value={filters.term}
                  onChange={(e) => setFilters({ term: e.target.value })}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                >
                  <option value="term1_2026">Term 1 2026</option>
                  <option value="term3_2025">Term 3 2025</option>
                  <option value="term2_2025">Term 2 2025</option>
                </select>
              </div>
            </div>
            <div className="p-4">
              <CollectionChart data={monthlyTrend} />
            </div>
          </Card>

          {/* Class Collection Breakdown */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Collection by Class</h3>
                  <p className="text-sm text-gray-500">Breakdown of collection rates per class</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-success-100 text-success-700 rounded">Paid</span>
                  <span className="px-2 py-1 bg-warning-100 text-warning-700 rounded">Partial</span>
                  <span className="px-2 py-1 bg-danger-100 text-danger-700 rounded">None</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ClassCollectionTable data={classCollection} />
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Payment Channel Breakdown */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Payment Channels</h3>
              <p className="text-sm text-gray-500">Breakdown by payment method</p>
            </div>
            <div className="p-4">
              <ChannelBreakdownChart data={channelBreakdown} />
            </div>
          </Card>

          {/* Stellar Blockchain Status */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-primary-600">token</span>
                <h3 className="font-semibold text-gray-900">Blockchain Audit</h3>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Network Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Network Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    stellarStats.networkStatus === 'connected' ? 'bg-success-500 animate-pulse' :
                    stellarStats.networkStatus === 'syncing' ? 'bg-warning-500 animate-pulse' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {stellarStats.networkStatus}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-success-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-success-600">{stellarStats.totalAnchored}</p>
                  <p className="text-xs text-success-700">Anchored</p>
                </div>
                <div className="p-3 bg-warning-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-warning-600">{stellarStats.pendingAnchor}</p>
                  <p className="text-xs text-warning-700">Pending</p>
                </div>
                <div className="p-3 bg-danger-50 rounded-lg text-center">
                  <p className="text-xl font-bold text-danger-600">{stellarStats.failedAnchor}</p>
                  <p className="text-xs text-danger-700">Failed</p>
                </div>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Sync</span>
                <span className="text-gray-900">
                  {formatTimestamp(stellarStats.lastSyncTime)}
                </span>
              </div>

              {/* Wallet */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Wallet Address</p>
                <p className="text-sm font-mono text-gray-700 truncate">{stellarStats.walletAddress}</p>
              </div>
            </div>
          </Card>

          {/* Quick Reports */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Quick Reports</h3>
            </div>
            <div className="p-4 space-y-3">
              <ReportGenerationCard
                title="Collection Summary"
                description="Overview of all collections this term"
                icon="summarize"
                onClick={() => {
                  setSelectedReportType('collection_summary');
                  setShowGenerateModal(true);
                }}
              />
              <ReportGenerationCard
                title="Bank Reconciliation"
                description="Match payments with bank records"
                icon="account_balance"
                onClick={() => {
                  setSelectedReportType('bank_reconciliation');
                  setShowGenerateModal(true);
                }}
              />
              <ReportGenerationCard
                title="Audit Certificate"
                description="Blockchain-verified audit trail"
                icon="verified_user"
                onClick={() => {
                  setSelectedReportType('audit_trail');
                  setShowGenerateModal(true);
                }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Audit Trail Section */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Audit Trail</h3>
              <p className="text-sm text-gray-500">Immutable record of all financial activities</p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-48 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                {DATE_RANGE_OPTIONS.map(option => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>

              {/* Action Filter */}
              <select
                value={filters.actionType}
                onChange={(e) => setFilters({ actionType: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                {ACTION_FILTERS.map(filter => (
                  <option key={filter.key} value={filter.key}>{filter.label}</option>
                ))}
              </select>

              {/* Clear Filters */}
              {(filters.search || filters.actionType !== 'all' || dateRange !== 'this_term') && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {ACTION_FILTERS.map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilters({ actionType: filter.key })}
                className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-1.5 transition-colors ${
                  filters.actionType === filter.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-rounded text-sm">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table
            data={paginatedLogs}
            columns={auditColumns}
            keyExtractor={(log) => log.id}
            emptyMessage="No audit logs found"
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, filteredLogs.length)} of {filteredLogs.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Reports</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentReports.slice(0, 5).map(report => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    report.format === 'pdf' ? 'bg-danger-100 text-danger-600' :
                    report.format === 'excel' ? 'bg-success-100 text-success-600' :
                    'bg-primary-100 text-primary-600'
                  }`}>
                    <span className="material-symbols-rounded">
                      {report.format === 'pdf' ? 'picture_as_pdf' :
                       report.format === 'excel' ? 'table_chart' : 'description'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{report.name}</p>
                    <p className="text-xs text-gray-500">
                      {report.generatedBy} • {formatTimestamp(report.generatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={report.status === 'ready' ? 'success' : report.status === 'generating' ? 'warning' : 'danger'}>
                    {report.status === 'ready' ? 'Ready' : report.status === 'generating' ? 'Generating...' : 'Failed'}
                  </Badge>
                  {report.status === 'ready' && (
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                      <span className="material-symbols-rounded">download</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Audit Logs"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Export {filteredLogs.length} audit log entries to your preferred format.
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => { exportAuditLogs('csv'); setShowExportModal(false); }}
              className="p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <span className="material-symbols-rounded text-2xl text-primary-600">table_chart</span>
              <p className="mt-2 font-medium">CSV</p>
              <p className="text-xs text-gray-500">Spreadsheet</p>
            </button>
            <button
              onClick={() => { exportAuditLogs('excel'); setShowExportModal(false); }}
              className="p-4 border border-gray-200 rounded-xl hover:border-success-300 hover:bg-success-50 transition-colors text-center"
            >
              <span className="material-symbols-rounded text-2xl text-success-600">grid_on</span>
              <p className="mt-2 font-medium">Excel</p>
              <p className="text-xs text-gray-500">Microsoft Excel</p>
            </button>
            <button
              onClick={() => { exportAuditLogs('pdf'); setShowExportModal(false); }}
              className="p-4 border border-gray-200 rounded-xl hover:border-danger-300 hover:bg-danger-50 transition-colors text-center"
            >
              <span className="material-symbols-rounded text-2xl text-danger-600">picture_as_pdf</span>
              <p className="mt-2 font-medium">PDF</p>
              <p className="text-xs text-gray-500">Print-ready</p>
            </button>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Report"
      >
        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="space-y-2">
              {[
                { type: 'collection_summary', label: 'Collection Summary', desc: 'Overview of all fee collections' },
                { type: 'audit_trail', label: 'Audit Trail Report', desc: 'Complete activity log with blockchain verification' },
                { type: 'class_report', label: 'Class Collection Report', desc: 'Breakdown by class/grade' },
                { type: 'bank_reconciliation', label: 'Bank Reconciliation', desc: 'Match payments with bank statements' },
                { type: 'student_ledger', label: 'Student Ledger', desc: 'Individual student payment histories' },
              ].map(option => (
                <label
                  key={option.type}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReportType === option.type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={option.type}
                    checked={selectedReportType === option.type}
                    onChange={(e) => setSelectedReportType(e.target.value as GeneratedReport['type'])}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                  {selectedReportType === option.type && (
                    <span className="material-symbols-rounded text-primary-600">check_circle</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex gap-3">
              {[
                { format: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
                { format: 'excel', label: 'Excel', icon: 'grid_on' },
                { format: 'csv', label: 'CSV', icon: 'table_chart' },
              ].map(option => (
                <button
                  key={option.format}
                  onClick={() => setSelectedFormat(option.format as 'pdf' | 'excel' | 'csv')}
                  className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                    selectedFormat === option.format
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="material-symbols-rounded text-xl">{option.icon}</span>
                  <p className="text-sm font-medium mt-1">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">description</span>
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Audit Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Action Badge */}
            <div className="flex items-center gap-3">
              {(() => {
                const config = getActionConfig(selectedLog.action);
                return (
                  <div className={`p-2 rounded-lg ${
                    config.variant === 'success' ? 'bg-success-100 text-success-600' :
                    config.variant === 'danger' ? 'bg-danger-100 text-danger-600' :
                    config.variant === 'warning' ? 'bg-warning-100 text-warning-600' :
                    config.variant === 'primary' ? 'bg-primary-100 text-primary-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="material-symbols-rounded">{config.icon}</span>
                  </div>
                );
              })()}
              <div>
                <p className="font-semibold text-gray-900">{getActionConfig(selectedLog.action).label}</p>
                <p className="text-sm text-gray-500">
                  {selectedLog.timestamp.toLocaleString('en-UG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900">{selectedLog.details}</p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Performed by</p>
                <p className="font-medium text-gray-900">{selectedLog.actor}</p>
                <p className="text-xs text-gray-500">{selectedLog.actorRole}</p>
              </div>
              {selectedLog.studentName && (
                <div>
                  <p className="text-gray-500">Student</p>
                  <p className="font-medium text-gray-900">{selectedLog.studentName}</p>
                  <p className="text-xs text-gray-500">{selectedLog.studentId}</p>
                </div>
              )}
              {selectedLog.amount && (
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedLog.amount)}</p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-gray-500">IP Address</p>
                  <p className="font-medium text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}
            </div>

            {/* Stellar Info */}
            {selectedLog.stellarStatus && (
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded text-primary-600">token</span>
                  <span className="font-medium text-primary-900">Blockchain Verification</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-700">Status</span>
                    <StellarStatusBadge status={selectedLog.stellarStatus} />
                  </div>
                  {selectedLog.stellarTxHash && (
                    <div>
                      <p className="text-primary-700 mb-1">Transaction Hash</p>
                      <p className="font-mono text-xs text-primary-800 break-all bg-white p-2 rounded">
                        {selectedLog.stellarTxHash}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
              {selectedLog.stellarTxHash && (
                <Button variant="primary" onClick={() => window.open(`https://stellar.expert/explorer/public/tx/${selectedLog.stellarTxHash}`, '_blank')}>
                  <span className="material-symbols-rounded mr-2">open_in_new</span>
                  View on Stellar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Footer */}
      <div className="text-center text-sm text-gray-400 pb-4">
        All financial records are immutably anchored to the Stellar blockchain for audit compliance.
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { FilterChip } from '@/components/ui/Chip';
import { formatUGX, formatDate, formatCompact } from '@/lib/utils';

// Mock audit log data
const mockAuditLogs = [
  {
    id: '1',
    timestamp: new Date('2024-09-15T14:32:00'),
    action: 'payment_recorded',
    actor: 'Jane Nakamya',
    studentId: 'EDU-2023-045-KC',
    studentName: 'Mugisha Ivan Brian',
    amount: 450000,
    stellarTxId: 'abc123def456...xyz789',
    stellarStatus: 'anchored',
    details: 'MTN MoMo payment recorded',
  },
  {
    id: '2',
    timestamp: new Date('2024-09-15T12:15:00'),
    action: 'student_enrolled',
    actor: 'Peter Kato',
    studentId: 'EDU-2024-112-MW',
    studentName: 'Apio Grace Mary',
    amount: null,
    stellarTxId: null,
    stellarStatus: null,
    details: 'New student enrolled to S1 East',
  },
  {
    id: '3',
    timestamp: new Date('2024-09-15T10:45:00'),
    action: 'payment_reversed',
    actor: 'Admin System',
    studentId: 'EDU-2022-089-JK',
    studentName: 'Okello David',
    amount: 100000,
    stellarTxId: 'rev123abc456...def789',
    stellarStatus: 'anchored',
    details: 'Duplicate payment reversal',
  },
  {
    id: '4',
    timestamp: new Date('2024-09-14T16:20:00'),
    action: 'fee_updated',
    actor: 'Sarah Nambi',
    studentId: null,
    studentName: null,
    amount: null,
    stellarTxId: null,
    stellarStatus: null,
    details: 'Term 2 fees updated for Senior classes',
  },
  {
    id: '5',
    timestamp: new Date('2024-09-14T09:30:00'),
    action: 'payment_recorded',
    actor: 'Jane Nakamya',
    studentId: 'EDU-2023-067-AB',
    studentName: 'Namukasa Faith',
    amount: 350000,
    stellarTxId: 'pay789xyz123...abc456',
    stellarStatus: 'pending',
    details: 'Bank transfer payment',
  },
];

const mockReportStats = {
  totalCollected: 45670000,
  totalExpected: 78500000,
  collectionRate: 58,
  totalStudents: 486,
  fullyPaid: 124,
  partialPaid: 298,
  unpaid: 64,
  averagePayment: 285000,
};

const actionFilters = [
  { label: 'All Actions', value: 'all' },
  { label: 'Payments', value: 'payment_recorded' },
  { label: 'Reversals', value: 'payment_reversed' },
  { label: 'Enrollments', value: 'student_enrolled' },
  { label: 'Fee Changes', value: 'fee_updated' },
];

export default function ReportsPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this_term');

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'payment_recorded':
        return { variant: 'success' as const, icon: 'add_card', label: 'Payment' };
      case 'payment_reversed':
        return { variant: 'danger' as const, icon: 'undo', label: 'Reversal' };
      case 'student_enrolled':
        return { variant: 'info' as const, icon: 'person_add', label: 'Enrollment' };
      case 'fee_updated':
        return { variant: 'warning' as const, icon: 'edit', label: 'Fee Update' };
      default:
        return { variant: 'secondary' as const, icon: 'info', label: action };
    }
  };

  const auditColumns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: typeof mockAuditLogs[0]) => (
        <div>
          <p className="text-sm font-medium">{formatDate(log.timestamp)}</p>
          <p className="text-[10px] text-slate-400">
            {log.timestamp.toLocaleTimeString('en-UG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: typeof mockAuditLogs[0]) => {
        const badge = getActionBadge(log.action);
        return (
          <Badge variant={badge.variant} className="text-[10px] uppercase">
            <span className="material-symbols-outlined text-xs mr-1">{badge.icon}</span>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: 'details',
      header: 'Details',
      render: (log: typeof mockAuditLogs[0]) => (
        <div>
          <p className="text-sm font-medium">{log.details}</p>
          {log.studentName && (
            <p className="text-xs text-slate-400">
              Student: {log.studentName} ({log.studentId})
            </p>
          )}
          {log.amount && (
            <p className="text-xs font-semibold text-success">{formatUGX(log.amount)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Performed By',
      render: (log: typeof mockAuditLogs[0]) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {log.actor.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <span className="text-sm">{log.actor}</span>
        </div>
      ),
    },
    {
      key: 'stellar',
      header: 'Blockchain Audit',
      render: (log: typeof mockAuditLogs[0]) =>
        log.stellarTxId ? (
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                log.stellarStatus === 'anchored' ? 'bg-success' : 'bg-warning animate-pulse'
              }`}
            />
            <div>
              <p className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                {log.stellarTxId}
              </p>
              <p
                className={`text-[10px] uppercase font-bold ${
                  log.stellarStatus === 'anchored' ? 'text-success' : 'text-warning'
                }`}
              >
                {log.stellarStatus}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">N/A</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (log: typeof mockAuditLogs[0]) => (
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <span className="material-symbols-outlined text-sm text-slate-400">visibility</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <nav className="flex text-sm text-slate-500 mb-2">
            <Link href="/dashboard" className="hover:text-primary dark:hover:text-white">
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span className="text-primary dark:text-white font-medium">
              Financial Reports & Audit Trail
            </span>
          </nav>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">summarize</span>
            </span>
            Financial Reports & Audit Trail
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<span className="material-symbols-outlined text-sm">download</span>}
          >
            Export Report
          </Button>
          <Button
            variant="primary"
            icon={<span className="material-symbols-outlined text-sm">print</span>}
          >
            Print Statement
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Total Collected"
          value={formatCompact(mockReportStats.totalCollected)}
          trend={{ value: 12, isPositive: true }}
          icon={<span className="material-symbols-outlined text-success">trending_up</span>}
          iconBg="bg-success/10"
        />
        <StatsCard
          label="Collection Rate"
          value={`${mockReportStats.collectionRate}%`}
          icon={<span className="material-symbols-outlined text-primary">percent</span>}
          iconBg="bg-primary/10"
        />
        <StatsCard
          label="Students Fully Paid"
          value={mockReportStats.fullyPaid.toString()}
          subtitle={`of ${mockReportStats.totalStudents} total`}
          icon={<span className="material-symbols-outlined text-emerald-soft">check_circle</span>}
          iconBg="bg-emerald-soft/10"
        />
        <StatsCard
          label="Average Payment"
          value={formatCompact(mockReportStats.averagePayment)}
          icon={<span className="material-symbols-outlined text-warning">payments</span>}
          iconBg="bg-warning/10"
        />
      </div>

      {/* Collection Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Collection Overview */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold">Collection Overview</h3>
              <p className="text-sm text-slate-500">Term 2, 2024</p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
            >
              <option value="this_term">This Term</option>
              <option value="this_month">This Month</option>
              <option value="this_week">This Week</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-success/5 rounded-xl">
              <p className="text-3xl font-bold text-success">
                {mockReportStats.fullyPaid}
              </p>
              <p className="text-xs text-slate-500 mt-1">Fully Paid</p>
            </div>
            <div className="text-center p-4 bg-warning/5 rounded-xl">
              <p className="text-3xl font-bold text-warning">
                {mockReportStats.partialPaid}
              </p>
              <p className="text-xs text-slate-500 mt-1">Partial Payment</p>
            </div>
            <div className="text-center p-4 bg-danger/5 rounded-xl">
              <p className="text-3xl font-bold text-danger">{mockReportStats.unpaid}</p>
              <p className="text-xs text-slate-500 mt-1">No Payment</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Total Expected</span>
                <span className="font-bold">{formatUGX(mockReportStats.totalExpected)}</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-success to-emerald-soft rounded-full"
                  style={{ width: `${mockReportStats.collectionRate}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Collected</span>
              <span className="font-bold text-success">
                {formatUGX(mockReportStats.totalCollected)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Outstanding Balance</span>
              <span className="font-bold text-warning">
                {formatUGX(mockReportStats.totalExpected - mockReportStats.totalCollected)}
              </span>
            </div>
          </div>
        </Card>

        {/* Blockchain Audit Status */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <div>
              <h3 className="font-bold">Stellar Blockchain</h3>
              <p className="text-sm text-white/70">Audit Trail Status</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Network</span>
              <Badge variant="success" className="text-[10px]">Connected</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Transactions Anchored</span>
              <span className="font-bold">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Pending Anchoring</span>
              <span className="font-bold text-yellow-300">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/70">Last Sync</span>
              <span className="text-sm">2 min ago</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              View on Stellar Explorer
            </button>
          </div>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card padding="none">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-primary dark:text-white">
                Complete Audit Trail
              </h3>
              <p className="text-sm text-slate-500">
                Immutable record of all financial actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search audit logs..."
                  className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-full md:w-64"
                />
              </div>
              <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined text-slate-600 text-sm">
                  calendar_today
                </span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {actionFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                selected={selectedFilter === filter.value}
                onClick={() => setSelectedFilter(filter.value)}
              />
            ))}
          </div>
        </div>

        <Table columns={auditColumns} data={mockAuditLogs} keyExtractor={(log) => log.id} />

        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {mockAuditLogs.length} of 1,247 audit entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-sm opacity-50 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-sm hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Report Generation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-2xl text-primary">
                description
              </span>
            </div>
            <div>
              <h4 className="font-bold">Collection Summary</h4>
              <p className="text-sm text-slate-500">PDF/Excel export</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-warning/10 rounded-xl group-hover:bg-warning/20 transition-colors">
              <span className="material-symbols-outlined text-2xl text-warning">
                account_balance
              </span>
            </div>
            <div>
              <h4 className="font-bold">Bank Reconciliation</h4>
              <p className="text-sm text-slate-500">Match bank statements</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
              <span className="material-symbols-outlined text-2xl text-success">
                verified
              </span>
            </div>
            <div>
              <h4 className="font-bold">Audit Certificate</h4>
              <p className="text-sm text-slate-500">Blockchain verified</p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Status Bar */}
      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            Audit System Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            Stellar Testnet Connected
          </span>
        </div>
        <p>© 2024 EduPay Ledger Uganda. Built for Security & Trust.</p>
      </footer>
    </div>
  );
}

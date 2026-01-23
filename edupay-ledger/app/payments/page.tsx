'use client';

import React from 'react';
import Link from 'next/link';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { formatUGX, formatDate } from '@/lib/utils';

const mockRecentPayments = [
  {
    id: '1',
    date: new Date('2024-09-15T14:45:00'),
    studentName: 'Mugisha Ivan Brian',
    studentId: 'EDU-2023-045-KC',
    amount: 450000,
    channel: 'MTN MoMo',
    status: 'cleared',
    recordedBy: 'Jane Nakamya',
  },
  {
    id: '2',
    date: new Date('2024-09-15T12:30:00'),
    studentName: 'Namukasa Faith',
    studentId: 'EDU-2023-067-AB',
    amount: 350000,
    channel: 'Bank Transfer',
    status: 'cleared',
    recordedBy: 'Peter Kato',
  },
  {
    id: '3',
    date: new Date('2024-09-15T10:15:00'),
    studentName: 'Okello David',
    studentId: 'EDU-2022-089-JK',
    amount: 200000,
    channel: 'Cash',
    status: 'pending',
    recordedBy: 'Jane Nakamya',
  },
  {
    id: '4',
    date: new Date('2024-09-14T16:20:00'),
    studentName: 'Apio Grace',
    studentId: 'EDU-2023-112-MW',
    amount: 500000,
    channel: 'Airtel Money',
    status: 'cleared',
    recordedBy: 'Sarah Nambi',
  },
];

const paymentColumns = [
  {
    key: 'date',
    header: 'Date & Time',
    render: (payment: typeof mockRecentPayments[0]) => (
      <div>
        <p className="font-medium">{formatDate(payment.date)}</p>
        <p className="text-[10px] text-slate-400">
          {payment.date.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    ),
  },
  {
    key: 'student',
    header: 'Student',
    render: (payment: typeof mockRecentPayments[0]) => (
      <div>
        <p className="font-semibold text-primary dark:text-white">{payment.studentName}</p>
        <p className="text-xs text-slate-400">{payment.studentId}</p>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (payment: typeof mockRecentPayments[0]) => (
      <span className="font-bold text-success">{formatUGX(payment.amount)}</span>
    ),
  },
  {
    key: 'channel',
    header: 'Channel',
    render: (payment: typeof mockRecentPayments[0]) => (
      <Badge variant="secondary" className="text-[10px]">
        {payment.channel}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (payment: typeof mockRecentPayments[0]) => (
      <Badge
        variant={payment.status === 'cleared' ? 'success' : 'warning'}
        className="text-[10px] uppercase"
      >
        {payment.status}
      </Badge>
    ),
  },
  {
    key: 'recordedBy',
    header: 'Recorded By',
    render: (payment: typeof mockRecentPayments[0]) => (
      <span className="text-sm text-slate-500">{payment.recordedBy}</span>
    ),
  },
];

export default function PaymentsPage() {
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
            <span className="text-primary dark:text-white font-medium">Payments</span>
          </nav>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="p-2 bg-success/10 rounded-lg">
              <span className="material-symbols-outlined text-success">payments</span>
            </span>
            Payment Management
          </h1>
        </div>
        <Link href="/payments/record">
          <Button
            variant="primary"
            icon={<span className="material-symbols-outlined text-sm">add_card</span>}
          >
            Record New Payment
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Today's Collection"
          value={formatUGX(1500000)}
          trend={{ value: 8, isPositive: true }}
          icon={<span className="material-symbols-outlined text-success">trending_up</span>}
          iconBg="bg-success/10"
        />
        <StatsCard
          label="Payments Today"
          value="12"
          icon={<span className="material-symbols-outlined text-primary">receipt_long</span>}
          iconBg="bg-primary/10"
        />
        <StatsCard
          label="Pending Verification"
          value="3"
          icon={<span className="material-symbols-outlined text-warning">pending</span>}
          iconBg="bg-warning/10"
        />
        <StatsCard
          label="This Week"
          value={formatUGX(8500000)}
          icon={<span className="material-symbols-outlined text-emerald-soft">calendar_month</span>}
          iconBg="bg-emerald-soft/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/payments/record">
          <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                <span className="material-symbols-outlined text-2xl text-success">add_card</span>
              </div>
              <div>
                <h4 className="font-bold">Record Payment</h4>
                <p className="text-sm text-slate-500">Capture new fee payment</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/payments/rules">
          <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-2xl text-primary">tune</span>
              </div>
              <div>
                <h4 className="font-bold">Installment Rules</h4>
                <p className="text-sm text-slate-500">Configure payment plans</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-warning/10 rounded-xl group-hover:bg-warning/20 transition-colors">
                <span className="material-symbols-outlined text-2xl text-warning">summarize</span>
              </div>
              <div>
                <h4 className="font-bold">View Reports</h4>
                <p className="text-sm text-slate-500">Financial summaries</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Payments Table */}
      <Card padding="none">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-primary dark:text-white">Recent Payments</h3>
            <p className="text-sm text-slate-500">Latest payment transactions</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-full md:w-64"
                placeholder="Search payments..."
                type="text"
              />
            </div>
            <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100">
              <span className="material-symbols-outlined text-slate-600 text-sm">filter_list</span>
            </button>
          </div>
        </div>
        <Table
          columns={paymentColumns}
          data={mockRecentPayments}
          keyExtractor={(p) => p.id}
        />
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {mockRecentPayments.length} recent payments</span>
          <Link href="/reports" className="text-primary hover:underline font-medium">
            View All Transactions →
          </Link>
        </div>
      </Card>

      {/* System Status Bar */}
      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            Payment Gateway Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            MoMo Integration Online
          </span>
        </div>
        <p>© 2024 EduPay Ledger Uganda. Built for Security & Trust.</p>
      </footer>
    </div>
  );
}

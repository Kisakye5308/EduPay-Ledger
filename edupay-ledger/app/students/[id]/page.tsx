'use client';

import React from 'react';
import Link from 'next/link';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Progress';
import { Table } from '@/components/ui/Table';
import { formatUGX, formatDate, formatPhone } from '@/lib/utils';

// Mock student data
const mockStudent = {
  id: 'EDU-2023-045-KC',
  firstName: 'Mugisha',
  middleName: 'Ivan',
  lastName: 'Brian',
  photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0CnWYOn8jgUsEOhUTX7qeTe9V1C0bEWnzP9LGgDmV9isuZqckxogBtA06czEVBCXtb4FHQFSCIxjsRJ0oDLM_1gbq8L72FBxdMZJqnY12IBgQxEk9qy6mT1EynTF8w-DYpnctJon298ne5QMe1UEuPIlOdD__r6bx71PWNeAV5rbJVe1wPGSTAvxKyJXhlGqJMCEHpuszOMeLCAPlz72rPiGcga82FNaeEkaZKXbI5V_VTuG1pxGB_Jq3ZRhiP1ppeLE77VQct5s',
  className: 'Senior 4',
  streamName: 'East Wing',
  term: 2,
  year: 2024,
  status: 'active',
  guardian: {
    name: 'Mrs. Sarah Namugisha',
    phone: '+256772456789',
  },
  totalFees: 1450000,
  amountPaid: 850000,
  balance: 600000,
  paymentProgress: 58,
  deadline: '15 Oct 2024',
};

const mockTransactions = [
  {
    id: '1',
    date: new Date('2024-09-12T14:45:00'),
    refId: 'TX-8829-MO',
    channel: 'momo_mtn',
    channelName: 'MTN MoMo',
    amount: 450000,
    status: 'cleared',
  },
  {
    id: '2',
    date: new Date('2024-08-05T10:15:00'),
    refId: 'BNK-3341-ST',
    channel: 'bank',
    channelName: 'Stanbic Bank',
    amount: 400000,
    status: 'cleared',
  },
  {
    id: '3',
    date: new Date('2024-07-20T16:30:00'),
    refId: 'CSH-1022-DR',
    channel: 'cash',
    channelName: 'Direct Cash',
    amount: 100000,
    status: 'reversed',
  },
];

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'momo_mtn':
      case 'momo_airtel':
        return { icon: 'smartphone', bg: 'bg-yellow-400/10', color: 'text-yellow-600' };
      case 'bank':
        return { icon: 'account_balance', bg: 'bg-blue-100', color: 'text-blue-700' };
      case 'cash':
      default:
        return { icon: 'payments', bg: 'bg-slate-100', color: 'text-slate-600' };
    }
  };

  const transactionColumns = [
    {
      key: 'date',
      header: 'Transaction Date',
      render: (tx: typeof mockTransactions[0]) => (
        <div>
          <p className="text-sm font-semibold">{formatDate(tx.date)}</p>
          <p className="text-[10px] text-slate-400">
            {tx.date.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'refId',
      header: 'Ref ID',
      render: (tx: typeof mockTransactions[0]) => (
        <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {tx.refId}
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Payment Channel',
      render: (tx: typeof mockTransactions[0]) => {
        const channelStyle = getChannelIcon(tx.channel);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded ${channelStyle.bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-sm ${channelStyle.color}`}>
                {channelStyle.icon}
              </span>
            </div>
            <span className="text-sm font-medium">{tx.channelName}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: typeof mockTransactions[0]) => (
        <span className={`font-bold ${tx.status === 'reversed' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {formatUGX(tx.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx: typeof mockTransactions[0]) => (
        <Badge
          variant={tx.status === 'cleared' ? 'success' : 'danger'}
          className="uppercase text-[10px]"
        >
          {tx.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right' as const,
      render: (tx: typeof mockTransactions[0]) => (
        <button className={`${tx.status === 'cleared' ? 'text-primary dark:text-blue-400' : 'text-slate-400'} hover:bg-primary/5 p-1.5 rounded-lg`}>
          <span className="material-symbols-outlined text-sm">
            {tx.status === 'cleared' ? 'print' : 'info_outline'}
          </span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
      {/* Breadcrumbs & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <nav className="flex text-sm text-slate-500 mb-2">
            <Link href="/students" className="hover:text-primary dark:hover:text-white">
              Directory
            </Link>
            <span className="mx-2">/</span>
            <span className="text-primary dark:text-white font-medium">Student Profile</span>
          </nav>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Financial Record Detail
            <Badge variant="success" className="text-[10px] uppercase">Active</Badge>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<span className="material-symbols-outlined text-sm">sms</span>}
          >
            Send Receipt SMS
          </Button>
          <Link href={`/payments/record?studentId=${params.id}`}>
            <Button
              variant="primary"
              icon={<span className="material-symbols-outlined text-sm">add_card</span>}
            >
              Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Student Profile Card */}
      <Card className="mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-shrink-0">
            <img
              src={mockStudent.photo}
              alt="Student Photo"
              className="w-24 h-24 rounded-xl object-cover ring-4 ring-slate-50 dark:ring-slate-800 shadow-sm"
            />
          </div>
          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Student Name
              </p>
              <h2 className="text-xl font-bold text-primary dark:text-white">
                {mockStudent.firstName} {mockStudent.middleName} {mockStudent.lastName}
              </h2>
              <p className="text-sm text-slate-500 mt-1">ID: {mockStudent.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Academic Info
              </p>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {mockStudent.className} • {mockStudent.streamName}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Term {mockStudent.term}, {mockStudent.year}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                Guardian Contact
              </p>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {mockStudent.guardian.name}
              </p>
              <p className="text-sm text-primary dark:text-blue-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">phone</span>
                {formatPhone(mockStudent.guardian.phone)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Fees */}
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined text-primary dark:text-blue-400">
                receipt_long
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Total Invoiced
            </span>
          </div>
          <p className="text-sm text-slate-500">Term Total Fees</p>
          <h3 className="text-2xl font-bold mt-1">{formatUGX(mockStudent.totalFees)}</h3>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            Includes Tuition, Lab, & Uniform fees
          </div>
        </Card>

        {/* Amount Paid */}
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <span className="material-symbols-outlined text-success">check_circle</span>
            </div>
            <span className="text-[10px] font-bold text-success uppercase tracking-tighter">
              Verified Payments
            </span>
          </div>
          <p className="text-sm text-slate-500">Amount Paid to Date</p>
          <h3 className="text-2xl font-bold mt-1 text-success">
            {formatUGX(mockStudent.amountPaid)}
          </h3>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span>Progress ({mockStudent.paymentProgress}%)</span>
              <span className="text-success">{formatUGX(mockStudent.balance)} to go</span>
            </div>
            <ProgressBar value={mockStudent.paymentProgress} color="success" size="sm" />
          </div>
        </Card>

        {/* Balance */}
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-warning/10 rounded-lg">
              <span className="material-symbols-outlined text-warning">pending_actions</span>
            </div>
            <span className="text-[10px] font-bold text-warning uppercase tracking-tighter">
              Outstanding Balance
            </span>
          </div>
          <p className="text-sm text-slate-500">Amount Remaining</p>
          <h3 className="text-2xl font-bold mt-1 text-warning">
            {formatUGX(mockStudent.balance)}
          </h3>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 italic">
              Deadline: {mockStudent.deadline}
            </span>
            <span className="material-symbols-outlined text-warning text-sm">info</span>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card padding="none">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-primary dark:text-white">Transaction Logs</h3>
          <div className="flex gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-full md:w-64"
                placeholder="Search logs..."
                type="text"
              />
            </div>
            <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100">
              <span className="material-symbols-outlined text-slate-600 text-sm">filter_list</span>
            </button>
          </div>
        </div>
        <Table
          columns={transactionColumns}
          data={mockTransactions}
          keyExtractor={(tx) => tx.id}
        />
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {mockTransactions.length} transactions</span>
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

      {/* System Status Bar */}
      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            Bank Gateway Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            SMS Gateway Online
          </span>
        </div>
        <p>© 2024 EduPay Ledger Uganda. Built for Security & Trust.</p>
      </footer>
    </div>
  );
}

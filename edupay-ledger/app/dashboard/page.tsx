'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardTitle, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CollectionProgress, InstallmentProgress } from '@/components/ui/Progress';
import { formatRelativeTime } from '@/lib/utils';

// Mock data - In production, this would come from Firebase
const mockDashboardData = {
  totalCollected: 450500000,
  collectionTarget: 600000000,
  outstanding: 149500000,
  overdue30Days: 42100000,
  percentageChange: '+12%',
  collectionProgress: 75.1,
};

const mockHeatmapData = [
  { class: 'P.1', streams: [
    { name: 'A', value: 500000, level: 'low' },
    { name: 'B', value: 2100000, level: 'med' },
    { name: 'C', value: 800000, level: 'low' },
    { name: 'D', value: 200000, level: 'low' },
  ]},
  { class: 'P.2', streams: [
    { name: 'A', value: 8400000, level: 'high' },
    { name: 'B', value: 1200000, level: 'low' },
    { name: 'C', value: 3500000, level: 'med' },
    { name: 'D', value: 900000, level: 'low' },
  ]},
  { class: 'P.3', streams: [
    { name: 'A', value: 1100000, level: 'low' },
    { name: 'B', value: 400000, level: 'low' },
    { name: 'C', value: 12200000, level: 'high' },
    { name: 'D', value: 4800000, level: 'med' },
  ]},
  { class: 'P.4', streams: [
    { name: 'A', value: 2500000, level: 'med' },
    { name: 'B', value: 3000000, level: 'med' },
    { name: 'C', value: 700000, level: 'low' },
    { name: 'D', value: 1500000, level: 'low' },
  ]},
];

const mockRecentActivity = [
  {
    type: 'payment',
    title: 'Payment: Peter Mukasa (P.4)',
    description: 'UGX 1,200,000 received via MTN MoMo',
    time: new Date(Date.now() - 2 * 60000), // 2 minutes ago
    icon: 'check',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600',
  },
  {
    type: 'registration',
    title: 'New Student Registered',
    description: 'Jane Namugenyi joined Primary 1 - Stream B',
    time: new Date(Date.now() - 45 * 60000), // 45 minutes ago
    icon: 'person',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
  },
  {
    type: 'payment',
    title: 'Payment: Kevin Okello (P.7)',
    description: 'UGX 850,000 received via Bank Transfer',
    time: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    icon: 'check',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600',
  },
  {
    type: 'alert',
    title: 'Arrears Alert: Primary 2',
    description: 'Stream A has exceeded the 20% arrears threshold',
    time: new Date(Date.now() - 3 * 3600000), // 3 hours ago
    icon: 'priority_high',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600',
  },
];

const mockInstallmentStats = [
  { name: 'Fully Paid (100%)', value: 420, color: 'success' as const },
  { name: 'Installment 2 (75%)', value: 280, color: 'primary' as const },
  { name: 'Installment 1 (50%)', value: 150, color: 'warning' as const },
  { name: 'No Payment (0%)', value: 92, color: 'danger' as const },
];

export default function DashboardPage() {
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return amount.toLocaleString();
  };

  const getHeatmapClass = (level: string) => {
    switch (level) {
      case 'high':
        return 'heatmap-cell-high text-red-800';
      case 'med':
        return 'heatmap-cell-med text-amber-800';
      case 'low':
      default:
        return 'heatmap-cell-low text-emerald-800';
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
      {/* Page Heading */}
      <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-primary dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time fee collection status for St. Mary's School.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<span className="material-symbols-outlined text-lg">download</span>}
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* KPI Section */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Main Collection Progress Card */}
          <Card>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-6 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  Total Collection Target
                </p>
                <p className="text-3xl lg:text-4xl font-bold text-primary dark:text-white mt-1">
                  UGX {formatAmount(mockDashboardData.totalCollected)}{' '}
                  <span className="text-lg font-normal text-slate-400">
                    / {formatAmount(mockDashboardData.collectionTarget)}
                  </span>
                </p>
              </div>
              <div className="text-left lg:text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-soft/10 text-emerald-soft text-sm font-bold">
                  {mockDashboardData.percentageChange} vs last term
                </span>
              </div>
            </div>
            <CollectionProgress
              collected={mockDashboardData.totalCollected}
              target={mockDashboardData.collectionTarget}
              outstanding={mockDashboardData.outstanding}
              overdue={mockDashboardData.overdue30Days}
            />
          </Card>

          {/* Class Arrears Heatmap */}
          <Card>
            <CardTitle>Class/Stream Arrears Heatmap</CardTitle>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase tracking-widest">
                    <th className="py-2 pr-4">Class</th>
                    <th className="py-2 px-2 text-center">Stream A</th>
                    <th className="py-2 px-2 text-center">Stream B</th>
                    <th className="py-2 px-2 text-center">Stream C</th>
                    <th className="py-2 px-2 text-center">Stream D</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {mockHeatmapData.map((row) => (
                    <tr key={row.class} className="border-t border-slate-50 dark:border-slate-800">
                      <td className="py-3 font-semibold">{row.class}</td>
                      {row.streams.map((stream) => (
                        <td key={stream.name} className="p-1">
                          <div className={`h-10 rounded flex items-center justify-center font-bold ${getHeatmapClass(stream.level)}`}>
                            {formatAmount(stream.value)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Section */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardTitle>Quick Actions</CardTitle>
            <div className="grid grid-cols-1 gap-3 mt-4">
              <Link href="/payments/record">
                <Button
                  variant="primary"
                  fullWidth
                  className="justify-between group"
                  icon={<span className="material-symbols-outlined text-white/50 group-hover:translate-x-1 transition-transform">chevron_right</span>}
                  iconPosition="right"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined bg-white/20 p-2 rounded-md">payments</span>
                    <span>Record Payment</span>
                  </div>
                </Button>
              </Link>
              <Link href="/students/add">
                <Button
                  variant="secondary"
                  fullWidth
                  className="justify-between group"
                  icon={<span className="material-symbols-outlined text-white/50 group-hover:translate-x-1 transition-transform">chevron_right</span>}
                  iconPosition="right"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined bg-white/20 p-2 rounded-md">person_add</span>
                    <span>Add Student</span>
                  </div>
                </Button>
              </Link>
              <Button
                variant="outline"
                fullWidth
                className="justify-between group"
                icon={<span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>}
                iconPosition="right"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined bg-slate-300 dark:bg-slate-600 p-2 rounded-md">print</span>
                  <span>Generate Receipts</span>
                </div>
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="flex flex-col h-[400px]">
            <CardTitle>Recent Activity</CardTitle>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2 mt-4">
              {mockRecentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-start border-b border-slate-50 dark:border-slate-800 pb-3 last:border-b-0"
                >
                  <div className={`size-8 ${activity.iconBg} ${activity.iconColor} rounded-full flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-sm">{activity.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500">{activity.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">
                      {formatRelativeTime(activity.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm font-semibold text-primary dark:text-blue-400 hover:underline">
              View All Activity
            </button>
          </Card>
        </div>

        {/* Installment Stats (Bottom Full Width) */}
        <div className="col-span-12">
          <Card>
            <CardTitle className="mb-6">Installment Completion Breakdown</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <InstallmentProgress
                installments={mockInstallmentStats}
                total={mockInstallmentStats.reduce((acc, s) => acc + s.value, 0)}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

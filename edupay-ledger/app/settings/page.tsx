'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const settingsItems = [
  {
    title: 'School Setup',
    description: 'Configure school information, classes, and streams',
    icon: 'school',
    href: '/settings/onboarding',
    badge: null,
  },
  {
    title: 'User Management',
    description: 'Manage admin users and their permissions',
    icon: 'group',
    href: '/settings/users',
    badge: null,
  },
  {
    title: 'Fee Templates',
    description: 'Configure fee structures for different classes',
    icon: 'payments',
    href: '/settings/fees',
    badge: null,
  },
  {
    title: 'SMS Configuration',
    description: 'Set up SMS gateway and message templates',
    icon: 'sms',
    href: '/settings/sms',
    badge: 'Gateway Connected',
  },
  {
    title: 'Integrations',
    description: 'Connect payment gateways and external services',
    icon: 'hub',
    href: '/settings/integrations',
    badge: null,
  },
  {
    title: 'Stellar Blockchain',
    description: 'Audit ledger configuration and status',
    icon: 'shield',
    href: '/settings/stellar',
    badge: 'Testnet',
  },
  {
    title: 'Backup & Export',
    description: 'Data backup and export options',
    icon: 'cloud_download',
    href: '/settings/backup',
    badge: null,
  },
  {
    title: 'System Logs',
    description: 'View system activity and error logs',
    icon: 'description',
    href: '/settings/logs',
    badge: null,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-4 lg:p-8 bg-background-light dark:bg-background-dark min-h-full">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex text-sm text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-primary dark:hover:text-white">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-primary dark:text-white font-medium">Settings</span>
        </nav>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="p-2 bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary">settings</span>
          </span>
          System Settings
        </h1>
        <p className="text-slate-500 mt-2">
          Configure your school's EduPay Ledger system
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsItems.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400 group-hover:text-primary">
                    {item.icon}
                  </span>
                </div>
                {item.badge && (
                  <Badge variant="success" className="text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-primary dark:text-white mb-1 group-hover:text-primary">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* System Info */}
      <Card className="mt-8 bg-gradient-to-r from-primary/5 to-emerald-soft/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-1">EduPay Ledger System</h3>
            <p className="text-sm text-slate-500">
              Version 1.0.0 • Last updated: September 2024
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              All Systems Operational
            </span>
          </div>
        </div>
      </Card>

      {/* System Status Bar */}
      <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            Firebase Connected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            Stellar Testnet Active
          </span>
        </div>
        <p>© 2024 EduPay Ledger Uganda. Built for Security & Trust.</p>
      </footer>
    </div>
  );
}

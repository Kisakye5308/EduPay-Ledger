/**
 * Payment Promise Components
 * UI components for tracking and managing payment promises
 */

'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  PromiseWithStatus,
  PromiseSummary,
  PromiseFollowUp,
  PromiseStatus,
  PromisePriority,
  getPromiseStatusLabel,
  getPromiseStatusColor,
  getPriorityLabel,
  CreatePromiseRequest,
} from '../../types/payment-promise';

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface PromiseStatusBadgeProps {
  status: PromiseStatus;
  size?: 'sm' | 'md';
}

export function PromiseStatusBadge({ status, size = 'md' }: PromiseStatusBadgeProps) {
  const colorMap: Record<PromiseStatus, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
    pending: 'primary',
    due: 'warning',
    overdue: 'warning',
    fulfilled: 'success',
    partial: 'secondary',
    broken: 'danger',
    cancelled: 'secondary',
  };

  return (
    <Badge 
      variant={colorMap[status]} 
      className={size === 'sm' ? 'text-xs px-2 py-0.5' : ''}
    >
      {getPromiseStatusLabel(status)}
    </Badge>
  );
}

// ============================================
// PRIORITY BADGE COMPONENT
// ============================================

interface PriorityBadgeProps {
  priority: PromisePriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colorMap: Record<PromisePriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[priority]}`}>
      {getPriorityLabel(priority)}
    </span>
  );
}

// ============================================
// URGENCY INDICATOR
// ============================================

interface UrgencyIndicatorProps {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  showLabel?: boolean;
}

export function UrgencyIndicator({ level, showLabel = false }: UrgencyIndicatorProps) {
  const config = {
    none: { color: 'bg-gray-300', label: 'No urgency' },
    low: { color: 'bg-green-500', label: 'Low urgency' },
    medium: { color: 'bg-yellow-500', label: 'Medium urgency' },
    high: { color: 'bg-orange-500', label: 'High urgency' },
    critical: { color: 'bg-red-500 animate-pulse', label: 'Critical' },
  };

  const { color, label } = config[level];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} title={label} />
      {showLabel && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}

// ============================================
// PROMISE CARD COMPONENT
// ============================================

interface PromiseCardProps {
  promise: PromiseWithStatus;
  onSendReminder?: () => void;
  onExtend?: () => void;
  onRecordPayment?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

export function PromiseCard({
  promise,
  onSendReminder,
  onExtend,
  onRecordPayment,
  onViewDetails,
  compact = false,
}: PromiseCardProps) {
  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString('en-UG')}`;

  const formatDate = (date: Date) => 
    new Date(date).toLocaleDateString('en-UG', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

  if (compact) {
    return (
      <div 
        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onViewDetails}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UrgencyIndicator level={promise.urgencyLevel} />
            <div>
              <p className="font-medium">{promise.studentName}</p>
              <p className="text-sm text-gray-500">{promise.studentClass}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(promise.promisedAmount)}</p>
            <PromiseStatusBadge status={promise.status} size="sm" />
          </div>
        </div>
        {promise.daysOverdue > 0 && (
          <p className="text-xs text-red-600 mt-2">
            {promise.daysOverdue} days overdue
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <UrgencyIndicator level={promise.urgencyLevel} />
          <div>
            <h3 className="font-semibold">{promise.studentName}</h3>
            <p className="text-sm text-gray-500">{promise.studentClass}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={promise.priority} />
          <PromiseStatusBadge status={promise.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Promised Amount</p>
          <p className="font-semibold text-lg">{formatCurrency(promise.promisedAmount)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Amount Paid</p>
          <p className="font-semibold text-lg text-green-600">{formatCurrency(promise.amountPaid)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Due Date</p>
          <p className={`font-medium ${promise.daysOverdue > 0 ? 'text-red-600' : ''}`}>
            {formatDate(promise.dueDate)}
            {promise.daysUntilDue > 0 && (
              <span className="text-gray-500 font-normal"> ({promise.daysUntilDue} days)</span>
            )}
            {promise.daysOverdue > 0 && (
              <span className="text-red-500 font-normal"> ({promise.daysOverdue} days overdue)</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Guardian</p>
          <p className="font-medium">{promise.guardianName}</p>
          <p className="text-sm text-gray-500">{promise.guardianPhone}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Payment Progress</span>
          <span className="font-medium">{promise.percentagePaid}%</span>
        </div>
        <ProgressBar 
          value={promise.percentagePaid} 
          className="h-2"
        />
      </div>

      {/* Reminder Info */}
      {promise.reminderCount > 0 && (
        <div className="text-sm text-gray-500 mb-4">
          <span>{promise.reminderCount} reminder(s) sent</span>
          {promise.lastReminderDate && (
            <span> • Last: {formatDate(promise.lastReminderDate)}</span>
          )}
        </div>
      )}

      {/* Notes */}
      {promise.notes && (
        <div className="bg-gray-50 rounded p-2 mb-4 text-sm">
          <span className="text-gray-500">Note:</span> {promise.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {onSendReminder && promise.status !== 'fulfilled' && promise.status !== 'cancelled' && (
          <Button size="sm" variant="outline" onClick={onSendReminder}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Send Reminder
          </Button>
        )}
        {onRecordPayment && promise.status !== 'fulfilled' && promise.status !== 'cancelled' && (
          <Button size="sm" onClick={onRecordPayment}>
            Record Payment
          </Button>
        )}
        {onExtend && (promise.status === 'overdue' || promise.status === 'due') && (
          <Button size="sm" variant="outline" onClick={onExtend}>
            Extend Date
          </Button>
        )}
        {onViewDetails && (
          <Button size="sm" variant="ghost" onClick={onViewDetails}>
            View Details →
          </Button>
        )}
      </div>
    </Card>
  );
}

// ============================================
// PROMISES TABLE COMPONENT
// ============================================

interface PromisesTableProps {
  promises: PromiseWithStatus[];
  onRowClick?: (promise: PromiseWithStatus) => void;
  onSendReminder?: (promise: PromiseWithStatus) => void;
}

export function PromisesTable({ promises, onRowClick, onSendReminder }: PromisesTableProps) {
  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString('en-UG')}`;

  const formatDate = (date: Date) => 
    new Date(date).toLocaleDateString('en-UG', { 
      day: 'numeric', 
      month: 'short' 
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600"></th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Class</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Promised</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Paid</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Reminders</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {promises.map((promise) => (
            <tr 
              key={promise.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onRowClick?.(promise)}
            >
              <td className="px-4 py-3">
                <UrgencyIndicator level={promise.urgencyLevel} />
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium">{promise.studentName}</p>
                  <p className="text-xs text-gray-500">{promise.guardianPhone}</p>
                </div>
              </td>
              <td className="px-4 py-3">{promise.studentClass}</td>
              <td className="px-4 py-3 font-medium">
                {formatCurrency(promise.promisedAmount)}
              </td>
              <td className="px-4 py-3 text-green-600">
                {formatCurrency(promise.amountPaid)}
              </td>
              <td className="px-4 py-3">
                <div>
                  <p>{formatDate(promise.dueDate)}</p>
                  {promise.daysOverdue > 0 && (
                    <p className="text-xs text-red-500">{promise.daysOverdue}d overdue</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <PromiseStatusBadge status={promise.status} size="sm" />
              </td>
              <td className="px-4 py-3 text-center">
                {promise.reminderCount}
              </td>
              <td className="px-4 py-3">
                {onSendReminder && promise.status !== 'fulfilled' && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendReminder(promise);
                    }}
                  >
                    📤
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// PROMISE SUMMARY DASHBOARD
// ============================================

interface PromiseSummaryDashboardProps {
  summary: PromiseSummary;
}

export function PromiseSummaryDashboard({ summary }: PromiseSummaryDashboardProps) {
  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString('en-UG')}`;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{summary.totalPromises}</p>
          <p className="text-sm text-gray-500">Total Promises</p>
          <p className="text-sm font-medium mt-1">{formatCurrency(summary.totalPromisedAmount)}</p>
        </Card>
        <Card className="p-4 text-center bg-green-50">
          <p className="text-3xl font-bold text-green-600">{summary.fulfilledCount}</p>
          <p className="text-sm text-gray-500">Fulfilled</p>
          <p className="text-sm font-medium mt-1">{formatCurrency(summary.fulfilledAmount)}</p>
        </Card>
        <Card className="p-4 text-center bg-yellow-50">
          <p className="text-3xl font-bold text-yellow-600">{summary.overdueCount}</p>
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-sm font-medium mt-1">{formatCurrency(summary.overdueAmount)}</p>
        </Card>
        <Card className="p-4 text-center bg-red-50">
          <p className="text-3xl font-bold text-red-600">{summary.brokenCount}</p>
          <p className="text-sm text-gray-500">Broken</p>
          <p className="text-sm font-medium mt-1">{formatCurrency(summary.brokenAmount)}</p>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48" cy="48" r="40"
                  stroke="#e5e7eb" strokeWidth="8" fill="none"
                />
                <circle
                  cx="48" cy="48" r="40"
                  stroke="#22c55e" strokeWidth="8" fill="none"
                  strokeDasharray={`${summary.fulfillmentRate * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{summary.fulfillmentRate}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Fulfillment Rate</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{summary.averageDaysToFulfill}</p>
            <p className="text-sm text-gray-500">Avg. Days to Fulfill</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{summary.averageDelayDays}</p>
            <p className="text-sm text-gray-500">Avg. Delay (Overdue)</p>
          </div>
        </div>
      </Card>

      {/* Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">By Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Pending</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{summary.pendingCount}</span>
                <span className="text-gray-500 text-sm ml-2">{formatCurrency(summary.pendingAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Due Today</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{summary.dueCount}</span>
                <span className="text-gray-500 text-sm ml-2">{formatCurrency(summary.dueAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Overdue</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{summary.overdueCount}</span>
                <span className="text-gray-500 text-sm ml-2">{formatCurrency(summary.overdueAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Partial</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{summary.partialCount}</span>
                <span className="text-gray-500 text-sm ml-2">
                  {formatCurrency(summary.partialCollected)} / {formatCurrency(summary.partialAmount)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">By Priority</h3>
          <div className="space-y-3">
            {summary.byPriority.map(({ priority, count, amount }) => (
              <div key={priority} className="flex justify-between items-center">
                <PriorityBadge priority={priority} />
                <div className="text-right">
                  <span className="font-medium">{count}</span>
                  <span className="text-gray-500 text-sm ml-2">{formatCurrency(amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* By Class */}
      {summary.byClass.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">By Class</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {summary.byClass.map(({ className, count, amount, overdueCount }) => (
              <div key={className} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{className}</p>
                <p className="text-sm text-gray-500">{count} promises</p>
                {overdueCount > 0 && (
                  <p className="text-xs text-red-500">{overdueCount} overdue</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================
// CREATE PROMISE FORM
// ============================================

interface CreatePromiseFormProps {
  studentId: string;
  studentName: string;
  studentClass: string;
  guardianName: string;
  guardianPhone: string;
  currentBalance: number;
  onSubmit: (request: CreatePromiseRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function CreatePromiseForm({
  studentId,
  studentName,
  studentClass,
  guardianName,
  guardianPhone,
  currentBalance,
  onSubmit,
  onCancel,
  isSubmitting,
}: CreatePromiseFormProps) {
  const [amount, setAmount] = useState(currentBalance.toString());
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PromisePriority>('medium');
  const [gracePeriod, setGracePeriod] = useState('7');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleReminder, setScheduleReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState('2');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      studentId,
      promisedAmount: parseFloat(amount),
      dueDate: new Date(dueDate),
      gracePeriodDays: parseInt(gracePeriod),
      priority,
      reason: reason || undefined,
      notes: notes || undefined,
      scheduleReminder,
      reminderDaysBefore: scheduleReminder ? parseInt(reminderDays) : undefined,
    });
  };

  const formatCurrency = (val: number) => `UGX ${val.toLocaleString('en-UG')}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Student Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 font-medium">{studentName}</span>
          </div>
          <div>
            <span className="text-gray-500">Class:</span>
            <span className="ml-2 font-medium">{studentClass}</span>
          </div>
          <div>
            <span className="text-gray-500">Guardian:</span>
            <span className="ml-2 font-medium">{guardianName}</span>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>
            <span className="ml-2 font-medium">{guardianPhone}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Outstanding Balance:</span>
            <span className="ml-2 font-semibold text-red-600">{formatCurrency(currentBalance)}</span>
          </div>
        </div>
      </div>

      {/* Promise Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Promised Amount (UGX) *
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PromisePriority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grace Period (days)
          </label>
          <Input
            type="number"
            value={gracePeriod}
            onChange={(e) => setGracePeriod(e.target.value)}
            min="0"
            max="30"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason for Promise
        </label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Waiting for salary, Business payment pending..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder="Any additional notes about this promise..."
        />
      </div>

      {/* Reminder Settings */}
      <div className="border-t pt-4">
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={scheduleReminder}
            onChange={(e) => setScheduleReminder(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">Schedule automatic reminder</span>
        </label>
        
        {scheduleReminder && (
          <div className="flex items-center gap-2 pl-6">
            <span className="text-sm text-gray-600">Send reminder</span>
            <Input
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              min="1"
              max="14"
              className="w-20"
            />
            <span className="text-sm text-gray-600">days before due date</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Promise'}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// FOLLOW-UP TIMELINE
// ============================================

interface FollowUpTimelineProps {
  followUps: PromiseFollowUp[];
}

export function FollowUpTimeline({ followUps }: FollowUpTimelineProps) {
  const getActionIcon = (type: PromiseFollowUp['actionType']) => {
    const icons: Record<PromiseFollowUp['actionType'], string> = {
      reminder_sent: '📤',
      phone_call: '📞',
      meeting: '🤝',
      payment_received: '💰',
      extension_granted: '📅',
      escalated: '⚠️',
      note_added: '📝',
    };
    return icons[type] || '📌';
  };

  const getActionLabel = (type: PromiseFollowUp['actionType']) => {
    const labels: Record<PromiseFollowUp['actionType'], string> = {
      reminder_sent: 'Reminder Sent',
      phone_call: 'Phone Call',
      meeting: 'Meeting',
      payment_received: 'Payment Received',
      extension_granted: 'Extension Granted',
      escalated: 'Escalated',
      note_added: 'Note Added',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {followUps.map((followUp, index) => (
        <div key={followUp.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
              {getActionIcon(followUp.actionType)}
            </div>
            {index < followUps.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 my-2"></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">{getActionLabel(followUp.actionType)}</span>
              <span className="text-sm text-gray-500">
                {new Date(followUp.actionDate).toLocaleDateString('en-UG', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {followUp.notes && (
              <p className="text-sm text-gray-600 mt-1">{followUp.notes}</p>
            )}
            {followUp.outcome && (
              <p className="text-sm mt-1">
                <span className="text-gray-500">Outcome:</span> {followUp.outcome}
              </p>
            )}
            {followUp.newDueDate && (
              <p className="text-sm text-blue-600 mt-1">
                New due date: {new Date(followUp.newDueDate).toLocaleDateString('en-UG')}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">by {followUp.performedBy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// URGENT PROMISES WIDGET (FOR DASHBOARD)
// ============================================

interface UrgentPromisesWidgetProps {
  promises: PromiseWithStatus[];
  onViewAll?: () => void;
  onViewPromise?: (promise: PromiseWithStatus) => void;
}

export function UrgentPromisesWidget({ 
  promises, 
  onViewAll,
  onViewPromise,
}: UrgentPromisesWidgetProps) {
  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString('en-UG')}`;

  if (promises.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-orange-500">⚠️</span>
          Urgent Payment Promises
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">
          No urgent promises at the moment
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-orange-500">⚠️</span>
          Urgent Payment Promises
          <Badge variant="danger">{promises.length}</Badge>
        </h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All →
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {promises.map((promise) => (
          <div 
            key={promise.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
            onClick={() => onViewPromise?.(promise)}
          >
            <div className="flex items-center gap-2">
              <UrgencyIndicator level={promise.urgencyLevel} />
              <div>
                <p className="font-medium text-sm">{promise.studentName}</p>
                <p className="text-xs text-gray-500">
                  {promise.daysOverdue > 0 
                    ? `${promise.daysOverdue} days overdue`
                    : `Due ${promise.daysUntilDue === 0 ? 'today' : `in ${promise.daysUntilDue} days`}`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">{formatCurrency(promise.remainingAmount)}</p>
              <PromiseStatusBadge status={promise.status} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

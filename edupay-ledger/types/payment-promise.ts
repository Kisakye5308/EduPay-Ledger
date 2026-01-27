/**
 * Payment Promise Types
 * Types for tracking parent payment commitments
 */

import { ResidenceType } from './residence';

/**
 * Promise status
 */
export type PromiseStatus = 
  | 'pending'      // Promise made, not yet due
  | 'due'          // Due date reached, awaiting payment
  | 'overdue'      // Past due date, not fulfilled
  | 'fulfilled'    // Payment received matching or exceeding promise
  | 'partial'      // Partial payment received
  | 'broken'       // Past grace period, marked as broken
  | 'cancelled';   // Promise cancelled/withdrawn

/**
 * Reminder type
 */
export type ReminderType =
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'phone_call'
  | 'in_person';

/**
 * Promise priority level
 */
export type PromisePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Payment Promise
 */
export interface PaymentPromise {
  id: string;
  schoolId: string;
  studentId: string;
  
  // Student info (denormalized for quick access)
  studentName: string;
  studentClass: string;
  
  // Promise details
  promisedAmount: number;       // Amount parent promised to pay
  promiseDate: Date;            // When promise was made
  dueDate: Date;                // When payment is expected
  gracePeriodDays: number;      // Days after due date before marked broken
  
  // Guardian info
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  relation?: string;
  
  // Status tracking
  status: PromiseStatus;
  priority: PromisePriority;
  
  // Payment tracking
  amountPaid: number;           // Amount actually received
  paymentIds: string[];         // IDs of payments linked to this promise
  lastPaymentDate?: Date;
  
  // Notes and context
  notes?: string;
  reason?: string;              // Reason for the promise/delay
  
  // Reminder tracking
  reminderCount: number;
  lastReminderDate?: Date;
  lastReminderType?: ReminderType;
  nextReminderDate?: Date;
  
  // Auto-generated
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  fulfilledAt?: Date;
  brokenAt?: Date;
}

/**
 * Promise Reminder
 */
export interface PromiseReminder {
  id: string;
  promiseId: string;
  schoolId: string;
  studentId: string;
  
  // Reminder details
  type: ReminderType;
  sentAt: Date;
  sentBy: string;
  sentTo: string;           // Phone/email
  
  // Message
  message: string;
  templateUsed?: string;
  
  // Response tracking
  acknowledged: boolean;
  acknowledgedAt?: Date;
  responseNote?: string;
  
  // New promise made after reminder
  newPromiseId?: string;
}

/**
 * Promise Template for common messages
 */
export interface ReminderTemplate {
  id: string;
  schoolId: string;
  name: string;
  type: ReminderType;
  subject?: string;          // For email
  message: string;           // Supports placeholders like {studentName}, {amount}, {dueDate}
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create promise request
 */
export interface CreatePromiseRequest {
  studentId: string;
  promisedAmount: number;
  dueDate: Date;
  gracePeriodDays?: number;
  notes?: string;
  reason?: string;
  priority?: PromisePriority;
  scheduleReminder?: boolean;
  reminderDaysBefore?: number;
}

/**
 * Promise follow-up action
 */
export interface PromiseFollowUp {
  id: string;
  promiseId: string;
  actionType: 'reminder_sent' | 'phone_call' | 'meeting' | 'payment_received' | 'extension_granted' | 'escalated' | 'note_added';
  actionDate: Date;
  performedBy: string;
  notes?: string;
  outcome?: string;
  newDueDate?: Date;          // If extension granted
}

/**
 * Promise Summary for reporting
 */
export interface PromiseSummary {
  totalPromises: number;
  totalPromisedAmount: number;
  
  // By status
  pendingCount: number;
  pendingAmount: number;
  
  dueCount: number;
  dueAmount: number;
  
  overdueCount: number;
  overdueAmount: number;
  
  fulfilledCount: number;
  fulfilledAmount: number;
  
  partialCount: number;
  partialAmount: number;
  partialCollected: number;
  
  brokenCount: number;
  brokenAmount: number;
  
  // Metrics
  fulfillmentRate: number;      // % of promises fulfilled on time
  averageDaysToFulfill: number;
  averageDelayDays: number;     // For overdue
  
  // Breakdown
  byClass: Array<{
    className: string;
    count: number;
    amount: number;
    overdueCount: number;
  }>;
  
  byPriority: Array<{
    priority: PromisePriority;
    count: number;
    amount: number;
  }>;
}

/**
 * Promise with calculated fields
 */
export interface PromiseWithStatus extends PaymentPromise {
  daysUntilDue: number;
  daysOverdue: number;
  isInGracePeriod: boolean;
  percentagePaid: number;
  remainingAmount: number;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get promise status label
 */
export function getPromiseStatusLabel(status: PromiseStatus): string {
  const labels: Record<PromiseStatus, string> = {
    pending: 'Pending',
    due: 'Due Today',
    overdue: 'Overdue',
    fulfilled: 'Fulfilled',
    partial: 'Partial Payment',
    broken: 'Broken',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

/**
 * Get promise status color
 */
export function getPromiseStatusColor(status: PromiseStatus): string {
  const colors: Record<PromiseStatus, string> = {
    pending: 'blue',
    due: 'yellow',
    overdue: 'orange',
    fulfilled: 'green',
    partial: 'purple',
    broken: 'red',
    cancelled: 'gray',
  };
  return colors[status];
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: PromisePriority): string {
  const labels: Record<PromisePriority, string> = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    critical: 'Critical',
  };
  return labels[priority];
}

/**
 * Calculate promise status based on dates and payments
 */
export function calculatePromiseStatus(
  promise: Pick<PaymentPromise, 'dueDate' | 'gracePeriodDays' | 'promisedAmount' | 'amountPaid' | 'status'>
): PromiseStatus {
  // If already terminated, keep status
  if (promise.status === 'fulfilled' || promise.status === 'broken' || promise.status === 'cancelled') {
    return promise.status;
  }

  const now = new Date();
  const dueDate = new Date(promise.dueDate);
  const gracePeriodEnd = new Date(dueDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + promise.gracePeriodDays);

  const percentPaid = promise.promisedAmount > 0 
    ? (promise.amountPaid / promise.promisedAmount) * 100 
    : 0;

  // Check if fulfilled
  if (promise.amountPaid >= promise.promisedAmount) {
    return 'fulfilled';
  }

  // Check if partial
  if (promise.amountPaid > 0) {
    // Past grace period with partial - broken
    if (now > gracePeriodEnd) {
      return 'broken';
    }
    return 'partial';
  }

  // No payment yet
  // Past grace period - broken
  if (now > gracePeriodEnd) {
    return 'broken';
  }

  // Past due date but in grace period
  if (now > dueDate) {
    return 'overdue';
  }

  // Due today
  if (now.toDateString() === dueDate.toDateString()) {
    return 'due';
  }

  // Not yet due
  return 'pending';
}

/**
 * Calculate urgency level
 */
export function calculateUrgencyLevel(
  promise: Pick<PaymentPromise, 'dueDate' | 'priority' | 'status'>
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (promise.status === 'fulfilled' || promise.status === 'cancelled') {
    return 'none';
  }

  if (promise.status === 'broken') {
    return 'critical';
  }

  const now = new Date();
  const dueDate = new Date(promise.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Already overdue
  if (daysUntilDue < 0) {
    return promise.priority === 'critical' ? 'critical' : 'high';
  }

  // Due today or tomorrow
  if (daysUntilDue <= 1) {
    return promise.priority === 'low' ? 'medium' : 'high';
  }

  // Due within a week
  if (daysUntilDue <= 7) {
    return promise.priority === 'critical' ? 'high' : 'medium';
  }

  // Due within 2 weeks
  if (daysUntilDue <= 14) {
    return 'low';
  }

  return 'none';
}

/**
 * Format reminder message with placeholders
 */
export function formatReminderMessage(
  template: string,
  data: {
    studentName: string;
    guardianName: string;
    amount: number;
    dueDate: Date;
    schoolName?: string;
    balance?: number;
  }
): string {
  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString('en-UG')}`;

  return template
    .replace(/{studentName}/g, data.studentName)
    .replace(/{guardianName}/g, data.guardianName)
    .replace(/{amount}/g, formatCurrency(data.amount))
    .replace(/{dueDate}/g, new Date(data.dueDate).toLocaleDateString('en-UG', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
    .replace(/{schoolName}/g, data.schoolName || 'the school')
    .replace(/{balance}/g, data.balance ? formatCurrency(data.balance) : '');
}

/**
 * Default reminder templates
 */
export const DEFAULT_REMINDER_TEMPLATES: Omit<ReminderTemplate, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Initial Reminder',
    type: 'sms',
    message: 'Dear {guardianName}, this is a reminder that your payment of {amount} for {studentName} is due on {dueDate}. Please make arrangements. Thank you.',
    isDefault: true,
  },
  {
    name: 'Due Date Reminder',
    type: 'sms',
    message: 'Dear {guardianName}, your payment of {amount} for {studentName} is due TODAY. Please visit the bursars office to make payment. Thank you.',
    isDefault: false,
  },
  {
    name: 'Overdue Notice',
    type: 'sms',
    message: 'Dear {guardianName}, your payment of {amount} for {studentName} is now OVERDUE. Please make payment immediately to avoid service disruption. Contact us if you have concerns.',
    isDefault: false,
  },
  {
    name: 'Final Notice',
    type: 'sms',
    message: 'URGENT: Dear {guardianName}, the payment of {amount} for {studentName} is severely overdue. This is a final notice. Please contact the school immediately.',
    isDefault: false,
  },
];

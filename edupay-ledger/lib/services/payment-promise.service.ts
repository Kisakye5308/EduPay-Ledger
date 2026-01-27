/**
 * Payment Promise Service
 * Firebase operations for payment promise tracking
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  PaymentPromise,
  PromiseReminder,
  ReminderTemplate,
  PromiseSummary,
  PromiseWithStatus,
  PromiseFollowUp,
  CreatePromiseRequest,
  PromiseStatus,
  PromisePriority,
  ReminderType,
  calculatePromiseStatus,
  calculateUrgencyLevel,
  DEFAULT_REMINDER_TEMPLATES,
} from '../../types/payment-promise';

const PROMISES_COLLECTION = 'payment_promises';
const REMINDERS_COLLECTION = 'promise_reminders';
const TEMPLATES_COLLECTION = 'reminder_templates';
const FOLLOW_UPS_COLLECTION = 'promise_follow_ups';

// ============================================
// PROMISE CRUD OPERATIONS
// ============================================

/**
 * Create a new payment promise
 */
export async function createPaymentPromise(
  schoolId: string,
  request: CreatePromiseRequest,
  studentInfo: { name: string; className: string; guardianName: string; guardianPhone: string; guardianEmail?: string },
  createdBy: string
): Promise<PaymentPromise> {
  const promiseId = `promise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const promise: PaymentPromise = {
    id: promiseId,
    schoolId,
    studentId: request.studentId,
    studentName: studentInfo.name,
    studentClass: studentInfo.className,
    promisedAmount: request.promisedAmount,
    promiseDate: new Date(),
    dueDate: request.dueDate,
    gracePeriodDays: request.gracePeriodDays ?? 7,
    guardianName: studentInfo.guardianName,
    guardianPhone: studentInfo.guardianPhone,
    guardianEmail: studentInfo.guardianEmail,
    status: 'pending',
    priority: request.priority ?? 'medium',
    amountPaid: 0,
    paymentIds: [],
    reminderCount: 0,
    notes: request.notes,
    reason: request.reason,
    createdAt: new Date(),
    createdBy,
    updatedAt: new Date(),
  };

  await setDoc(doc(db, PROMISES_COLLECTION, promiseId), {
    ...promise,
    promiseDate: Timestamp.fromDate(promise.promiseDate),
    dueDate: Timestamp.fromDate(promise.dueDate),
    createdAt: Timestamp.fromDate(promise.createdAt),
    updatedAt: Timestamp.fromDate(promise.updatedAt),
  });

  // Schedule reminder if requested
  if (request.scheduleReminder && request.reminderDaysBefore) {
    const reminderDate = new Date(request.dueDate);
    reminderDate.setDate(reminderDate.getDate() - request.reminderDaysBefore);
    
    await updateDoc(doc(db, PROMISES_COLLECTION, promiseId), {
      nextReminderDate: Timestamp.fromDate(reminderDate),
    });
    
    promise.nextReminderDate = reminderDate;
  }

  return promise;
}

/**
 * Get all promises for a school
 */
export async function getSchoolPromises(
  schoolId: string,
  filters?: {
    status?: PromiseStatus[];
    priority?: PromisePriority[];
    className?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<PromiseWithStatus[]> {
  let q = query(
    collection(db, PROMISES_COLLECTION),
    where('schoolId', '==', schoolId),
    orderBy('dueDate', 'asc')
  );

  const snapshot = await getDocs(q);
  let promises: PromiseWithStatus[] = snapshot.docs.map(doc => {
    const data = doc.data();
    const promise: PaymentPromise = {
      ...data,
      id: doc.id,
      promiseDate: data.promiseDate?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      lastReminderDate: data.lastReminderDate?.toDate(),
      nextReminderDate: data.nextReminderDate?.toDate(),
      fulfilledAt: data.fulfilledAt?.toDate(),
      brokenAt: data.brokenAt?.toDate(),
    } as PaymentPromise;

    return enrichPromiseWithStatus(promise);
  });

  // Apply filters
  if (filters?.status?.length) {
    promises = promises.filter(p => filters.status!.includes(p.status));
  }
  if (filters?.priority?.length) {
    promises = promises.filter(p => filters.priority!.includes(p.priority));
  }
  if (filters?.className) {
    promises = promises.filter(p => p.studentClass === filters.className);
  }
  if (filters?.fromDate) {
    promises = promises.filter(p => p.dueDate >= filters.fromDate!);
  }
  if (filters?.toDate) {
    promises = promises.filter(p => p.dueDate <= filters.toDate!);
  }

  return promises;
}

/**
 * Get promises for a specific student
 */
export async function getStudentPromises(
  schoolId: string,
  studentId: string
): Promise<PromiseWithStatus[]> {
  const q = query(
    collection(db, PROMISES_COLLECTION),
    where('schoolId', '==', schoolId),
    where('studentId', '==', studentId),
    orderBy('dueDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const promise: PaymentPromise = {
      ...data,
      id: doc.id,
      promiseDate: data.promiseDate?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      lastReminderDate: data.lastReminderDate?.toDate(),
      nextReminderDate: data.nextReminderDate?.toDate(),
      fulfilledAt: data.fulfilledAt?.toDate(),
      brokenAt: data.brokenAt?.toDate(),
    } as PaymentPromise;

    return enrichPromiseWithStatus(promise);
  });
}

/**
 * Enrich promise with calculated status fields
 */
function enrichPromiseWithStatus(promise: PaymentPromise): PromiseWithStatus {
  const now = new Date();
  const dueDate = new Date(promise.dueDate);
  const gracePeriodEnd = new Date(dueDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + promise.gracePeriodDays);

  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysOverdue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
  const isInGracePeriod = daysOverdue > 0 && now <= gracePeriodEnd;
  const percentagePaid = promise.promisedAmount > 0 
    ? Math.round((promise.amountPaid / promise.promisedAmount) * 100) 
    : 0;
  const remainingAmount = promise.promisedAmount - promise.amountPaid;

  // Recalculate status
  const status = calculatePromiseStatus(promise);
  const urgencyLevel = calculateUrgencyLevel({ ...promise, status });

  return {
    ...promise,
    status,
    daysUntilDue,
    daysOverdue,
    isInGracePeriod,
    percentagePaid,
    remainingAmount,
    urgencyLevel,
  };
}

/**
 * Update promise status
 */
export async function updatePromiseStatus(
  promiseId: string,
  status: PromiseStatus,
  notes?: string
): Promise<void> {
  const updates: any = {
    status,
    updatedAt: Timestamp.now(),
  };

  if (status === 'fulfilled') {
    updates.fulfilledAt = Timestamp.now();
  } else if (status === 'broken') {
    updates.brokenAt = Timestamp.now();
  }

  if (notes) {
    updates.notes = notes;
  }

  await updateDoc(doc(db, PROMISES_COLLECTION, promiseId), updates);
}

/**
 * Record payment against a promise
 */
export async function recordPaymentOnPromise(
  promiseId: string,
  paymentId: string,
  amount: number
): Promise<void> {
  const promiseRef = doc(db, PROMISES_COLLECTION, promiseId);
  const promiseDoc = await getDoc(promiseRef);
  
  if (!promiseDoc.exists()) {
    throw new Error('Promise not found');
  }

  const promise = promiseDoc.data() as PaymentPromise;
  const newAmountPaid = promise.amountPaid + amount;
  const newPaymentIds = [...promise.paymentIds, paymentId];

  const updates: any = {
    amountPaid: newAmountPaid,
    paymentIds: newPaymentIds,
    lastPaymentDate: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Check if promise is now fulfilled
  if (newAmountPaid >= promise.promisedAmount) {
    updates.status = 'fulfilled';
    updates.fulfilledAt = Timestamp.now();
  } else if (newAmountPaid > 0) {
    updates.status = 'partial';
  }

  await updateDoc(promiseRef, updates);
}

/**
 * Extend promise due date
 */
export async function extendPromiseDueDate(
  promiseId: string,
  newDueDate: Date,
  reason: string,
  extendedBy: string
): Promise<void> {
  await updateDoc(doc(db, PROMISES_COLLECTION, promiseId), {
    dueDate: Timestamp.fromDate(newDueDate),
    status: 'pending',
    updatedAt: Timestamp.now(),
  });

  // Log follow-up
  await addFollowUp(promiseId, {
    actionType: 'extension_granted',
    notes: reason,
    newDueDate,
    performedBy: extendedBy,
  });
}

/**
 * Cancel a promise
 */
export async function cancelPromise(
  promiseId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, PROMISES_COLLECTION, promiseId), {
    status: 'cancelled',
    notes: reason,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// REMINDER OPERATIONS
// ============================================

/**
 * Get reminders due for sending
 */
export async function getDueReminders(schoolId: string): Promise<PromiseWithStatus[]> {
  const now = new Date();
  
  const q = query(
    collection(db, PROMISES_COLLECTION),
    where('schoolId', '==', schoolId),
    where('nextReminderDate', '<=', Timestamp.fromDate(now)),
    where('status', 'in', ['pending', 'due', 'overdue', 'partial'])
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const promise: PaymentPromise = {
      ...data,
      id: doc.id,
      promiseDate: data.promiseDate?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      lastReminderDate: data.lastReminderDate?.toDate(),
      nextReminderDate: data.nextReminderDate?.toDate(),
    } as PaymentPromise;

    return enrichPromiseWithStatus(promise);
  });
}

/**
 * Record that a reminder was sent
 */
export async function recordReminderSent(
  promiseId: string,
  type: ReminderType,
  message: string,
  sentBy: string,
  sentTo: string
): Promise<PromiseReminder> {
  const reminderId = `reminder_${Date.now()}`;
  
  // Get promise for context
  const promiseDoc = await getDoc(doc(db, PROMISES_COLLECTION, promiseId));
  const promise = promiseDoc.data() as PaymentPromise;
  
  const reminder: PromiseReminder = {
    id: reminderId,
    promiseId,
    schoolId: promise.schoolId,
    studentId: promise.studentId,
    type,
    sentAt: new Date(),
    sentBy,
    sentTo,
    message,
    acknowledged: false,
  };

  await setDoc(doc(db, REMINDERS_COLLECTION, reminderId), {
    ...reminder,
    sentAt: Timestamp.fromDate(reminder.sentAt),
  });

  // Update promise reminder count
  await updateDoc(doc(db, PROMISES_COLLECTION, promiseId), {
    reminderCount: (promise.reminderCount || 0) + 1,
    lastReminderDate: Timestamp.now(),
    lastReminderType: type,
    updatedAt: Timestamp.now(),
  });

  // Log follow-up
  await addFollowUp(promiseId, {
    actionType: 'reminder_sent',
    notes: `${type} reminder sent to ${sentTo}`,
    performedBy: sentBy,
  });

  return reminder;
}

/**
 * Schedule next reminder
 */
export async function scheduleNextReminder(
  promiseId: string,
  nextDate: Date
): Promise<void> {
  await updateDoc(doc(db, PROMISES_COLLECTION, promiseId), {
    nextReminderDate: Timestamp.fromDate(nextDate),
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// FOLLOW-UP OPERATIONS
// ============================================

/**
 * Add a follow-up action
 */
async function addFollowUp(
  promiseId: string,
  action: {
    actionType: PromiseFollowUp['actionType'];
    notes?: string;
    outcome?: string;
    newDueDate?: Date;
    performedBy: string;
  }
): Promise<void> {
  const followUpId = `followup_${Date.now()}`;
  
  await setDoc(doc(db, FOLLOW_UPS_COLLECTION, followUpId), {
    id: followUpId,
    promiseId,
    actionType: action.actionType,
    actionDate: Timestamp.now(),
    performedBy: action.performedBy,
    notes: action.notes || null,
    outcome: action.outcome || null,
    newDueDate: action.newDueDate ? Timestamp.fromDate(action.newDueDate) : null,
  });
}

/**
 * Get follow-ups for a promise
 */
export async function getPromiseFollowUps(promiseId: string): Promise<PromiseFollowUp[]> {
  const q = query(
    collection(db, FOLLOW_UPS_COLLECTION),
    where('promiseId', '==', promiseId),
    orderBy('actionDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      actionDate: data.actionDate?.toDate() || new Date(),
      newDueDate: data.newDueDate?.toDate(),
    } as PromiseFollowUp;
  });
}

// ============================================
// SUMMARY & REPORTS
// ============================================

/**
 * Generate promise summary for a school
 */
export async function generatePromiseSummary(schoolId: string): Promise<PromiseSummary> {
  const promises = await getSchoolPromises(schoolId);
  
  const summary: PromiseSummary = {
    totalPromises: promises.length,
    totalPromisedAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    dueCount: 0,
    dueAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    fulfilledCount: 0,
    fulfilledAmount: 0,
    partialCount: 0,
    partialAmount: 0,
    partialCollected: 0,
    brokenCount: 0,
    brokenAmount: 0,
    fulfillmentRate: 0,
    averageDaysToFulfill: 0,
    averageDelayDays: 0,
    byClass: [],
    byPriority: [],
  };

  const classMap = new Map<string, { count: number; amount: number; overdueCount: number }>();
  const priorityMap = new Map<PromisePriority, { count: number; amount: number }>();
  
  let fulfilledDaysTotal = 0;
  let delayDaysTotal = 0;
  let overdueForAverage = 0;

  for (const promise of promises) {
    summary.totalPromisedAmount += promise.promisedAmount;

    // Count by status
    switch (promise.status) {
      case 'pending':
        summary.pendingCount++;
        summary.pendingAmount += promise.promisedAmount;
        break;
      case 'due':
        summary.dueCount++;
        summary.dueAmount += promise.promisedAmount;
        break;
      case 'overdue':
        summary.overdueCount++;
        summary.overdueAmount += promise.promisedAmount;
        delayDaysTotal += promise.daysOverdue;
        overdueForAverage++;
        break;
      case 'fulfilled':
        summary.fulfilledCount++;
        summary.fulfilledAmount += promise.promisedAmount;
        if (promise.fulfilledAt && promise.promiseDate) {
          const days = Math.ceil(
            (new Date(promise.fulfilledAt).getTime() - new Date(promise.promiseDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          fulfilledDaysTotal += days;
        }
        break;
      case 'partial':
        summary.partialCount++;
        summary.partialAmount += promise.promisedAmount;
        summary.partialCollected += promise.amountPaid;
        break;
      case 'broken':
        summary.brokenCount++;
        summary.brokenAmount += promise.promisedAmount;
        break;
    }

    // By class
    const classData = classMap.get(promise.studentClass) || { count: 0, amount: 0, overdueCount: 0 };
    classData.count++;
    classData.amount += promise.promisedAmount;
    if (promise.status === 'overdue' || promise.status === 'broken') {
      classData.overdueCount++;
    }
    classMap.set(promise.studentClass, classData);

    // By priority
    const prioData = priorityMap.get(promise.priority) || { count: 0, amount: 0 };
    prioData.count++;
    prioData.amount += promise.promisedAmount;
    priorityMap.set(promise.priority, prioData);
  }

  // Calculate rates
  const completedCount = summary.fulfilledCount + summary.brokenCount;
  summary.fulfillmentRate = completedCount > 0 
    ? Math.round((summary.fulfilledCount / completedCount) * 100) 
    : 0;
  
  summary.averageDaysToFulfill = summary.fulfilledCount > 0 
    ? Math.round(fulfilledDaysTotal / summary.fulfilledCount) 
    : 0;
    
  summary.averageDelayDays = overdueForAverage > 0 
    ? Math.round(delayDaysTotal / overdueForAverage) 
    : 0;

  // Convert maps to arrays
  summary.byClass = Array.from(classMap.entries())
    .map(([className, data]) => ({ className, ...data }))
    .sort((a, b) => b.overdueCount - a.overdueCount);

  summary.byPriority = Array.from(priorityMap.entries())
    .map(([priority, data]) => ({ priority, ...data }))
    .sort((a, b) => {
      const order: Record<PromisePriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });

  return summary;
}

// ============================================
// TEMPLATE OPERATIONS
// ============================================

/**
 * Get reminder templates for a school
 */
export async function getReminderTemplates(schoolId: string): Promise<ReminderTemplate[]> {
  const q = query(
    collection(db, TEMPLATES_COLLECTION),
    where('schoolId', '==', schoolId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Initialize with defaults
    await initializeDefaultTemplates(schoolId);
    return getReminderTemplates(schoolId);
  }

  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  } as ReminderTemplate));
}

/**
 * Initialize default templates
 */
async function initializeDefaultTemplates(schoolId: string): Promise<void> {
  const batch = writeBatch(db);
  
  for (const template of DEFAULT_REMINDER_TEMPLATES) {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    batch.set(doc(db, TEMPLATES_COLLECTION, templateId), {
      ...template,
      id: templateId,
      schoolId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

// ============================================
// MOCK DATA FUNCTIONS
// ============================================

export function getMockPromises(): PromiseWithStatus[] {
  const baseDate = new Date();
  
  const promises: PaymentPromise[] = [
    {
      id: 'promise_1',
      schoolId: 'school_1',
      studentId: 'student_1',
      studentName: 'Sarah Nakamya',
      studentClass: 'S.3',
      promisedAmount: 500000,
      promiseDate: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      gracePeriodDays: 7,
      guardianName: 'Mrs. Nakamya Grace',
      guardianPhone: '+256772123456',
      status: 'overdue',
      priority: 'high',
      amountPaid: 200000,
      paymentIds: ['pay_1'],
      reminderCount: 2,
      lastReminderDate: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      lastReminderType: 'sms',
      notes: 'Parent promised to complete by end of week',
      createdAt: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
      createdBy: 'bursar',
      updatedAt: new Date(),
    },
    {
      id: 'promise_2',
      schoolId: 'school_1',
      studentId: 'student_2',
      studentName: 'John Okello',
      studentClass: 'S.1',
      promisedAmount: 800000,
      promiseDate: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      gracePeriodDays: 7,
      guardianName: 'Mr. Okello Peter',
      guardianPhone: '+256701234567',
      status: 'pending',
      priority: 'medium',
      amountPaid: 0,
      paymentIds: [],
      reminderCount: 1,
      lastReminderDate: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      lastReminderType: 'sms',
      nextReminderDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      createdBy: 'bursar',
      updatedAt: new Date(),
    },
    {
      id: 'promise_3',
      schoolId: 'school_1',
      studentId: 'student_3',
      studentName: 'Mary Auma',
      studentClass: 'S.2',
      promisedAmount: 600000,
      promiseDate: new Date(baseDate.getTime() - 21 * 24 * 60 * 60 * 1000),
      dueDate: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000),
      gracePeriodDays: 7,
      guardianName: 'Mrs. Auma Rose',
      guardianPhone: '+256780123456',
      status: 'fulfilled',
      priority: 'high',
      amountPaid: 600000,
      paymentIds: ['pay_2', 'pay_3'],
      reminderCount: 3,
      lastPaymentDate: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
      fulfilledAt: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
      createdAt: new Date(baseDate.getTime() - 21 * 24 * 60 * 60 * 1000),
      createdBy: 'bursar',
      updatedAt: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'promise_4',
      schoolId: 'school_1',
      studentId: 'student_4',
      studentName: 'David Mugisha',
      studentClass: 'S.4',
      promisedAmount: 1200000,
      promiseDate: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      dueDate: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000),
      gracePeriodDays: 7,
      guardianName: 'Mr. Mugisha James',
      guardianPhone: '+256752345678',
      status: 'broken',
      priority: 'critical',
      amountPaid: 0,
      paymentIds: [],
      reminderCount: 5,
      lastReminderDate: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      lastReminderType: 'phone_call',
      brokenAt: new Date(baseDate.getTime() - 13 * 24 * 60 * 60 * 1000),
      notes: 'Parent not responding to calls',
      createdAt: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      createdBy: 'bursar',
      updatedAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'promise_5',
      schoolId: 'school_1',
      studentId: 'student_5',
      studentName: 'Grace Nambi',
      studentClass: 'S.1',
      promisedAmount: 450000,
      promiseDate: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(baseDate.getTime()),
      gracePeriodDays: 7,
      guardianName: 'Mrs. Nambi Faith',
      guardianPhone: '+256761234567',
      status: 'due',
      priority: 'medium',
      amountPaid: 0,
      paymentIds: [],
      reminderCount: 0,
      reason: 'Waiting for salary payment',
      createdAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
      createdBy: 'bursar',
      updatedAt: new Date(),
    },
  ];

  return promises.map(enrichPromiseWithStatus);
}

export function getMockPromiseSummary(): PromiseSummary {
  return {
    totalPromises: 25,
    totalPromisedAmount: 15800000,
    pendingCount: 8,
    pendingAmount: 5200000,
    dueCount: 2,
    dueAmount: 1100000,
    overdueCount: 5,
    overdueAmount: 3500000,
    fulfilledCount: 7,
    fulfilledAmount: 4200000,
    partialCount: 2,
    partialAmount: 1400000,
    partialCollected: 600000,
    brokenCount: 1,
    brokenAmount: 400000,
    fulfillmentRate: 88,
    averageDaysToFulfill: 12,
    averageDelayDays: 5,
    byClass: [
      { className: 'S.1', count: 8, amount: 4800000, overdueCount: 2 },
      { className: 'S.2', count: 6, amount: 4200000, overdueCount: 1 },
      { className: 'S.3', count: 5, amount: 3400000, overdueCount: 2 },
      { className: 'S.4', count: 4, amount: 2600000, overdueCount: 0 },
      { className: 'S.5', count: 2, amount: 800000, overdueCount: 0 },
    ],
    byPriority: [
      { priority: 'critical', count: 2, amount: 2400000 },
      { priority: 'high', count: 6, amount: 4800000 },
      { priority: 'medium', count: 12, amount: 6200000 },
      { priority: 'low', count: 5, amount: 2400000 },
    ],
  };
}

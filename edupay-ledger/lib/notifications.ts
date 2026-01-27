/**
 * Push Notifications Service
 * Handles web push notifications for payment alerts
 */

import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 
  | 'payment_received'
  | 'payment_reminder'
  | 'arrears_alert'
  | 'clearance_granted'
  | 'fee_deadline'
  | 'promise_due'
  | 'system';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, any>;
}

export interface NotificationSubscription {
  token: string;
  userId: string;
  userType: 'admin' | 'parent' | 'student';
  studentIds?: string[]; // For parents - which students they're subscribed for
  preferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  paymentReceived: boolean;
  paymentReminders: boolean;
  arrearsAlerts: boolean;
  clearanceUpdates: boolean;
  feeDeadlines: boolean;
  promiseDue: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  paymentReceived: true,
  paymentReminders: true,
  arrearsAlerts: true,
  clearanceUpdates: true,
  feeDeadlines: true,
  promiseDue: true,
};

// ============================================================================
// Permission & Token Management
// ============================================================================

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) {
    console.warn('Push notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Get FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const messaging = getMessaging();
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  userId: string,
  userType: 'admin' | 'parent' | 'student',
  studentIds?: string[],
  preferences?: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const token = await getFCMToken();
    if (!token) {
      return false;
    }

    const subscription: NotificationSubscription = {
      token,
      userId,
      userType,
      studentIds: studentIds || [],
      preferences: { ...DEFAULT_PREFERENCES, ...preferences },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store subscription in Firestore
    await setDoc(doc(db, 'notificationSubscriptions', token), subscription);

    // Also store token reference in user document
    await setDoc(
      doc(db, 'users', userId),
      { fcmTokens: { [token]: true } },
      { merge: true }
    );

    console.log('Successfully subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const token = await getFCMToken();
    if (!token) {
      return false;
    }

    // Remove subscription from Firestore
    await setDoc(doc(db, 'notificationSubscriptions', token), { active: false }, { merge: true });

    console.log('Successfully unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const token = await getFCMToken();
    if (!token) {
      return false;
    }

    await setDoc(
      doc(db, 'notificationSubscriptions', token),
      {
        preferences,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

// ============================================================================
// Listen for Foreground Messages
// ============================================================================

export function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  try {
    const messaging = getMessaging();
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
}

// ============================================================================
// Server-Side Notification Sending (for API routes)
// ============================================================================

/**
 * Send notification to a specific user (server-side)
 * This should be called from API routes or Cloud Functions
 */
export async function sendNotificationToUser(
  userId: string,
  notification: NotificationPayload
): Promise<boolean> {
  // This is a placeholder - actual implementation would use Firebase Admin SDK
  // in an API route or Cloud Function
  console.log('Would send notification to user:', userId, notification);
  return true;
}

/**
 * Send notification to parent about their child's payment
 */
export async function notifyParentPaymentReceived(
  studentId: string,
  paymentDetails: {
    amount: number;
    studentName: string;
    balance: number;
    receiptNumber: string;
  }
): Promise<boolean> {
  const notification: NotificationPayload = {
    type: 'payment_received',
    title: 'Payment Received ✓',
    body: `UGX ${paymentDetails.amount.toLocaleString()} received for ${paymentDetails.studentName}. New balance: UGX ${paymentDetails.balance.toLocaleString()}`,
    url: `/parent/students/${studentId}`,
    data: {
      studentId,
      receiptNumber: paymentDetails.receiptNumber,
    },
  };

  // Get parent subscriptions for this student
  try {
    const subsQuery = query(
      collection(db, 'notificationSubscriptions'),
      where('studentIds', 'array-contains', studentId),
      where('preferences.paymentReceived', '==', true)
    );
    const snapshot = await getDocs(subsQuery);
    
    // Would send to each subscription via Firebase Admin
    snapshot.forEach((doc) => {
      console.log('Would send to token:', doc.id);
    });

    return true;
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return false;
  }
}

/**
 * Send payment reminder to parents
 */
export async function sendPaymentReminder(
  studentId: string,
  details: {
    studentName: string;
    amountDue: number;
    dueDate: string;
  }
): Promise<boolean> {
  const notification: NotificationPayload = {
    type: 'payment_reminder',
    title: 'Payment Reminder',
    body: `Fee payment of UGX ${details.amountDue.toLocaleString()} for ${details.studentName} is due on ${details.dueDate}`,
    url: `/parent/students/${studentId}/pay`,
    data: { studentId },
  };

  // Similar implementation to above
  return true;
}

/**
 * Send arrears alert to parents
 */
export async function sendArrearsAlert(
  studentId: string,
  details: {
    studentName: string;
    arrearsAmount: number;
    daysOverdue: number;
  }
): Promise<boolean> {
  const notification: NotificationPayload = {
    type: 'arrears_alert',
    title: 'Arrears Notice ⚠️',
    body: `${details.studentName} has outstanding fees of UGX ${details.arrearsAmount.toLocaleString()} (${details.daysOverdue} days overdue)`,
    url: `/parent/students/${studentId}`,
    data: { studentId },
  };

  return true;
}

/**
 * Send clearance granted notification
 */
export async function notifyClearanceGranted(
  studentId: string,
  details: {
    studentName: string;
    term: string;
  }
): Promise<boolean> {
  const notification: NotificationPayload = {
    type: 'clearance_granted',
    title: 'Clearance Granted ✓',
    body: `${details.studentName} has been cleared for ${details.term}`,
    url: `/parent/students/${studentId}/clearance`,
    data: { studentId },
  };

  return true;
}

// ============================================================================
// In-App Notification Display
// ============================================================================

/**
 * Show a local notification (when in foreground)
 */
export function showLocalNotification(notification: NotificationPayload) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const { title, body, icon, url } = notification;

  const notif = new Notification(title, {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: notification.type,
    requireInteraction: notification.type === 'arrears_alert',
    data: { url },
  });

  notif.onclick = () => {
    if (url) {
      window.focus();
      window.location.href = url;
    }
    notif.close();
  };
}

// ============================================================================
// Notification Templates
// ============================================================================

export const notificationTemplates = {
  paymentReceived: (studentName: string, amount: number) => ({
    title: 'Payment Received ✓',
    body: `UGX ${amount.toLocaleString()} received for ${studentName}`,
  }),

  paymentReminder: (studentName: string, amount: number, dueDate: string) => ({
    title: 'Payment Reminder',
    body: `UGX ${amount.toLocaleString()} due for ${studentName} by ${dueDate}`,
  }),

  arrearsAlert: (studentName: string, amount: number) => ({
    title: 'Arrears Notice',
    body: `${studentName} has UGX ${amount.toLocaleString()} in outstanding fees`,
  }),

  clearanceGranted: (studentName: string, term: string) => ({
    title: 'Clearance Granted',
    body: `${studentName} cleared for ${term}`,
  }),

  feeDeadline: (days: number, term: string) => ({
    title: 'Fee Deadline Approaching',
    body: `${days} days until ${term} fee deadline`,
  }),

  promiseDue: (studentName: string, amount: number) => ({
    title: 'Promise to Pay Due',
    body: `Payment promise for ${studentName} (UGX ${amount.toLocaleString()}) is due today`,
  }),
};

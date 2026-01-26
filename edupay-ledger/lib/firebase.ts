/**
 * Firebase Configuration for EduPay Ledger
 * School Fee Management System for Ugandan Schools
 * 
 * This module provides:
 * - Firebase App initialization with offline persistence
 * - Authentication (Email/Password + Phone for Uganda)
 * - Firestore Database with offline support
 * - Cloud Functions for backend operations
 * - Cloud Storage for documents and receipts
 * - Analytics for usage tracking
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  DocumentReference,
  CollectionReference,
  QueryConstraint
} from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getStorage, FirebaseStorage, connectStorageEmulator, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

/**
 * Firebase project configuration for EduPay Ledger
 * These values connect to the edu-pay-ledger Firebase project
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD_rkeL7gDD-4uWXR6CGnwEyW42t20qyHg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "edu-pay-ledger.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "edu-pay-ledger",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "edu-pay-ledger.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "725803373518",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:725803373518:web:88eceae685240408e6519f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-KN0JN93B48"
};

// ============================================================================
// FIREBASE INSTANCES
// ============================================================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

/**
 * Initialize all Firebase services
 * Handles SSR (server-side rendering) and CSR (client-side rendering) appropriately
 */
export function initializeFirebase() {
  if (getApps().length === 0) {
    // Initialize Firebase App
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore with offline persistence (client-side only)
    if (typeof window !== 'undefined') {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      } catch (e) {
        // Firestore already initialized, get existing instance
        db = getFirestore(app);
      }
    } else {
      db = getFirestore(app);
    }
    
    // Initialize Functions
    functions = getFunctions(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Analytics (client-side only, check if supported)
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      });
    }
    
    // Connect to emulators in development (optional)
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('🔧 Connected to Firebase Emulators');
    }
    
    console.log('✅ Firebase initialized successfully for EduPay Ledger');
  } else {
    // Get existing instances
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    storage = getStorage(app);
  }
  
  return { app, auth, db, functions, storage, analytics };
}

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// Export Firebase instances
export { app, auth, db, functions, storage, analytics };

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const { auth } = initializeFirebase();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Create a new user account
 */
export async function createUser(email: string, password: string, displayName: string): Promise<UserCredential> {
  const { auth } = initializeFirebase();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (credential.user) {
    await updateProfile(credential.user, { displayName });
  }
  return credential;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  const { auth } = initializeFirebase();
  return sendPasswordResetEmail(auth, email);
}

/**
 * Sign out the current user
 */

export async function signOutUser(): Promise<void> {
  const { auth } = initializeFirebase();
  return signOut(auth);
}

/**
 * Listen to authentication state changes
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  const { auth } = initializeFirebase();
  return auth.currentUser;
}

// ============================================================================
// PHONE AUTHENTICATION (Uganda)
// ============================================================================

/**
 * Setup reCAPTCHA verifier for phone authentication
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  const { auth } = initializeFirebase();
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
  });
}

/**
 * Sign in with phone number (Uganda format)
 * Automatically formats Uganda phone numbers with +256 country code
 */
export async function signInWithPhone(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  const { auth } = initializeFirebase();
  // Ensure phone number has Uganda country code
  const formattedPhone = formatUgandaPhone(phoneNumber);
  return signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
}

/**
 * Format phone number to Uganda international format
 */
export function formatUgandaPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code
  if (digits.startsWith('256')) {
    return `+${digits}`;
  }
  
  // Remove leading zero and add country code
  const localNumber = digits.startsWith('0') ? digits.slice(1) : digits;
  return `+256${localNumber}`;
}

// ============================================================================
// FIRESTORE DATABASE HELPERS
// ============================================================================

/**
 * Collection names for EduPay Ledger
 */
export const COLLECTIONS = {
  SCHOOLS: 'schools',
  STUDENTS: 'students',
  PAYMENTS: 'payments',
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
  FEE_STRUCTURES: 'fee_structures',
  INSTALLMENT_RULES: 'installment_rules',
  TERMS: 'terms',
  CLASSES: 'classes',
  SMS_LOGS: 'sms_logs',
  RECEIPTS: 'receipts',
  SETTINGS: 'settings',
} as const;

/**
 * Get a document reference
 */
export function getDocRef(collectionName: string, docId: string): DocumentReference {
  const { db } = initializeFirebase();
  return doc(db, collectionName, docId);
}

/**
 * Get a collection reference
 */
export function getCollectionRef(collectionName: string): CollectionReference {
  const { db } = initializeFirebase();
  return collection(db, collectionName);
}

/**
 * Fetch a single document by ID
 */
export async function fetchDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

/**
 * Fetch all documents from a collection with optional query constraints
 * Supports both spread arguments and array of constraints
 */
export async function fetchCollection<T>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = []
): Promise<T[]> {
  const { db } = initializeFirebase();
  const collectionRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 
    ? query(collectionRef, ...queryConstraints) 
    : query(collectionRef);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
}

/**
 * Create or update a document
 */
export async function saveDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T,
  merge: boolean = true
): Promise<void> {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
}

/**
 * Update specific fields in a document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a document
 */
export async function removeDocument(collectionName: string, docId: string): Promise<void> {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * Batch write multiple documents
 */
export async function batchWrite(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: Record<string, any>;
  }>
): Promise<void> {
  const { db } = initializeFirebase();
  const batch = writeBatch(db);
  
  operations.forEach(op => {
    const docRef = doc(db, op.collection, op.docId);
    switch (op.type) {
      case 'set':
        batch.set(docRef, { ...op.data, updatedAt: serverTimestamp() }, { merge: true });
        break;
      case 'update':
        batch.update(docRef, { ...op.data, updatedAt: serverTimestamp() });
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
  });
  
  await batch.commit();
}

/**
 * Run a transaction
 */
export async function runFirestoreTransaction<T>(
  transactionFn: (transaction: any) => Promise<T>
): Promise<T> {
  const { db } = initializeFirebase();
  return runTransaction(db, transactionFn);
}

/**
 * Subscribe to real-time updates on a document
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
): () => void {
  const { db } = initializeFirebase();
  const docRef = doc(db, collectionName, docId);
  
  return onSnapshot(
    docRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      else console.error('Document subscription error:', error);
    }
  );
}

/**
 * Subscribe to real-time updates on a collection
 */
export function subscribeToCollection<T>(
  collectionName: string,
  queryConstraints: QueryConstraint[],
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  const { db } = initializeFirebase();
  const collectionRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 
    ? query(collectionRef, ...queryConstraints) 
    : query(collectionRef);
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    },
    (error) => {
      if (onError) onError(error);
      else console.error('Collection subscription error:', error);
    }
  );
}

// ============================================================================
// CLOUD STORAGE HELPERS
// ============================================================================

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: Blob | File,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<string> {
  const { storage } = initializeFirebase();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  const { storage } = initializeFirebase();
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

// ============================================================================
// CLOUD FUNCTIONS HELPERS
// ============================================================================

/**
 * Call a Cloud Function
 */
export async function callFunction<T = any, R = any>(
  functionName: string,
  data?: T
): Promise<R> {
  const { functions } = initializeFirebase();
  const callable = httpsCallable<T, R>(functions, functionName);
  const result = await callable(data);
  return result.data;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log an action to the audit trail
 * @param action - The action type (CREATE, UPDATE, DELETE, etc.)
 * @param collection - The collection being modified
 * @param documentId - The ID of the document being modified
 * @param userId - The ID of the user performing the action
 * @param details - Additional details about the action
 */
export async function logAuditAction(
  action: string,
  collectionName: string,
  documentId: string,
  userId: string,
  details?: Record<string, any>
): Promise<void> {
  const { db, auth } = initializeFirebase();
  const user = auth.currentUser;
  
  const auditLog = {
    action,
    collection: collectionName,
    documentId,
    details: details || {},
    userId: userId || user?.uid || 'system',
    userEmail: user?.email || 'system',
    timestamp: serverTimestamp(),
    ipAddress: typeof window !== 'undefined' ? 'client' : 'server',
  };
  
  const logsRef = collection(db, COLLECTIONS.AUDIT_LOGS);
  await setDoc(doc(logsRef), auditLog);
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

// Re-export commonly used Firestore functions for convenience
export {
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
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
};

// Export types
export type { FirebaseUser, UserCredential, DocumentReference, CollectionReference, QueryConstraint };

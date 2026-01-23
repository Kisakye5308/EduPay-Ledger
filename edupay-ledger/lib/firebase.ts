import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
// In production, these should be environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: FirebaseStorage;

export function initializeFirebase() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Initialize Firestore with offline persistence
    if (typeof window !== 'undefined') {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } else {
      db = getFirestore(app);
    }
    
    // Initialize Functions
    functions = getFunctions(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
    storage = getStorage(app);
  }
  
  return { app, auth, db, functions, storage };
}

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// Export Firebase instances
export { app, auth, db, functions, storage };

// Auth helpers
export async function signInWithEmail(email: string, password: string) {
  const { auth } = initializeFirebase();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  const { auth } = initializeFirebase();
  return signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}

// Phone auth for Uganda numbers
export function setupRecaptcha(containerId: string) {
  const { auth } = initializeFirebase();
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  });
}

export async function signInWithPhone(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  const { auth } = initializeFirebase();
  // Ensure phone number has Uganda country code
  const formattedPhone = phoneNumber.startsWith('+256') 
    ? phoneNumber 
    : `+256${phoneNumber.replace(/^0/, '')}`;
  return signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
}

// Collection names
export const COLLECTIONS = {
  SCHOOLS: 'schools',
  STUDENTS: 'students',
  PAYMENTS: 'payments',
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
  FEE_STRUCTURES: 'fee_structures',
  INSTALLMENT_RULES: 'installment_rules',
} as const;

'use client';

/**
 * Firebase Context Provider for EduPay Ledger
 * Provides Firebase authentication state and user data throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  initializeFirebase, 
  onAuthChange, 
  signInWithEmail, 
  signOutUser,
  createUser,
  resetPassword,
  getCurrentUser,
  fetchDocument,
  saveDocument,
  COLLECTIONS
} from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

export interface EduPayUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: 'admin' | 'bursar' | 'registrar' | 'teacher' | 'viewer';
  schoolId: string;
  schoolName?: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
}

export interface AuthContextType {
  // State
  user: EduPayUser | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName: string, schoolId: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasRole: (role: EduPayUser['role'] | EduPayUser['role'][]) => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<EduPayUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase and listen to auth changes
  useEffect(() => {
    initializeFirebase();
    
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          // Fetch user profile from Firestore
          const userProfile = await fetchDocument<EduPayUser>(COLLECTIONS.USERS, fbUser.uid);
          
          if (userProfile) {
            setUser({
              ...userProfile,
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || userProfile.displayName,
              photoURL: fbUser.photoURL,
              phoneNumber: fbUser.phoneNumber,
            });
          } else {
            // User exists in Auth but not in Firestore - create basic profile
            const newUser: EduPayUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              phoneNumber: fbUser.phoneNumber,
              role: 'viewer',
              schoolId: '',
              permissions: [],
              isActive: true,
            };
            setUser(newUser);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Failed to load user profile');
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithEmail(email, password);
      
      // Update last login timestamp
      const currentUser = getCurrentUser();
      if (currentUser) {
        await saveDocument(COLLECTIONS.USERS, currentUser.uid, {
          lastLogin: new Date(),
        });
      }
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      setError('Failed to sign out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (email: string, password: string, displayName: string, schoolId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const credential = await createUser(email, password, displayName);
      
      // Create user profile in Firestore
      const newUser: Partial<EduPayUser> = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName,
        role: 'viewer', // Default role, admin will upgrade
        schoolId,
        permissions: [],
        isActive: true,
        createdAt: new Date(),
      };
      
      await saveDocument(COLLECTIONS.USERS, credential.user.uid, newUser);
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Error
  const clearError = () => setError(null);

  // Refresh User
  const refreshUser = async () => {
    if (firebaseUser) {
      const userProfile = await fetchDocument<EduPayUser>(COLLECTIONS.USERS, firebaseUser.uid);
      if (userProfile) {
        setUser({
          ...userProfile,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || userProfile.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
        });
      }
    }
  };

  // Check Permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission) || user.permissions.includes('all');
  };

  // Check Role
  const hasRole = (role: EduPayUser['role'] | EduPayUser['role'][]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    register,
    forgotPassword,
    clearError,
    refreshUser,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useFirebaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// HELPERS
// ============================================================================

function getAuthErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/operation-not-allowed': 'This sign-in method is not allowed.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  
  return errorMessages[code] || 'An error occurred. Please try again.';
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export const PERMISSIONS = {
  // Students
  STUDENTS_VIEW: 'students:view',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_EDIT: 'students:edit',
  STUDENTS_DELETE: 'students:delete',
  
  // Payments
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_RECORD: 'payments:record',
  PAYMENTS_REVERSE: 'payments:reverse',
  PAYMENTS_EXPORT: 'payments:export',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // Users
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  
  // Audit
  AUDIT_VIEW: 'audit:view',
} as const;

export const ROLE_PERMISSIONS: Record<EduPayUser['role'], string[]> = {
  admin: ['all'],
  bursar: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.PAYMENTS_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  registrar: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_CREATE,
    PERMISSIONS.STUDENTS_EDIT,
    PERMISSIONS.PAYMENTS_VIEW,
  ],
  teacher: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
  ],
  viewer: [
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

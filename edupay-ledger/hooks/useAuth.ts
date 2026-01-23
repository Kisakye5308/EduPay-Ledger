'use client';

import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, initializeFirebase, signInWithEmail, signOutUser } from '@/lib/firebase';
import { User, UserRole, ROLE_PERMISSIONS, Permission } from '@/types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            setState({
              user: { uid: firebaseUser.uid, ...userData },
              firebaseUser,
              loading: false,
              error: null,
            });
          } else {
            // User exists in Auth but not in Firestore - create basic profile
            const basicUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'staff',
              schoolId: '',
              permissions: ROLE_PERMISSIONS['staff'],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setState({
              user: basicUser,
              firebaseUser,
              loading: false,
              error: null,
            });
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          setState({
            user: null,
            firebaseUser: null,
            loading: false,
            error: error.message,
          });
        }
      } else {
        setState({
          user: null,
          firebaseUser: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signOutUser();
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  }, [state.user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!state.user) return false;
    return permissions.some(p => state.user!.permissions.includes(p));
  }, [state.user]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!state.user) return false;
    return permissions.every(p => state.user!.permissions.includes(p));
  }, [state.user]);

  return {
    user: state.user,
    firebaseUser: state.firebaseUser,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signOut,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * useAuth Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// Mock Firebase modules
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  initializeFirebase: jest.fn(),
  signInWithEmail: jest.fn(),
  signOutUser: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Initially no user
    callback(null);
    return jest.fn();
  }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
}));

import { signInWithEmail, signOutUser } from '@/lib/firebase';

const mockSignIn = signInWithEmail as jest.Mock;
const mockSignOut = signOutUser as jest.Mock;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with initial state (after auth check completes)', () => {
    const { result } = renderHook(() => useAuth());

    // After the mocked onAuthStateChanged callback runs (with null user),
    // loading should be false and user should be null
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false); // Auth check completed
    expect(result.current.error).toBeNull();
  });

  it('provides isAuthenticated computed property', () => {
    const { result } = renderHook(() => useAuth());

    // Initially not authenticated
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('provides signIn function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signIn).toBe('function');
  });

  it('provides signOut function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.signOut).toBe('function');
  });

  it('provides hasPermission function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.hasPermission).toBe('function');
  });

  it('hasPermission returns false when no user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.hasPermission('read:students')).toBe(false);
  });

  it('provides hasAnyPermission function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.hasAnyPermission).toBe('function');
  });

  it('provides hasAllPermissions function', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.hasAllPermissions).toBe('function');
  });
});

describe('useAuth - Sign In/Out Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signInWithEmail when signIn is called', async () => {
    mockSignIn.mockResolvedValueOnce({ user: { uid: 'test-123' } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn('test@school.edu', 'password123');
      } catch (e) {
        // May throw due to mock setup, but we just want to verify call
      }
    });

    expect(mockSignIn).toHaveBeenCalledWith('test@school.edu', 'password123');
  });

  it('calls signOutUser when signOut is called', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });
});

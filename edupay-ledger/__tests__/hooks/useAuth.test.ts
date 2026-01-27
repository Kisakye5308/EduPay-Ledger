/**
 * useAuth Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// Mock Firebase Auth
const mockUser = {
  uid: 'test-user-123',
  email: 'test@school.edu',
  displayName: 'Test User',
  emailVerified: true,
};

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: (...args: any[]) => mockSignIn(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (auth: any, callback: (user: any) => void) => {
    mockOnAuthStateChanged(auth, callback);
    // Initially no user
    callback(null);
    return jest.fn();
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles successful sign in', async () => {
    mockSignIn.mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@school.edu', 'password123');
    });

    expect(mockSignIn).toHaveBeenCalledWith(
      expect.anything(),
      'test@school.edu',
      'password123'
    );
  });

  it('handles sign in error', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn('wrong@email.com', 'wrongpassword');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('handles sign out', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('provides isAuthenticated computed property', () => {
    const { result } = renderHook(() => useAuth());

    // Initially not authenticated
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('useAuth - User Role Management', () => {
  it('provides user role helpers', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.isAdmin).toBe('boolean');
    expect(typeof result.current.isBursar).toBe('boolean');
    expect(typeof result.current.isTeacher).toBe('boolean');
    expect(typeof result.current.isParent).toBe('boolean');
  });

  it('defaults roles to false when no user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isBursar).toBe(false);
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.isParent).toBe(false);
  });
});

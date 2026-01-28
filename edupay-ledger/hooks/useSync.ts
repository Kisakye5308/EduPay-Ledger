/**
 * useSync Hook
 * Manages sync state and provides sync operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncState, SyncResult } from '@/lib/sync';

export function useSync(schoolId?: string) {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSyncAt: null,
    pendingChanges: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Initialize sync service and subscribe to state changes
  useEffect(() => {
    if (schoolId) {
      syncService.initialize(schoolId);
    }

    // Subscribe to sync state changes
    const unsubscribe = syncService.subscribe(setSyncState);

    // Get initial state
    syncService.getState().then(setSyncState);

    return () => {
      unsubscribe();
    };
  }, [schoolId]);

  // Manual sync trigger
  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.sync();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Full sync (forces re-download of all data)
  const fullSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.fullSync();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    table: string, 
    id: string, 
    resolution: 'local' | 'remote'
  ) => {
    if (resolution === 'local') {
      await syncService.resolveConflictKeepLocal(table, id);
    } else {
      await syncService.resolveConflictKeepRemote(table, id);
    }
    // Refresh state
    const newState = await syncService.getState();
    setSyncState(newState);
  }, []);

  return {
    ...syncState,
    isSyncing,
    lastSyncResult,
    sync,
    fullSync,
    resolveConflict,
  };
}

export default useSync;

/**
 * SyncStatusIndicator Component
 * Shows the current sync status in the UI
 */

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSync } from '@/hooks/useSync';
import { Button } from './Button';
import { Modal } from './Modal';

interface SyncStatusIndicatorProps {
  schoolId?: string;
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({ 
  schoolId, 
  className,
  showDetails = false 
}: SyncStatusIndicatorProps) {
  const { 
    status, 
    isOnline, 
    lastSyncAt, 
    pendingChanges, 
    isSyncing, 
    sync,
    lastSyncResult 
  } = useSync(schoolId);
  
  const [showModal, setShowModal] = useState(false);

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-500';
    if (isSyncing) return 'bg-yellow-500 animate-pulse';
    if (status === 'error') return 'bg-red-500';
    if (pendingChanges > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (status === 'error') return 'Sync Error';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'cloud_off';
    if (isSyncing) return 'sync';
    if (status === 'error') return 'sync_problem';
    if (pendingChanges > 0) return 'cloud_upload';
    return 'cloud_done';
  };

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Never synced';
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors',
          'text-sm',
          className
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', getStatusColor())} />
        <span className="material-symbols-outlined text-lg">{getStatusIcon()}</span>
        {showDetails && (
          <span className="text-gray-600 dark:text-gray-400">{getStatusText()}</span>
        )}
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Sync Status"
        size="sm"
      >
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className={cn(
                'w-3 h-3 rounded-full',
                isOnline ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {isOnline ? 'Connected to internet' : 'Working locally'}
            </span>
          </div>

          {/* Last Sync */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Last Sync</p>
              <p className="text-sm text-gray-500">{formatLastSync()}</p>
            </div>
            <span className="material-symbols-outlined text-gray-400">schedule</span>
          </div>

          {/* Pending Changes */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Pending Changes</p>
              <p className="text-sm text-gray-500">
                {pendingChanges === 0 
                  ? 'All changes synced' 
                  : `${pendingChanges} changes waiting to sync`}
              </p>
            </div>
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              pendingChanges === 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            )}>
              {pendingChanges}
            </span>
          </div>

          {/* Last Sync Result */}
          {lastSyncResult && (
            <div className="p-3 border rounded-lg">
              <p className="font-medium mb-2">Last Sync Result</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-green-600 font-medium">{lastSyncResult.uploaded}</p>
                  <p className="text-gray-500 text-xs">Uploaded</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-blue-600 font-medium">{lastSyncResult.downloaded}</p>
                  <p className="text-gray-500 text-xs">Downloaded</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-yellow-600 font-medium">{lastSyncResult.conflicts}</p>
                  <p className="text-gray-500 text-xs">Conflicts</p>
                </div>
              </div>
              {lastSyncResult.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                  {lastSyncResult.errors.slice(0, 3).map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sync Button */}
          <Button
            onClick={sync}
            loading={isSyncing}
            disabled={!isOnline}
            fullWidth
            icon={<span className="material-symbols-outlined">sync</span>}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>

          {!isOnline && (
            <p className="text-center text-sm text-gray-500">
              Connect to the internet to sync your data
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

export default SyncStatusIndicator;

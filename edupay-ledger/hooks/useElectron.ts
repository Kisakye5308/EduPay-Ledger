/**
 * useElectron Hook
 * Provides access to Electron APIs when running as desktop app
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  isDev: boolean;
}

export function useElectron() {
  const router = useRouter();
  const [isElectron, setIsElectron] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const isElectronEnv = typeof window !== 'undefined' && window.electronAPI !== undefined;
    setIsElectron(isElectronEnv);

    if (isElectronEnv && window.electronAPI) {
      // Get app info
      window.electronAPI.getAppInfo().then(setAppInfo);

      // Listen for menu navigation
      window.electronAPI.onNavigate((path: string) => {
        router.push(path);
      });

      // Listen for export data command
      window.electronAPI.onExportData(() => {
        // Trigger export modal/function
        window.dispatchEvent(new CustomEvent('export-data'));
      });

      // Listen for about dialog
      window.electronAPI.onShowAbout(() => {
        window.dispatchEvent(new CustomEvent('show-about'));
      });

      // Listen for updates
      window.electronAPI.onUpdateAvailable(() => {
        setUpdateAvailable(true);
      });

      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateDownloaded(true);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('navigate');
        window.electronAPI.removeAllListeners('export-data');
        window.electronAPI.removeAllListeners('show-about');
        window.electronAPI.removeAllListeners('update-available');
        window.electronAPI.removeAllListeners('update-downloaded');
      }
    };
  }, [router]);

  // Open file dialog
  const openFileDialog = useCallback(async (options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    if (!window.electronAPI) return null;

    const result = await window.electronAPI.openFileDialog({
      title: options?.title || 'Select File',
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });

    if (result.canceled) return null;
    return result.filePaths[0];
  }, []);

  // Save file dialog
  const saveFileDialog = useCallback(async (options?: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    if (!window.electronAPI) return null;

    const result = await window.electronAPI.saveFileDialog({
      title: options?.title || 'Save File',
      defaultPath: options?.defaultPath,
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
    });

    if (result.canceled) return null;
    return result.filePath;
  }, []);

  // Print receipt
  const printReceipt = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.printReceipt();
    } else {
      window.print();
    }
  }, []);

  // Get platform info
  const getPlatform = useCallback(() => {
    if (typeof window !== 'undefined' && window.platform) {
      return window.platform;
    }
    return {
      isElectron: false,
      isWindows: false,
      isMac: false,
      isLinux: false,
    };
  }, []);

  return {
    isElectron,
    appInfo,
    updateAvailable,
    updateDownloaded,
    openFileDialog,
    saveFileDialog,
    printReceipt,
    getPlatform,
  };
}

export default useElectron;

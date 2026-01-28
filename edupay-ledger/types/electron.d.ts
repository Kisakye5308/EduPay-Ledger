/**
 * Electron TypeScript declarations
 * Type definitions for the Electron API bridge
 */

export interface ElectronAPI {
  // App info
  getAppInfo: () => Promise<{
    version: string;
    platform: string;
    arch: string;
    isDev: boolean;
  }>;
  
  // Online status
  getOnlineStatus: () => Promise<boolean>;
  
  // File dialogs
  openFileDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;
  
  saveFileDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  
  // Printing
  printReceipt: () => Promise<void>;
  
  // Navigation from menu
  onNavigate: (callback: (path: string) => void) => void;
  
  // Export data
  onExportData: (callback: () => void) => void;
  
  // Show about dialog
  onShowAbout: (callback: () => void) => void;
  
  // Auto-update events
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

export interface Platform {
  isElectron: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    platform?: Platform;
  }
}

export {};

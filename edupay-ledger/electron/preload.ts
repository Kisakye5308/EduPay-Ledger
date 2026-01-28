/**
 * Electron Preload Script
 * Secure bridge between main process and renderer
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Online status
  getOnlineStatus: () => ipcRenderer.invoke('get-online-status'),
  
  // File dialogs
  openFileDialog: (options: any) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options: any) => ipcRenderer.invoke('save-file-dialog', options),
  
  // Printing
  printReceipt: () => ipcRenderer.invoke('print-receipt'),
  
  // Navigation from menu
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },
  
  // Export data
  onExportData: (callback: () => void) => {
    ipcRenderer.on('export-data', () => callback());
  },
  
  // Show about dialog
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', () => callback());
  },
  
  // Auto-update events
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', () => callback());
  },
  
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback());
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
  isElectron: true,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
});

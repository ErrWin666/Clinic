export interface UpdateAvailableInfo {
  version: string;
  releaseNotes: string | unknown;
  mandatory: boolean;
}

export interface UpdateProgressInfo {
  percent: number;
  transferred: number;
  total: number;
}

export interface UpdateReadyInfo {
  version: string;
}

export interface UpdateErrorInfo {
  message: string;
}

export interface SystemInfo {
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  os: {
    platform: string;
    arch: string;
    release: string;
    hostname: string;
    totalMemory: number;
    freeMemory: number;
  };
  appPath: string;
  userDataPath: string;
}

export interface LogEntry {
  filename: string;
  content: string;
}

export interface DataPathValidation {
  valid: boolean;
  error?: string;
  freeSpace?: number;
  totalSpace?: number;
}

export interface DataPathChangeResult {
  success: boolean;
  error?: string;
  newPath?: string;
}

export interface MigrationProgress {
  percent: number;
  message: string;
}

export interface ElectronAPI {
  // Update events
  onUpdateAvailable: (callback: (info: UpdateAvailableInfo) => void) => void;
  onUpdateProgress: (callback: (info: UpdateProgressInfo) => void) => void;
  onUpdateReady: (callback: (info: UpdateReadyInfo) => void) => void;
  onUpdateError: (callback: (info: UpdateErrorInfo) => void) => void;
  installUpdate: () => void;

  // App info
  getAppVersion: () => Promise<string>;
  getBackendPort: () => Promise<number>;

  // Backup
  createBackup: () => Promise<string | null>;
  restoreBackup: (filePath: string) => Promise<boolean>;

  // Diagnostics
  collectLogs: () => Promise<LogEntry[]>;
  getSystemInfo: () => Promise<SystemInfo>;

  // File system
  selectFolder: () => Promise<string | null>;
  openFolder: (folderPath?: string) => Promise<boolean>;

  // Data path management
  getDataPath: () => Promise<string>;
  validateDataPath: (dirPath: string) => Promise<DataPathValidation>;
  changeDataPath: (newPath: string, moveData: boolean) => Promise<DataPathChangeResult>;
  resetDataPath: () => Promise<{ success: boolean }>;
  resetDataPathAndRestart: () => void;
  onMigrationProgress: (callback: (info: MigrationProgress) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

const { contextBridge, ipcRenderer } = require("electron");

try {
  contextBridge.exposeInMainWorld("electronAPI", {
  // Update events
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", (_, info) => callback(info)),
  onUpdateProgress: (callback) => ipcRenderer.on("update-progress", (_, info) => callback(info)),
  onUpdateReady: (callback) => ipcRenderer.on("update-ready", (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on("update-error", (_, info) => callback(info)),
  installUpdate: () => ipcRenderer.send("install-update"),

  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getBackendPort: () => ipcRenderer.invoke("get-backend-port"),

  // Backup
  createBackup: () => ipcRenderer.invoke("create-backup"),
  restoreBackup: (filePath) => ipcRenderer.invoke("restore-backup", filePath),

  // Diagnostics
  collectLogs: () => ipcRenderer.invoke("collect-logs"),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),

  // File system
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  openFolder: (folderPath) => ipcRenderer.invoke("open-folder", folderPath),

  // Data path management
  getDataPath: () => ipcRenderer.invoke("get-data-path"),
  validateDataPath: (dirPath) => ipcRenderer.invoke("validate-data-path", dirPath),
  changeDataPath: (newPath, moveData) => ipcRenderer.invoke("change-data-path", newPath, moveData),
  resetDataPath: () => ipcRenderer.invoke("reset-data-path"),
  resetDataPathAndRestart: () => ipcRenderer.send("reset-data-path-and-restart"),
  onMigrationProgress: (callback) => ipcRenderer.on("migration-progress", (_, info) => callback(info)),
  });
  console.log("[preload] electronAPI exposed successfully");
} catch (err) {
  console.error("[preload] Failed to expose electronAPI:", err);
}

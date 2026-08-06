const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");
const crypto = require("crypto");
const log = require("electron-log");
const { startBackend, stopBackend, getBackendPort } = require("./backend-manager");
const { backupDatabase, restoreBackup, getLatestBackup } = require("./backup");
const { checkForUpdates, installUpdate } = require("./updater");
const { getSystemInfo } = require("./system-info");
const { validateDataPath, checkDiskSpace } = require("./data-path-utils");
const { migrateData, cleanupOldData } = require("./data-migrator");

let mainWindow = null;
let splashWindow = null;
let errorWindow = null;
let backendProcess = null;
let appIsQuitting = false;
let currentBackendEnv = null;

// --- Data path resolution ---
function getDataPathFilePath() {
  return app.isPackaged
    ? path.join(path.dirname(process.execPath), "data-path.json")
    : path.join(__dirname, "data-path.json");
}

function resolveDataPath() {
  const filePath = getDataPathFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (content.dataPath && fs.existsSync(content.dataPath)) {
        log.info(`Using custom data path: ${content.dataPath}`);
        return content.dataPath;
      }
      log.warn(`Custom data path in ${filePath} is missing or invalid: ${content.dataPath}`);
    } catch (err) {
      log.error(`Failed to read data-path.json: ${err.message}`);
    }
  }
  return app.getPath("userData");
}

function writeDataPath(newPath) {
  const filePath = getDataPathFilePath();
  fs.writeFileSync(filePath, JSON.stringify({ dataPath: newPath }, null, 2), "utf8");
  log.info(`Data path updated to: ${newPath}`);
}

function clearDataPath() {
  const filePath = getDataPathFilePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    log.info("Data path cleared, reverting to default");
  }
}

function getDataPath() {
  return app.getPath("userData");
}

// Configure electron-log to write in userData/logs
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("userData"), "logs", `app-${new Date().toISOString().split("T")[0]}.log`);
log.transports.file.level = "info";
log.transports.console.level = "error";

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(bootSequence);
}

async function bootSequence() {
  // Resolve custom data path before anything else
  const customDataPath = resolveDataPath();
  if (customDataPath !== app.getPath("userData")) {
    if (!fs.existsSync(customDataPath)) {
      log.error(`Custom data path not found: ${customDataPath}`);
      showErrorScreen(`Data directory not found at ${customDataPath}. Please reconnect the drive or click 'Reset to Default'.`, true);
      return;
    }
    app.setPath("userData", customDataPath);
  }

  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "database.sqlite");
  const uploadsDir = path.join(userDataPath, "uploads");
  const backupsDir = path.join(userDataPath, "backups");
  const logsDir = path.join(userDataPath, "logs");

  // Ensure directories exist
  for (const dir of [uploadsDir, backupsDir, logsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Show splash screen
  splashWindow = createSplashScreen();

  try {
    // 1. Backup database before migrations (if DB exists)
    if (fs.existsSync(dbPath)) {
      log.info("Backing up database before migrations...");
      await backupDatabase(dbPath, backupsDir);
    }

    // 2. Run migrations with rollback on failure
    await runMigrationsWithRollback(dbPath, backupsDir);

    // 3. Start backend
    const frontendDistPath = path.join(__dirname, "frontend", "dist");
    const backendEnv = {
      DB_STORAGE: dbPath,
      UPLOAD_DIR: uploadsDir,
      BACKUP_DIR: backupsDir,
      LOG_DIR: logsDir,
      NODE_ENV: "production",
      ELECTRON_APP: "true",
      DB_MIGRATE: "auto",
      JWT_SECRET: crypto.randomBytes(48).toString("hex"),
      JWT_REFRESH_SECRET: crypto.randomBytes(48).toString("hex"),
      SCHEDULER_ENABLED: "true",
      FRONTEND_DIST: frontendDistPath,
    };

    currentBackendEnv = backendEnv;
    backendProcess = await startBackend(backendEnv, __dirname);
    const port = getBackendPort();

    // 4. Wait for server health
    await waitForServerHealth(port, 30000);

    // 5. Create main window
    mainWindow = createMainWindow(port);

    // 6. Close splash
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }

    // 7. Check for updates
    checkForUpdates(mainWindow);

  } catch (err) {
    log.error("Boot sequence failed:", err.message);
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    showErrorScreen(err.message);
  }
}

async function runMigrationsWithRollback(dbPath, backupsDir) {
  try {
    // In packaged app, backend/node_modules are in extraResources
    if (app.isPackaged) {
      const extraNM = path.join(process.resourcesPath, "backend", "node_modules");
      if (fs.existsSync(extraNM)) {
        const currentNodePath = process.env.NODE_PATH || "";
        process.env.NODE_PATH = currentNodePath
          ? `${currentNodePath}${path.delimiter}${extraNM}`
          : extraNM;
        require("module").Module._initPaths();
      }
    }
    const { runMigrations } = require("./backend/src/database/migrator");
    await runMigrations();
    log.info("Migrations completed successfully");
  } catch (err) {
    log.error("Migration failed, attempting rollback:", err.message);

    const latestBackup = getLatestBackup(backupsDir);
    if (latestBackup && fs.existsSync(dbPath)) {
      log.info(`Restoring database from backup: ${latestBackup}`);
      restoreBackup(latestBackup, dbPath);
    }

    throw new Error(`Database migration failed: ${err.message}`);
  }
}

function createSplashScreen() {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: true,
  });
  splash.loadFile(path.join(__dirname, "splash.html"));
  return splash;
}

function createMainWindow(backendPort) {
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Clinic Eye",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: true,
      spellcheck: false,
      devTools: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadURL(`http://127.0.0.1:${backendPort}/`);
  }

  // Strip Origin header from all outgoing requests to prevent CORS issues with file:// protocol
  win.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ["http://*/*", "https://*/*"] },
    (details, callback) => {
      delete details.requestHeaders.Origin;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  win.webContents.on("did-finish-load", () => {
    // Inject backend port into renderer
    win.webContents.send("backend-port", backendPort);
    win.show();
    win.focus();
  });

  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}

function showErrorScreen(message, showResetButton = false) {
  errorWindow = new BrowserWindow({
    width: 500,
    height: 380,
    frame: true,
    resizable: false,
    center: true,
    title: "Error",
    show: true,
  });

  errorWindow.loadFile(path.join(__dirname, "error-screen.html"));

  errorWindow.webContents.on("did-finish-load", () => {
    errorWindow.webContents.send("error-details", message);
    if (showResetButton) {
      errorWindow.webContents.send("show-reset-button");
    }
  });

  errorWindow.on("closed", () => {
    errorWindow = null;
  });
}

function waitForServerHealth(port, timeout) {
  const http = require("http");
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - startTime > timeout) {
        reject(new Error("Backend server did not start within timeout"));
        return;
      }

      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      });

      req.on("error", () => {
        setTimeout(check, 500);
      });

      req.setTimeout(3000, () => {
        req.destroy();
        setTimeout(check, 500);
      });
    }

    check();
  });
}

// IPC Handlers
ipcMain.handle("get-backend-port", () => getBackendPort());

ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("create-backup", async () => {
  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "database.sqlite");
  const backupsDir = path.join(userDataPath, "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  return backupDatabase(dbPath, backupsDir);
});

ipcMain.handle("restore-backup", async (event, filePath) => {
  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "database.sqlite");
  return restoreBackup(filePath, dbPath);
});

ipcMain.handle("collect-logs", async () => {
  const logsDir = path.join(app.getPath("userData"), "logs");
  if (!fs.existsSync(logsDir)) return [];
  const files = fs.readdirSync(logsDir).filter(f => f.endsWith(".log"));
  const logs = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(logsDir, file), "utf8");
    logs.push({ filename: file, content });
  }
  return logs;
});

ipcMain.handle("get-system-info", () => getSystemInfo());

ipcMain.on("install-update", () => {
  installUpdate();
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("open-folder", async (event, folderPath) => {
  const userDataPath = app.getPath("userData");
  const targetPath = folderPath || userDataPath;
  if (fs.existsSync(targetPath)) {
    shell.openPath(targetPath);
    return true;
  }
  return false;
});

// --- Data path IPC handlers ---
ipcMain.handle("get-data-path", () => {
  return getDataPath();
});

ipcMain.handle("validate-data-path", async (event, dirPath) => {
  return validateDataPath(dirPath);
});

ipcMain.handle("change-data-path", async (event, newPath, moveData) => {
  const currentPath = app.getPath("userData");

  if (moveData) {
    // Stop backend before migration
    log.info("Stopping backend for data migration...");
    stopBackend();

    const result = await migrateData(currentPath, newPath, {
      onProgress: (percent, msg) => {
        if (mainWindow) {
          mainWindow.webContents.send("migration-progress", { percent, message: msg });
        }
      },
    });

    if (!result.success) {
      // Restart backend with old config
      log.error("Migration failed, restarting backend with old config");
      if (currentBackendEnv) {
        backendProcess = await startBackend(currentBackendEnv, __dirname);
        await waitForServerHealth(getBackendPort(), 30000);
      }
      return result;
    }

    // Update pointer
    writeDataPath(result.newPath);

    // Restart backend with new path
    app.setPath("userData", result.newPath);
    const newUserDataPath = app.getPath("userData");
    const newBackendEnv = {
      ...currentBackendEnv,
      DB_STORAGE: path.join(newUserDataPath, "database.sqlite"),
      UPLOAD_DIR: path.join(newUserDataPath, "uploads"),
      BACKUP_DIR: path.join(newUserDataPath, "backups"),
      LOG_DIR: path.join(newUserDataPath, "logs"),
    };
    currentBackendEnv = newBackendEnv;
    backendProcess = await startBackend(newBackendEnv, __dirname);
    await waitForServerHealth(getBackendPort(), 30000);

    // Clean up old data
    try {
      cleanupOldData(currentPath);
    } catch (err) {
      log.warn(`Failed to clean up old data: ${err.message}`);
    }

    return { success: true, newPath: result.newPath };
  } else {
    // Just update pointer without moving data
    writeDataPath(newPath);
    return { success: true, newPath };
  }
});

ipcMain.handle("reset-data-path", async () => {
  clearDataPath();
  return { success: true };
});

ipcMain.on("reset-data-path-and-restart", () => {
  clearDataPath();
  app.relaunch();
  app.exit(0);
});

// Graceful shutdown
app.on("window-all-closed", () => {
  appIsQuitting = true;
  stopBackend();
  app.quit();
});

app.on("before-quit", () => {
  appIsQuitting = true;
  stopBackend();
});

app.on("activate", () => {
  if (mainWindow === null && !errorWindow) {
    bootSequence();
  }
});

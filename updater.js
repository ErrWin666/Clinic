const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let isInitialized = false;
let mainWindowRef = null;
let updateCheckInFlight = false;

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

function initUpdater(mainWindow) {
  if (isInitialized) return;
  isInitialized = true;
  mainWindowRef = mainWindow;

  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "info";

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Public repo — no token needed, electron-updater reads from electron-builder.yml
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "ErrWin666",
    repo: "Clinic",
  });

  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info(`Update available: ${info.version}`);
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send("update-available", {
        version: info.version,
        releaseNotes: info.releaseNotes,
        mandatory: info.mandatory || false,
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    log.info("App is up to date.");
  });

  autoUpdater.on("download-progress", (progress) => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send("update-progress", {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
      });
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info(`Update downloaded: ${info.version}`);
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send("update-ready", {
        version: info.version,
      });
    }
  });

  autoUpdater.on("error", (err) => {
    log.error("Update error:", err.message);
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send("update-error", {
        message: err.message,
      });
    }
  });
}

function checkForUpdates(mainWindow) {
  try {
    initUpdater(mainWindow);
    if (updateCheckInFlight) return;
    updateCheckInFlight = true;
    autoUpdater.checkForUpdatesAndNotify().finally(() => {
      updateCheckInFlight = false;
    });

    setInterval(() => {
      if (updateCheckInFlight) return;
      updateCheckInFlight = true;
      autoUpdater.checkForUpdatesAndNotify().finally(() => {
        updateCheckInFlight = false;
      });
    }, CHECK_INTERVAL_MS);
  } catch (err) {
    log.error("Failed to check for updates:", err.message);
  }
}

function installUpdate() {
  autoUpdater.quitAndInstall();
}

module.exports = { checkForUpdates, installUpdate };

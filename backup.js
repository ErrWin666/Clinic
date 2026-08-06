const fs = require("fs");
const path = require("path");
const log = require("electron-log");

const MAX_BACKUPS = 7;

function backupDatabase(dbPath, backupDir) {
  if (!fs.existsSync(dbPath)) {
    log.warn("Database file does not exist, skipping backup");
    return null;
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `database-${timestamp}.sqlite`);

  // Copy the main database file
  fs.copyFileSync(dbPath, backupPath);

  // Also copy WAL and SHM files if they exist (SQLite WAL mode)
  const walPath = dbPath + "-wal";
  const shmPath = dbPath + "-shm";
  if (fs.existsSync(walPath)) {
    fs.copyFileSync(walPath, backupPath + "-wal");
  }
  if (fs.existsSync(shmPath)) {
    fs.copyFileSync(shmPath, backupPath + "-shm");
  }

  log.info(`Database backed up to: ${backupPath}`);

  // Prune old backups
  pruneBackups(backupDir);

  return backupPath;
}

function pruneBackups(backupDir) {
  if (!fs.existsSync(backupDir)) return;

  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith("database-") && f.endsWith(".sqlite"))
    .sort()
    .reverse();

  if (backups.length > MAX_BACKUPS) {
    for (const oldBackup of backups.slice(MAX_BACKUPS)) {
      const oldPath = path.join(backupDir, oldBackup);
      fs.unlinkSync(oldPath);
      // Also remove associated WAL/SHM files
      const oldWal = oldPath + "-wal";
      const oldShm = oldPath + "-shm";
      if (fs.existsSync(oldWal)) fs.unlinkSync(oldWal);
      if (fs.existsSync(oldShm)) fs.unlinkSync(oldShm);
      log.info(`Pruned old backup: ${oldBackup}`);
    }
  }
}

function getLatestBackup(backupDir) {
  if (!fs.existsSync(backupDir)) return null;

  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith("database-") && f.endsWith(".sqlite"))
    .sort()
    .reverse();

  if (backups.length === 0) return null;
  return path.join(backupDir, backups[0]);
}

function restoreBackup(backupPath, dbPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  // Remove existing WAL/SHM files before restore
  const walPath = dbPath + "-wal";
  const shmPath = dbPath + "-shm";
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  fs.copyFileSync(backupPath, dbPath);

  // Restore WAL/SHM if they exist in backup
  const backupWal = backupPath + "-wal";
  const backupShm = backupPath + "-shm";
  if (fs.existsSync(backupWal)) {
    fs.copyFileSync(backupWal, walPath);
  }
  if (fs.existsSync(backupShm)) {
    fs.copyFileSync(backupShm, shmPath);
  }

  log.info(`Database restored from: ${backupPath}`);
  return true;
}

module.exports = { backupDatabase, restoreBackup, getLatestBackup, pruneBackups };

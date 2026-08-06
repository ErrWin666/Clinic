const BaseService = require("./BaseService");
const BaseRepository = require("../repositories/BaseRepository");
const SettingsService = require("./SettingsService");
const { Backup } = require("../models");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const config = require("../config");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { sequelize } = require("../database");

function isInside(root, target) {
  const rel = path.relative(root, target);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function extractSafely(zip, extractDir) {
  for (const entry of zip.getEntries()) {
    const target = path.resolve(extractDir, entry.entryName);
    if (!isInside(extractDir, target)) {
      throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
    }
    if (entry.isDirectory) {
      fs.mkdirSync(target, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, entry.getData());
  }
}

function sanitizeBackupFilename(filename) {
  const cleaned = path.basename(filename).replace(/[\\/]/g, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
  }
  return cleaned;
}

class BackupService extends BaseService {
  constructor() {
    super(new BaseRepository(Backup));
  }

  async createBackup(type = "manual") {
    return this.executeOperation(async () => {
      const backupDir = path.resolve(config.backup.dir);
      fs.mkdirSync(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${timestamp}.zip`;
      const backupPath = path.resolve(backupDir, filename);

      const output = fs.createWriteStream(backupPath);
      const zlibLevel = process.env.NODE_ENV === "test" ? 1 : 9;
      const archive = archiver("zip", { zlib: { level: zlibLevel } });

      // Force a WAL checkpoint before archiving so the SQLite file is not a
      // torn read. This must happen before the Promise starts.
      let dbPath = null;
      if (config.database.dialect === "sqlite") {
        try {
          await sequelize.query("PRAGMA wal_checkpoint(TRUNCATE)");
        } catch {
          // Non-WAL databases (journal_mode=DELETE) ignore this pragma.
        }
        dbPath = path.resolve(config.database.storage);
        if (!fs.existsSync(dbPath)) dbPath = null;
      } else {
        logger.warn("Database backup for non-SQLite dialects must be performed externally (e.g. pg_dump)");
      }

      return new Promise((resolve, reject) => {
        output.on("close", async () => {
          const fileSize = archive.pointer();
          const record = await this.repository.create({
            filename,
            fileSize,
            type,
            status: "success",
          });
          resolve(record);
        });

        archive.on("error", async (err) => {
          const record = await this.repository.create({
            filename,
            fileSize: 0,
            type,
            status: "failed",
          });
          reject(err);
        });

        archive.pipe(output);

        if (dbPath) {
          archive.file(dbPath, { name: "database.sqlite" });
        }

        const uploadsDir = path.resolve(config.upload.dir);
        if (fs.existsSync(uploadsDir)) {
          archive.directory(uploadsDir, "uploads");
        }

        archive.finalize();
      });
    }, MESSAGES.BACKUP.CREATED, "BACKUP_CREATE_ERROR");
  }

  async restoreBackup(filename) {
    return this.executeOperation(async () => {
      const safeFilename = sanitizeBackupFilename(filename);
      const backupPath = path.resolve(config.backup.dir, safeFilename);
      const backupRoot = path.resolve(config.backup.dir);
      if (!backupPath.startsWith(backupRoot)) {
        throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
      }
      if (!fs.existsSync(backupPath)) {
        throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
      }

      await this.createBackup("restore");

      const extractDir = path.resolve(config.backup.dir, "temp-restore");
      fs.mkdirSync(extractDir, { recursive: true });

      const unzipper = require("adm-zip");
      const zip = new unzipper(backupPath);
      extractSafely(zip, extractDir);

      const dbPath = path.resolve(config.database.storage);
      const restoredDb = path.resolve(extractDir, "database.sqlite");
      if (fs.existsSync(restoredDb)) {
        fs.copyFileSync(restoredDb, dbPath);
      }

      const restoredUploads = path.resolve(extractDir, "uploads");
      const uploadsDir = path.resolve(config.upload.dir);
      if (fs.existsSync(restoredUploads)) {
        // Stage the new uploads next to the target, then swap atomically so a
        // failure never leaves the clinic without its attachments.
        const stagingDir = `${uploadsDir}.new-${Date.now()}`;
        const previousDir = `${uploadsDir}.bak-${Date.now()}`;
        fs.cpSync(restoredUploads, stagingDir, { recursive: true });
        const hadPrevious = fs.existsSync(uploadsDir);
        try {
          if (hadPrevious) fs.renameSync(uploadsDir, previousDir);
          fs.renameSync(stagingDir, uploadsDir);
        } catch (error) {
          // Windows EPERM: rename fails if a file handle is still open.
          // Fall back to non-atomic copy + cleanup.
          if (hadPrevious && !fs.existsSync(uploadsDir) && fs.existsSync(previousDir)) {
            fs.renameSync(previousDir, uploadsDir);
          }
          if (error.code === "EPERM" || error.code === "EACCES" || error.code === "EBUSY") {
            // Replace contents in-place instead of swapping directories
            if (hadPrevious) {
              fs.rmSync(uploadsDir, { recursive: true, force: true });
            }
            fs.cpSync(stagingDir, uploadsDir, { recursive: true });
            fs.rmSync(stagingDir, { recursive: true, force: true });
          } else {
            fs.rmSync(stagingDir, { recursive: true, force: true });
            throw error;
          }
        }
        if (hadPrevious && fs.existsSync(previousDir)) {
          fs.rmSync(previousDir, { recursive: true, force: true });
        }
      }

      fs.rmSync(extractDir, { recursive: true, force: true });

      return this.repository.create({
        filename: safeFilename,
        fileSize: fs.statSync(backupPath).size,
        type: "restore",
        status: "success",
      });
    }, MESSAGES.BACKUP.RESTORED, "BACKUP_RESTORE_ERROR");
  }

  async getHistory() {
    return this.executeOperation(async () => {
      return this.repository.findAll({ order: [["createdAt", "DESC"]] });
    }, MESSAGES.BACKUP.RETRIEVED, "BACKUP_HISTORY_ERROR");
  }

  async downloadBackup(filename) {
    return this.executeOperation(async () => {
      const safeFilename = sanitizeBackupFilename(filename);
      const backupPath = path.resolve(config.backup.dir, safeFilename);
      const backupRoot = path.resolve(config.backup.dir);
      if (!backupPath.startsWith(backupRoot)) {
        throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
      }
      if (!fs.existsSync(backupPath)) {
        throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
      }
      return backupPath;
    }, MESSAGES.BACKUP.RETRIEVED, "BACKUP_DOWNLOAD_ERROR");
  }

  async getSchedule() {
    const settingsService = new SettingsService();
    return settingsService.getBackupSchedule();
  }
}

module.exports = BackupService;
module.exports.extractSafely = extractSafely;
module.exports.sanitizeBackupFilename = sanitizeBackupFilename;

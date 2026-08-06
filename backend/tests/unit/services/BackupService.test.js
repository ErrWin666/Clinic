const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const CustomError = require("../../../src/utils/CustomError");
const { Backup } = require("../../../src/models");
const fs = require("fs");
const path = require("path");
const config = require("../../../src/config");

jest.mock("archiver", () => {
  const realArchiver = jest.requireActual("archiver");
  const mockFn = jest.fn((...args) => realArchiver(...args));
  mockFn.create = realArchiver.create;
  mockFn.registerFormat = realArchiver.registerFormat;
  mockFn.isRegisteredFormat = realArchiver.isRegisteredFormat;
  return mockFn;
});

const BackupService = require("../../../src/services/BackupService");
const archiver = require("archiver");

describe("BackupService", () => {
  let backupService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    backupService = new BackupService();
  });

  afterAll(async () => {
    await teardownTestDB();
    const backupDir = path.resolve(config.backup.dir);
    if (fs.existsSync(backupDir)) {
      try {
        fs.rmSync(backupDir, { recursive: true, force: true });
      } catch {
        // Windows can throw EBUSY if a file handle is still closing; retry once.
        try { fs.rmSync(backupDir, { recursive: true, force: true }); } catch {}
      }
    }
  });

  describe("createBackup", () => {
    it("should create a backup zip file and record with status success", async () => {
      const record = await backupService.createBackup("manual");

      expect(record).toBeDefined();
      expect(record.filename).toContain("backup-");
      expect(record.filename).toContain(".zip");
      expect(record.status).toBe("success");
      expect(record.fileSize).toBeGreaterThan(0);
      expect(record.type).toBe("manual");

      const backupPath = path.resolve(config.backup.dir, record.filename);
      expect(fs.existsSync(backupPath)).toBe(true);
    });
  });

  describe("getHistory", () => {
    it("should return backup history ordered by createdAt DESC", async () => {
      const history = await backupService.getHistory();
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      for (let i = 0; i < history.length - 1; i++) {
        expect(new Date(history[i].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(history[i + 1].createdAt).getTime()
        );
      }
    });
  });

  describe("downloadBackup", () => {
    it("should return path for existing backup", async () => {
      const record = await backupService.createBackup("manual");
      const backupPath = await backupService.downloadBackup(record.filename);
      expect(backupPath).toBeDefined();
      expect(fs.existsSync(backupPath)).toBe(true);
    });

    it("should throw 404 for non-existent backup file", async () => {
      await expect(backupService.downloadBackup("nonexistent.zip")).rejects.toThrow(CustomError);
      try {
        await backupService.downloadBackup("nonexistent.zip");
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("restoreBackup", () => {
    it("should throw 404 for non-existent backup", async () => {
      await expect(backupService.restoreBackup("nonexistent.zip")).rejects.toThrow(CustomError);
      try {
        await backupService.restoreBackup("nonexistent.zip");
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });

    it("should restore from existing backup and create restore-point record", async () => {
      const record = await backupService.createBackup("manual");
      const result = await backupService.restoreBackup(record.filename);

      expect(result).toBeDefined();
      expect(result.type).toBe("restore");
      expect(result.status).toBe("success");
    });

    it("should keep uploads intact when the archive has no uploads directory", async () => {
      const uploadsDir = path.resolve(config.upload.dir);
      fs.mkdirSync(uploadsDir, { recursive: true });
      const marker = path.join(uploadsDir, "restore-marker.txt");
      fs.writeFileSync(marker, "keep-me");

      const record = await backupService.createBackup("manual");
      await backupService.restoreBackup(record.filename);

      expect(fs.existsSync(marker)).toBe(true);
      expect(fs.readFileSync(marker, "utf8")).toBe("keep-me");
      fs.rmSync(marker, { force: true });
    });
  });

  describe("extractSafely (zip-slip guard)", () => {
    const { extractSafely } = BackupService;
    let extractDir;

    beforeEach(() => {
      extractDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "clinic-extract-"));
    });

    afterEach(() => {
      fs.rmSync(extractDir, { recursive: true, force: true });
    });

    const entry = (entryName, data, isDirectory = false) => ({
      entryName,
      isDirectory,
      getData: () => Buffer.from(data || ""),
    });

    it("writes normal entries inside the extract directory", () => {
      extractSafely({ getEntries: () => [entry("uploads/a.txt", "hello")] }, extractDir);
      expect(fs.readFileSync(path.join(extractDir, "uploads", "a.txt"), "utf8")).toBe("hello");
    });

    it("creates directory entries", () => {
      extractSafely({ getEntries: () => [entry("uploads/", null, true)] }, extractDir);
      expect(fs.existsSync(path.join(extractDir, "uploads"))).toBe(true);
    });

    it("throws on a relative path-traversal entry", () => {
      const zip = { getEntries: () => [entry("../../pwned.txt", "owned")] };
      expect(() => extractSafely(zip, extractDir)).toThrow(CustomError);
      expect(fs.existsSync(path.resolve(extractDir, "..", "..", "pwned.txt"))).toBe(false);
    });

    it("throws on a nested traversal entry", () => {
      const zip = { getEntries: () => [entry("uploads/../../pwned.txt", "owned")] };
      expect(() => extractSafely(zip, extractDir)).toThrow(CustomError);
    });

    it("throws on an absolute path entry", () => {
      const absolute = path.join(require("os").tmpdir(), "clinic-abs-slip.txt");
      const zip = { getEntries: () => [entry(absolute, "owned")] };
      expect(() => extractSafely(zip, extractDir)).toThrow(CustomError);
      expect(fs.existsSync(absolute)).toBe(false);
    });
  });

  describe("sanitizeBackupFilename", () => {
    const { sanitizeBackupFilename } = BackupService;

    it("should reject empty filename", () => {
      expect(() => sanitizeBackupFilename("")).toThrow(CustomError);
    });

    it("should reject dot filename", () => {
      expect(() => sanitizeBackupFilename(".")).toThrow(CustomError);
    });

    it("should reject double-dot filename", () => {
      expect(() => sanitizeBackupFilename("..")).toThrow(CustomError);
    });

    it("should strip path separators from filename", () => {
      const result = sanitizeBackupFilename("path/to/file.zip");
      expect(result).toBe("file.zip");
    });

    it("should accept a normal filename", () => {
      const result = sanitizeBackupFilename("backup-2026-01-01.zip");
      expect(result).toBe("backup-2026-01-01.zip");
    });
  });

  describe("downloadBackup - path traversal", () => {
    it("should reject path traversal attempts", async () => {
      await expect(backupService.downloadBackup("../../etc/passwd")).rejects.toThrow(CustomError);
    });

    it("should reject absolute paths", async () => {
      await expect(backupService.downloadBackup("C:\\Windows\\system32")).rejects.toThrow(CustomError);
    });
  });

  describe("restoreBackup - path traversal", () => {
    it("should reject path traversal attempts", async () => {
      await expect(backupService.restoreBackup("../../etc/passwd")).rejects.toThrow(CustomError);
    });
  });

  describe("getSchedule", () => {
    it("should return backup schedule settings", async () => {
      const schedule = await backupService.getSchedule();
      expect(schedule).toBeDefined();
    });
  });

  describe("createBackup - archive error", () => {
    it("should record failed backup on archive error", async () => {
      archiver.mockImplementationOnce(() => {
        const mockArchive = {
          on: jest.fn((event, cb) => {
            if (event === "error") {
              setTimeout(() => cb(new Error("Archive failed")), 10);
            }
          }),
          pipe: jest.fn(),
          file: jest.fn(),
          directory: jest.fn(),
          finalize: jest.fn(),
          pointer: jest.fn(() => 0),
        };
        return mockArchive;
      });

      const originalCreateWriteStream = fs.createWriteStream;
      fs.createWriteStream = jest.fn(() => ({
        on: jest.fn(),
      }));

      try {
        await expect(backupService.createBackup("manual")).rejects.toThrow();
      } finally {
        fs.createWriteStream = originalCreateWriteStream;
      }
    });
  });

  describe("restoreBackup - path traversal absolute", () => {
    it("should reject absolute paths", async () => {
      await expect(backupService.restoreBackup("C:\\Windows\\system32")).rejects.toThrow(CustomError);
    });
  });

  describe("getHistory - error", () => {
    it("should handle errors gracefully", async () => {
      jest.spyOn(backupService.repository, "findAll").mockRejectedValueOnce(new Error("DB error"));
      await expect(backupService.getHistory()).rejects.toThrow();
    });
  });

  describe("downloadBackup - error", () => {
    it("should handle errors gracefully", async () => {
      // Valid filename but the service should still handle unexpected errors
      const record = await backupService.createBackup("manual");
      const originalExists = fs.existsSync;
      fs.existsSync = jest.fn(() => {
        throw new Error("Unexpected");
      });
      try {
        await expect(backupService.downloadBackup(record.filename)).rejects.toThrow();
      } finally {
        fs.existsSync = originalExists;
      }
    });
  });

  describe("restoreBackup - EPERM fallback", () => {
    it("should fall back to non-atomic copy on EPERM", async () => {
      const record = await backupService.createBackup("manual");
      const uploadsDir = path.resolve(config.upload.dir);
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, "test.txt"), "test");

      const originalRenameSync = fs.renameSync;
      let callCount = 0;
      fs.renameSync = jest.fn((src, dest) => {
        callCount++;
        if (callCount === 1) {
          const err = new Error("EPERM");
          err.code = "EPERM";
          throw err;
        }
        return originalRenameSync.call(fs, src, dest);
      });

      try {
        const result = await backupService.restoreBackup(record.filename);
        expect(result).toBeDefined();
        expect(result.status).toBe("success");
      } finally {
        fs.renameSync = originalRenameSync;
      }
    });

    it("should rethrow non-EPERM errors", async () => {
      const record = await backupService.createBackup("manual");
      const uploadsDir = path.resolve(config.upload.dir);
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, "test2.txt"), "test2");

      const originalRenameSync = fs.renameSync;
      fs.renameSync = jest.fn(() => {
        const err = new Error("Unknown error");
        err.code = "UNKNOWN";
        throw err;
      });

      try {
        await expect(backupService.restoreBackup(record.filename)).rejects.toThrow();
      } finally {
        fs.renameSync = originalRenameSync;
      }
    });

    it("should restore previousDir when second rename fails with EPERM", async () => {
      const record = await backupService.createBackup("manual");
      const uploadsDir = path.resolve(config.upload.dir);
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, "test3.txt"), "test3");

      const originalRenameSync = fs.renameSync;
      let callCount = 0;
      fs.renameSync = jest.fn((src, dest) => {
        callCount++;
        if (callCount === 1) {
          // First rename (uploadsDir -> previousDir) succeeds
          return originalRenameSync.call(fs, src, dest);
        }
        if (callCount === 2) {
          // Second rename (stagingDir -> uploadsDir) fails with EPERM
          const err = new Error("EPERM");
          err.code = "EPERM";
          throw err;
        }
        // Subsequent renames (restore previousDir) succeed
        return originalRenameSync.call(fs, src, dest);
      });

      try {
        const result = await backupService.restoreBackup(record.filename);
        expect(result).toBeDefined();
        expect(result.status).toBe("success");
      } finally {
        fs.renameSync = originalRenameSync;
      }
    });
  });

  describe("restoreBackup - database restore", () => {
    it("should copy restored database file when present in backup", async () => {
      // Temporarily point storage to a real file so dbPath is included
      const originalStorage = config.database.storage;
      const tmpDb = path.resolve(config.backup.dir, "test-db.sqlite");
      fs.writeFileSync(tmpDb, "fake db content");
      config.database.storage = tmpDb;
      try {
        const record = await backupService.createBackup("manual");
        const result = await backupService.restoreBackup(record.filename);
        expect(result).toBeDefined();
        expect(result.status).toBe("success");
      } finally {
        config.database.storage = originalStorage;
      }
    });
  });

  describe("downloadBackup - path traversal (bypass sanitize)", () => {
    it("should reject paths outside backup dir even if sanitize is bypassed", async () => {
      const pathResolveSpy = jest.spyOn(path, "resolve");
      // First call: backupDir resolution (normal)
      pathResolveSpy.mockReturnValueOnce(path.resolve(config.backup.dir));
      // Second call: backupPath resolution returns outside dir
      pathResolveSpy.mockReturnValueOnce("C:\\etc\\passwd");
      // Third call: backupRoot resolution (normal)
      pathResolveSpy.mockReturnValueOnce(path.resolve(config.backup.dir));
      try {
        await expect(backupService.downloadBackup("test.zip")).rejects.toThrow(CustomError);
      } finally {
        pathResolveSpy.mockRestore();
      }
    });
  });

  describe("restoreBackup - path traversal (bypass sanitize)", () => {
    it("should reject paths outside backup dir even if sanitize is bypassed", async () => {
      const pathResolveSpy = jest.spyOn(path, "resolve");
      // First call: backupDir (normal)
      pathResolveSpy.mockReturnValueOnce(path.resolve(config.backup.dir));
      // Second call: backupPath returns outside
      pathResolveSpy.mockReturnValueOnce("C:\\etc\\passwd");
      // Third call: backupRoot (normal)
      pathResolveSpy.mockReturnValueOnce(path.resolve(config.backup.dir));
      try {
        await expect(backupService.restoreBackup("test.zip")).rejects.toThrow(CustomError);
      } finally {
        pathResolveSpy.mockRestore();
      }
    });
  });

  describe("createBackup - dbPath exists", () => {
    it("should include database file in backup when dbPath exists", async () => {
      // Temporarily point storage to a real file so dbPath is included
      const originalStorage = config.database.storage;
      const tmpDb = path.resolve(config.backup.dir, "test-db-include.sqlite");
      fs.writeFileSync(tmpDb, "fake db content");
      config.database.storage = tmpDb;
      try {
        const record = await backupService.createBackup("manual");
        expect(record).toBeDefined();
        expect(record.status).toBe("success");
        // Verify the backup zip contains database.sqlite
        const AdmZip = require("adm-zip");
        const backupPath = path.resolve(config.backup.dir, record.filename);
        const zip = new AdmZip(backupPath);
        const entries = zip.getEntries().map(e => e.entryName);
        expect(entries).toContain("database.sqlite");
      } finally {
        config.database.storage = originalStorage;
      }
    });
  });
});

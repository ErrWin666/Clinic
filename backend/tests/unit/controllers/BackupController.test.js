jest.mock("../../../src/services/BackupService", () => {
  return jest.fn().mockImplementation(() => ({
    createBackup: jest.fn(),
    restoreBackup: jest.fn(),
    getHistory: jest.fn(),
    downloadBackup: jest.fn(),
    getSchedule: jest.fn(),
  }));
});
jest.mock("../../../src/services/SettingsService", () => {
  return jest.fn().mockImplementation(() => ({
    update: jest.fn().mockResolvedValue(),
  }));
});
jest.mock("../../../src/server", () => ({ rescheduleBackup: jest.fn().mockResolvedValue() }), { virtual: true });
jest.mock("fs");

const BackupController = require("../../../src/controllers/BackupController");
const BackupService = require("../../../src/services/BackupService");
const SettingsService = require("../../../src/services/SettingsService");
const fs = require("fs");

describe("BackupController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    BackupService.mockClear();
    SettingsService.mockClear();
    controller = new BackupController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("create", () => {
    it("should create a backup", async () => {
      controller.backupService.createBackup.mockResolvedValue({ filename: "backup-001.zip", size: 1024 });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ filename: "backup-001.zip" }) })
      );
    });

    it("should call next on error", async () => {
      controller.backupService.createBackup.mockRejectedValue(new Error("Backup failed"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("restore", () => {
    it("should restore a backup", async () => {
      req.body = { filename: "backup-001.zip" };
      controller.backupService.restoreBackup.mockResolvedValue({ success: true, filename: "backup-001.zip" });
      await controller.restore(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.body = { filename: "nonexistent.zip" };
      controller.backupService.restoreBackup.mockRejectedValue(new Error("File not found"));
      await controller.restore(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("history", () => {
    it("should return backup history", async () => {
      controller.backupService.getHistory.mockResolvedValue([
        { filename: "backup-001.zip", size: 1024, createdAt: "2026-01-01" },
      ]);
      await controller.history(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next on error", async () => {
      controller.backupService.getHistory.mockRejectedValue(new Error("DB error"));
      await controller.history(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("download", () => {
    it("should download a backup file", async () => {
      req.params.filename = "backup-001.zip";
      controller.backupService.downloadBackup.mockResolvedValue("/path/to/backup-001.zip");
      const mockStream = { pipe: jest.fn() };
      fs.createReadStream.mockReturnValue(mockStream);
      await controller.download(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/zip");
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it("should call next on error", async () => {
      req.params.filename = "nonexistent.zip";
      controller.backupService.downloadBackup.mockRejectedValue(new Error("File not found"));
      await controller.download(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getSchedule", () => {
    it("should return backup schedule", async () => {
      controller.backupService.getSchedule.mockResolvedValue({ enabled: true, hour: 2, minute: 0 });
      await controller.getSchedule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      controller.backupService.getSchedule.mockRejectedValue(new Error("DB error"));
      await controller.getSchedule(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateSchedule", () => {
    it("should update backup schedule", async () => {
      req.body = { enabled: true, hour: 3, minute: 30 };
      controller.backupService.getSchedule.mockResolvedValue({ enabled: true, hour: 3, minute: 30 });
      await controller.updateSchedule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.body = { enabled: true, hour: 3, minute: 30 };
      controller.backupService.getSchedule.mockRejectedValue(new Error("DB error"));
      await controller.updateSchedule(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle when rescheduleBackup is not a function", async () => {
      req.body = { enabled: true, hour: 3, minute: 30 };
      controller.backupService.getSchedule.mockResolvedValue({ enabled: true, hour: 3, minute: 30 });
      // Override the server mock to not have rescheduleBackup
      jest.doMock("../../../src/server", () => ({}), { virtual: true });
      await controller.updateSchedule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on settingsService.update error", async () => {
      req.body = { enabled: true, hour: 3, minute: 30 };
      SettingsService.mockImplementationOnce(() => ({
        update: jest.fn().mockRejectedValue(new Error("Settings update failed")),
      }));
      await controller.updateSchedule(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

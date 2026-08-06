const BaseController = require("./BaseController");
const BackupService = require("../services/BackupService");
const SettingsService = require("../services/SettingsService");
const MESSAGES = require("../constants/messages");
const fs = require("fs");

class BackupController extends BaseController {
  constructor() {
    super();
    this.backupService = new BackupService();
  }

  async create(req, res, next) {
    try {
      const backup = await this.backupService.createBackup("manual");
      return this.sendSuccess(res, backup, MESSAGES.BACKUP.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const { filename } = req.body;
      const backup = await this.backupService.restoreBackup(filename);
      return this.sendSuccess(res, backup, MESSAGES.BACKUP.RESTORED);
    } catch (error) {
      next(error);
    }
  }

  async history(req, res, next) {
    try {
      const backups = await this.backupService.getHistory();
      return this.sendSuccess(res, backups, MESSAGES.BACKUP.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async download(req, res, next) {
    try {
      const { filename } = req.params;
      const backupPath = await this.backupService.downloadBackup(filename);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      const stream = fs.createReadStream(backupPath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async getSchedule(req, res, next) {
    try {
      const schedule = await this.backupService.getSchedule();
      return this.sendSuccess(res, schedule, MESSAGES.BACKUP.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async updateSchedule(req, res, next) {
    try {
      const { enabled, hour, minute } = req.body;
      const settingsService = new SettingsService();
      await settingsService.update([
        { key: "backup.enabled", value: JSON.stringify(enabled), category: "backup" },
        { key: "backup.scheduleHour", value: JSON.stringify(hour), category: "backup" },
        { key: "backup.scheduleMinute", value: JSON.stringify(minute), category: "backup" },
      ]);

      const { rescheduleBackup } = require("../server");
      if (typeof rescheduleBackup === "function") {
        await rescheduleBackup();
      }

      const updated = await this.backupService.getSchedule();
      return this.sendSuccess(res, updated, MESSAGES.SETTINGS.UPDATED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BackupController;

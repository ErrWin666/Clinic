const BaseService = require("./BaseService");
const UserRepository = require("../repositories/UserRepository");
const { Settings } = require("../models");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const config = require("../config");
const RecoveryService = require("./RecoveryService");

class SetupService extends BaseService {
  constructor() {
    super(new UserRepository());
    this.recoveryService = new RecoveryService();
  }

  async checkAdminExists() {
    return this.executeOperation(async () => {
      const admin = await this.repository.findAdmin();
      return { adminExists: !!admin };
    }, MESSAGES.SETUP.ADMIN_CHECK_DONE, "SETUP_ERROR");
  }

  async createAdmin(data) {
    return this.executeOperation(async () => {
      const existing = await this.repository.findAdmin();
      if (existing) {
        throw new CustomError(MESSAGES.SETUP.ADMIN_EXISTS, "ADMIN_EXISTS", 400);
      }

      const existingUsername = await this.repository.findByUsername(data.username);
      if (existingUsername) {
        throw new CustomError(MESSAGES.SETUP.ADMIN_EXISTS, "ADMIN_EXISTS", 400);
      }

      const user = await this.repository.create({
        username: data.username,
        password: data.password,
        role: "admin",
        isAdmin: true,
      });

      // Generate recovery code (Layer 1) and server file token (Layer 2).
      const recoveryCode = this.recoveryService.generateRecoveryCode();
      const recoveryCodeHash = await this.recoveryService.hashRecoveryCode(recoveryCode);
      await user.update({ recoveryCodeHash });

      const fileToken = this.recoveryService.generateFileToken();
      try {
        await this.recoveryService.writeTokenFile(fileToken);
      } catch (err) {
        // Non-fatal: file recovery is a fallback layer; log and continue.
        config.warnings.push(`Failed to write recovery token file: ${err.message}`);
      }

      await this.initializeDefaultSettings(data);

      return {
        id: user.id,
        username: user.username,
        role: user.role,
        recoveryCode, // shown once only — caller must persist it
      };
    }, MESSAGES.SETUP.ADMIN_CREATED, "CREATE_ADMIN_ERROR");
  }

  async initializeDefaultSettings(data) {
    const defaults = [
      { key: "clinic.name", value: JSON.stringify(data.clinicName), category: "clinic" },
      { key: "clinic.logo", value: JSON.stringify(""), category: "clinic" },
      { key: "clinic.address", value: JSON.stringify(""), category: "clinic" },
      { key: "clinic.phone", value: JSON.stringify(""), category: "clinic" },
      { key: "clinic.email", value: JSON.stringify(""), category: "clinic" },
      { key: "clinic.currency", value: JSON.stringify(data.currency || config.app.defaultCurrency), category: "clinic" },
      { key: "clinic.language", value: JSON.stringify(data.language || config.app.defaultLanguage), category: "clinic" },
      { key: "backup.schedule", value: JSON.stringify(config.backup.scheduleDays), category: "backup" },
      { key: "backup.lastBackup", value: JSON.stringify(null), category: "backup" },
      { key: "backup.enabled", value: JSON.stringify(true), category: "backup" },
      { key: "backup.scheduleHour", value: JSON.stringify(2), category: "backup" },
      { key: "backup.scheduleMinute", value: JSON.stringify(0), category: "backup" },
      { key: "notification.appointmentReminder", value: JSON.stringify(30), category: "notification" },
      { key: "notification.appointmentReminderDays", value: JSON.stringify(2), category: "notification" },
      { key: "notification.invoiceReminderDays", value: JSON.stringify(3), category: "notification" },
      { key: "notification.followUpDays", value: JSON.stringify(30), category: "notification" },
      { key: "notification.diskWarningThreshold", value: JSON.stringify(70), category: "notification" },
      { key: "notification.diskCriticalThreshold", value: JSON.stringify(90), category: "notification" },
      { key: "ui.theme", value: JSON.stringify("light"), category: "ui" },
      { key: "ui.workingHours", value: JSON.stringify({ start: "09:00", end: "18:00", days: [1, 2, 3, 4, 5, 6] }), category: "ui" },
    ];

    for (const setting of defaults) {
      await Settings.findOrCreate({
        where: { key: setting.key },
        defaults: setting,
      });
    }
  }
}

module.exports = SetupService;

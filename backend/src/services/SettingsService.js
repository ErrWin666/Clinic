const BaseService = require("./BaseService");
const SettingsRepository = require("../repositories/SettingsRepository");
const UserRepository = require("../repositories/UserRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const fs = require("fs");
const path = require("path");

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

class SettingsService extends BaseService {
  constructor() {
    super(new SettingsRepository());
    this.userRepository = new UserRepository();
  }

  async getAll() {
    return this.executeOperation(async () => {
      const settings = await this.repository.getAll();
      const grouped = {};
      for (const setting of settings) {
        if (!grouped[setting.category]) grouped[setting.category] = {};
        const shortKey = setting.key.replace(new RegExp(`^${setting.category}\\.`), "");
        grouped[setting.category][shortKey] = safeJsonParse(setting.value);
      }
      return grouped;
    }, MESSAGES.SETTINGS.RETRIEVED, "SETTINGS_GET_ERROR");
  }

  async update(settingsArray) {
    return this.executeOperation(async () => {
      for (const setting of settingsArray) {
        const storedValue = JSON.stringify(setting.value);
        await this.repository.upsert(setting.key, storedValue, setting.category);
      }
      return this.getAll();
    }, MESSAGES.SETTINGS.UPDATED, "SETTINGS_UPDATE_ERROR");
  }

  async updateAdmin(data, userId) {
    return this.executeOperation(async () => {
      const user = await this.userRepository.findById(userId);

      const isMatch = await user.comparePassword(data.currentPassword);
      if (!isMatch) {
        throw new CustomError(MESSAGES.SETTINGS.WRONG_PASSWORD, "WRONG_PASSWORD", 401);
      }

      if (data.username && data.username !== user.username) {
        const existing = await this.userRepository.findByUsername(data.username);
        if (existing) {
          throw new CustomError(MESSAGES.SETTINGS.USERNAME_EXISTS, "USERNAME_EXISTS", 409);
        }
        user.username = data.username;
      }

      if (data.newPassword) {
        user.password = data.newPassword;
      }

      await user.save();
      return { id: user.id, username: user.username, role: user.role };
    }, MESSAGES.SETTINGS.ADMIN_UPDATED, "ADMIN_UPDATE_ERROR");
  }

  async uploadAdminImage(userId, filename) {
    return this.executeOperation(async () => {
      const user = await this.userRepository.findById(userId);
      const relativePath = `admin/${filename}`;
      return user.update({ profileImage: relativePath });
    }, MESSAGES.SETTINGS.IMAGE_UPLOADED, "ADMIN_IMAGE_UPLOAD_ERROR");
  }

  async deleteAdminImage(userId) {
    return this.executeOperation(async () => {
      const user = await this.userRepository.findById(userId);
      if (user.profileImage) {
        const { deleteUploadFile } = require("../utils/fileDelete");
        deleteUploadFile(user.profileImage);
        await user.update({ profileImage: null });
      }
      return true;
    }, MESSAGES.SETTINGS.IMAGE_REMOVED, "ADMIN_IMAGE_DELETE_ERROR");
  }

  /**
   * Load clinic settings from the Settings table, parse JSON values,
   * set `lang` from `clinic.language`, and load the logo file as base64
   * if it exists on disk. Returns a plain object ready for PDF generators.
   */
  async getClinicSettings() {
    const { Settings } = require("../models");
    const clinicRows = await Settings.findAll({ where: { category: "clinic" } });
    const settings = {};
    for (const s of clinicRows) {
      const key = s.key.replace(/^clinic\./, "");
      settings[key] = safeJsonParse(s.value);
    }
    settings.lang = settings.language || "en";

    if (settings.logo && typeof settings.logo === "string" && settings.logo.startsWith("clinic/")) {
      try {
        const logoPath = path.join(__dirname, "..", "..", "uploads", settings.logo);
        const logoBuffer = fs.readFileSync(logoPath);
        settings.logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      } catch (_e) {
        // Logo file not found — skip
      }
    }
    return settings;
  }

  async getBackupSchedule() {
    const settings = await this.repository.findByCategory("backup");
    const map = {};
    for (const s of settings) {
      map[s.key.replace(/^backup\./, "")] = safeJsonParse(s.value);
    }
    return {
      enabled: map.enabled !== undefined ? Boolean(map.enabled) : true,
      hour: map.scheduleHour !== undefined ? Number(map.scheduleHour) : 2,
      minute: map.scheduleMinute !== undefined ? Number(map.scheduleMinute) : 0,
    };
  }

  async uploadClinicLogo(filename) {
    return this.executeOperation(async () => {
      // Delete old logo file if exists
      const existing = await this.repository.findByKey("clinic.logo");
      if (existing && existing.value) {
        const oldPath = safeJsonParse(existing.value);
        if (oldPath && typeof oldPath === "string" && oldPath.startsWith("clinic/")) {
          const { deleteUploadFile } = require("../utils/fileDelete");
          deleteUploadFile(oldPath);
        }
      }
      // Store relative path (file is on disk, not base64)
      const relativePath = `clinic/${filename}`;
      await this.repository.upsert("clinic.logo", JSON.stringify(relativePath), "clinic");
      return { logoUrl: relativePath };
    }, MESSAGES.SETTINGS.IMAGE_UPLOADED, "CLINIC_LOGO_UPLOAD_ERROR");
  }

  async deleteClinicLogo() {
    return this.executeOperation(async () => {
      const existing = await this.repository.findByKey("clinic.logo");
      if (existing && existing.value) {
        const oldPath = safeJsonParse(existing.value);
        if (oldPath && typeof oldPath === "string") {
          const { deleteUploadFile } = require("../utils/fileDelete");
          deleteUploadFile(oldPath);
        }
      }
      await this.repository.upsert("clinic.logo", JSON.stringify(""), "clinic");
      return true;
    }, MESSAGES.SETTINGS.IMAGE_REMOVED, "CLINIC_LOGO_DELETE_ERROR");
  }
}

module.exports = SettingsService;

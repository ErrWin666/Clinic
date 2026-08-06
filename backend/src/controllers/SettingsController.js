const BaseController = require("./BaseController");
const SettingsService = require("../services/SettingsService");
const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");

class SettingsController extends BaseController {
  constructor() {
    super();
    this.settingsService = new SettingsService();
  }

  async getAll(req, res, next) {
    try {
      const settings = await this.settingsService.getAll();
      return this.sendSuccess(res, settings, MESSAGES.SETTINGS.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const settings = await this.settingsService.update(req.body.settings);
      return this.sendSuccess(res, settings, MESSAGES.SETTINGS.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const user = await this.settingsService.updateAdmin(req.body, req.user.id);
      return this.sendSuccess(res, user, MESSAGES.SETTINGS.ADMIN_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async uploadAdminImage(req, res, next) {
    try {
      if (!req.file) {
        throw new CustomError("No image file provided", "VALIDATION_ERROR", 400);
      }
      const user = await this.settingsService.uploadAdminImage(req.user.id, req.file.filename);
      return this.sendSuccess(res, { profileImageUrl: `admin/${req.file.filename}` }, MESSAGES.SETTINGS.IMAGE_UPLOADED);
    } catch (error) {
      next(error);
    }
  }

  async deleteAdminImage(req, res, next) {
    try {
      await this.settingsService.deleteAdminImage(req.user.id);
      return this.sendSuccess(res, null, MESSAGES.SETTINGS.IMAGE_REMOVED);
    } catch (error) {
      next(error);
    }
  }

  async uploadClinicLogo(req, res, next) {
    try {
      if (!req.file) {
        throw new CustomError("No image file provided", "VALIDATION_ERROR", 400);
      }
      const result = await this.settingsService.uploadClinicLogo(req.file.filename);
      return this.sendSuccess(res, result, MESSAGES.SETTINGS.IMAGE_UPLOADED);
    } catch (error) {
      next(error);
    }
  }

  async deleteClinicLogo(req, res, next) {
    try {
      await this.settingsService.deleteClinicLogo();
      return this.sendSuccess(res, null, MESSAGES.SETTINGS.IMAGE_REMOVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingsController;

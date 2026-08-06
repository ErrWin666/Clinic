const BaseController = require("./BaseController");
const SetupService = require("../services/SetupService");
const MESSAGES = require("../constants/messages");

class SetupController extends BaseController {
  constructor() {
    super();
    this.setupService = new SetupService();
  }

  async checkAdmin(req, res, next) {
    try {
      const result = await this.setupService.checkAdminExists();
      return this.sendSuccess(res, result, MESSAGES.SETUP.ADMIN_CHECK_DONE);
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const result = await this.setupService.createAdmin(req.body);
      return this.sendSuccess(res, result, MESSAGES.SETUP.ADMIN_CREATED, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SetupController;

const BaseController = require("./BaseController");
const SystemService = require("../services/SystemService");
const MESSAGES = require("../constants/messages");

class SystemController extends BaseController {
  constructor() {
    super();
    this.systemService = new SystemService();
  }

  async getDiskSpace(req, res, next) {
    try {
      const diskSpace = await this.systemService.getDiskSpace();
      return this.sendSuccess(res, diskSpace, MESSAGES.SYSTEM.DISK_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SystemController;

const BaseController = require("./BaseController");
const AuditLogService = require("../services/AuditLogService");
const MESSAGES = require("../constants/messages");

class AuditLogController extends BaseController {
  constructor() {
    super();
    this.auditLogService = new AuditLogService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.auditLogService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.AUDIT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuditLogController;

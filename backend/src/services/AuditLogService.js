const BaseService = require("./BaseService");
const AuditLogRepository = require("../repositories/AuditLogRepository");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");
const MESSAGES = require("../constants/messages");

class AuditLogService extends BaseService {
  constructor() {
    super(new AuditLogRepository());
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = {};
      if (query.userId) where.userId = query.userId;
      if (query.action) where.action = query.action;
      if (query.entity) where.entity = query.entity;
      if (query.startDate && query.endDate) {
        where.createdAt = { [Op.between]: [query.startDate, query.endDate] };
      }

      const { rows, count } = await this.repository.searchWithFilters({ where, offset, limit });
      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.AUDIT.RETRIEVED, "AUDIT_LIST_ERROR");
  }
}

module.exports = AuditLogService;

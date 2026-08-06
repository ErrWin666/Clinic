const BaseRepository = require("./BaseRepository");
const { AuditLog } = require("../models");
const { Op } = require("sequelize");

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["createdAt", "DESC"]],
      include: [{ association: "user", attributes: ["id", "username"] }],
    });
  }
}

module.exports = AuditLogRepository;

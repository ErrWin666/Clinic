const BaseRepository = require("./BaseRepository");
const { StockMovement } = require("../models");
const { Op } = require("sequelize");

class StockMovementRepository extends BaseRepository {
  constructor() {
    super(StockMovement);
  }

  async findByVariant(variantId, query = {}) {
    const { offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: { productVariantId: variantId },
      offset,
      limit,
      order: order || [["movementDate", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async findByBatch(batchId) {
    return this.model.findAll({
      where: { batchId },
      order: [["movementDate", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async findByReference(referenceType, referenceId) {
    return this.model.findAll({
      where: { referenceType, referenceId },
      order: [["createdAt", "ASC"]],
    });
  }

  async findByReferenceAndType(referenceType, referenceId, type) {
    return this.model.findAll({
      where: { referenceType, referenceId, type },
      order: [["createdAt", "ASC"]],
    });
  }

  async findMovementsByDateRange(startDate, endDate, filters = {}) {
    const where = {
      movementDate: { [Op.gte]: startDate, [Op.lte]: endDate },
    };
    if (filters.type) where.type = filters.type;
    if (filters.reason) where.reason = filters.reason;
    if (filters.productVariantId) where.productVariantId = filters.productVariantId;
    return this.model.findAll({
      where,
      order: [["movementDate", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["movementDate", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async sumQuantityByVariant(variantId) {
    const { sequelize } = require("../database");
    const result = await this.model.findOne({
      where: { productVariantId: variantId },
      attributes: [[sequelize.fn("SUM", sequelize.col("quantity")), "total"]],
      raw: true,
    });
    return Number(result?.total) || 0;
  }
}

module.exports = StockMovementRepository;

const BaseRepository = require("./BaseRepository");
const { Batch } = require("../models");
const { Op } = require("sequelize");

class BatchRepository extends BaseRepository {
  constructor() {
    super(Batch);
  }

  async findActiveByVariant(variantId, options = {}) {
    return this.model.findAll({
      where: { productVariantId: variantId, isActive: true, quantity: { [Op.gt]: 0 } },
      order: [["receivedDate", "ASC"]],
      ...options,
    });
  }

  async findActiveByVariantFEFO(variantId, options = {}) {
    return this.model.findAll({
      where: {
        productVariantId: variantId,
        isActive: true,
        quantity: { [Op.gt]: 0 },
        expiryDate: { [Op.ne]: null },
      },
      order: [["expiryDate", "ASC"]],
      ...options,
    });
  }

  async findActiveByVariantFIFO(variantId, options = {}) {
    return this.model.findAll({
      where: { productVariantId: variantId, isActive: true, quantity: { [Op.gt]: 0 } },
      order: [["receivedDate", "ASC"]],
      ...options,
    });
  }

  async findActiveByVariantAverage(variantId, options = {}) {
    return this.model.findAll({
      where: { productVariantId: variantId, isActive: true, quantity: { [Op.gt]: 0 } },
      ...options,
    });
  }

  async findExpiringSoon(days = 30) {
    const today = new Date().toISOString().split("T")[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureStr = future.toISOString().split("T")[0];
    return this.model.findAll({
      where: {
        isActive: true,
        quantity: { [Op.gt]: 0 },
        expiryDate: { [Op.gte]: today, [Op.lt]: futureStr },
      },
      order: [["expiryDate", "ASC"]],
    });
  }

  async findExpired() {
    const today = new Date().toISOString().split("T")[0];
    return this.model.findAll({
      where: {
        isActive: true,
        quantity: { [Op.gt]: 0 },
        expiryDate: { [Op.lt]: today },
      },
      order: [["expiryDate", "ASC"]],
    });
  }

  async findByVariantAndBatchNumber(variantId, batchNumber) {
    return this.model.findOne({
      where: { productVariantId: variantId, batchNumber },
    });
  }
}

module.exports = BatchRepository;

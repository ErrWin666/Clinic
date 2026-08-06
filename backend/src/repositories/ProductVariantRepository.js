const BaseRepository = require("./BaseRepository");
const { ProductVariant, Product, Batch } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class ProductVariantRepository extends BaseRepository {
  constructor() {
    super(ProductVariant);
  }

  async findByIdWithBatches(id) {
    return this.model.findByPk(id, {
      include: [
        { model: Batch, as: "batches", where: { isActive: true }, required: false },
        { model: Product, as: "product" },
      ],
    });
  }

  async findByIdWithProduct(id, options = {}) {
    return this.model.findByPk(id, {
      include: [{ model: Product, as: "product" }],
      ...options,
    });
  }

  async findBySku(sku) {
    return this.model.findOne({ where: { sku } });
  }

  async findByBarcode(barcode) {
    return this.model.findOne({ where: { barcode, isActive: true } });
  }

  async findBySerialNumber(serialNumber) {
    return this.model.findOne({ where: { serialNumber } });
  }

  async findLowStock() {
    return this.model.findAll({
      where: {
        isActive: true,
        quantity: { [Op.gt]: 0 },
        [Op.and]: [{ quantity: { [Op.lte]: sequelize.col("minQuantity") } }],
      },
    });
  }

  async findOutOfStock() {
    return this.model.findAll({
      where: { isActive: true, quantity: 0 },
    });
  }

  async findOverstock() {
    const { sequelize } = require("../database");
    return this.model.findAll({
      where: {
        isActive: true,
        maxQuantity: { [Op.gt]: 0 },
        quantity: { [Op.gt]: sequelize.col("maxQuantity") },
      },
    });
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["createdAt", "DESC"]],
      include: [{ model: Product, as: "product", required: false }],
      distinct: true,
    });
  }
}

module.exports = ProductVariantRepository;

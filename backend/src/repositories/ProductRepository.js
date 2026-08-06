const BaseRepository = require("./BaseRepository");
const { Product, ProductVariant } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findByIdWithVariants(id) {
    return this.model.findByPk(id, {
      include: [{ model: ProductVariant, as: "variants" }],
    });
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["createdAt", "DESC"]],
      include: [{ model: ProductVariant, as: "variants", required: false }],
      distinct: true,
    });
  }

  async hasActiveVariants(productId) {
    const count = await ProductVariant.count({
      where: { productId, isActive: true },
    });
    return count > 0;
  }
}

module.exports = ProductRepository;

const BaseRepository = require("./BaseRepository");
const { PurchaseOrder, PurchaseOrderItem, Supplier } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class PurchaseOrderRepository extends BaseRepository {
  constructor() {
    super(PurchaseOrder);
  }

  async findByIdWithItems(id) {
    return this.model.findByPk(id, {
      include: [{ model: PurchaseOrderItem, as: "items", include: [{ association: "variant" }] }],
    });
  }

  async findByIdWithSupplier(id) {
    return this.model.findByPk(id, {
      include: [{ model: Supplier, as: "supplier" }],
    });
  }

  async findByIdWithAll(id) {
    return this.model.findByPk(id, {
      include: [
        { model: Supplier, as: "supplier" },
        { model: PurchaseOrderItem, as: "items", include: [{ association: "variant" }] },
      ],
    });
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["orderDate", "DESC"]],
      include: [{ model: Supplier, as: "supplier", required: false }],
      distinct: true,
    });
  }

  async findOldestReceivedPOBySupplier(supplierId) {
    return this.model.findOne({
      where: { supplierId, status: "received" },
      order: [["receivedDate", "ASC"]],
    });
  }
}

module.exports = PurchaseOrderRepository;

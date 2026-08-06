const BaseRepository = require("./BaseRepository");
const { Supplier, PurchaseOrder, SupplierPayment } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class SupplierRepository extends BaseRepository {
  constructor() {
    super(Supplier);
  }

  async findByIdWithPurchaseOrders(id) {
    return this.model.findByPk(id, {
      include: [{ model: PurchaseOrder, as: "purchaseOrders", order: [["orderDate", "DESC"]] }],
    });
  }

  async findByIdWithPayments(id) {
    return this.model.findByPk(id, {
      include: [{ model: SupplierPayment, as: "payments", order: [["paymentDate", "DESC"]] }],
    });
  }

  async findByIdWithAll(id) {
    return this.model.findByPk(id, {
      include: [
        { model: PurchaseOrder, as: "purchaseOrders" },
        { model: SupplierPayment, as: "payments" },
      ],
    });
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["createdAt", "DESC"]],
    });
  }

  async sumReceivedPOsTotal(supplierId) {
    const { sequelize } = require("../database");
    const result = await PurchaseOrder.findOne({
      where: { supplierId, status: "received" },
      attributes: [[sequelize.fn("SUM", sequelize.col("totalAmount")), "total"]],
      raw: true,
    });
    return Number(result?.total) || 0;
  }

  async sumPaymentsTotal(supplierId) {
    const { sequelize } = require("../database");
    const result = await SupplierPayment.findOne({
      where: { supplierId },
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
      raw: true,
    });
    return Number(result?.total) || 0;
  }
}

module.exports = SupplierRepository;

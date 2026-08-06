const BaseRepository = require("./BaseRepository");
const { SupplierPayment } = require("../models");
const { Op } = require("sequelize");

class SupplierPaymentRepository extends BaseRepository {
  constructor() {
    super(SupplierPayment);
  }

  async findBySupplier(supplierId, query = {}) {
    const { offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: { supplierId },
      offset,
      limit,
      order: order || [["paymentDate", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async findByPurchaseOrder(purchaseOrderId) {
    return this.model.findAll({
      where: { purchaseOrderId },
      order: [["paymentDate", "DESC"]],
    });
  }

  async findByDateRange(supplierId, startDate, endDate) {
    return this.model.findAll({
      where: {
        supplierId,
        paymentDate: { [Op.gte]: startDate, [Op.lte]: endDate },
      },
      order: [["paymentDate", "ASC"]],
    });
  }
}

module.exports = SupplierPaymentRepository;

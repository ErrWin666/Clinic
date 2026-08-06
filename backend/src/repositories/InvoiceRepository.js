const BaseRepository = require("./BaseRepository");
const { Invoice, InvoiceItem } = require("../models");
const { Op } = require("sequelize");

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice);
  }

  async findByIdWithItems(id) {
    return this.model.findByPk(id, {
      include: [{ model: InvoiceItem, as: "items" }],
    });
  }

  async findByIdWithPatient(id) {
    return this.model.findByPk(id, {
      include: [
        { model: InvoiceItem, as: "items" },
        { association: "patient", attributes: ["id", "displayId", "fullName", "phoneNumber", "address", "email"] },
      ],
    });
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order, include } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["invoiceDate", "DESC"]],
      include: include || [{ association: "patient", attributes: ["id", "displayId", "fullName"] }],
    });
  }

  async findByPatientId(patientId, options = {}) {
    return this.model.findAll({
      where: { patientId },
      order: [["invoiceDate", "DESC"]],
      ...options,
    });
  }
}

module.exports = InvoiceRepository;

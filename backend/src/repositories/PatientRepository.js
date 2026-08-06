const BaseRepository = require("./BaseRepository");
const { Patient, Invoice, Appointment, EyeExamination } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class PatientRepository extends BaseRepository {
  constructor() {
    super(Patient);
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

  async autocomplete(searchTerm, limit = 10) {
    const term = `%${escapeLike(searchTerm)}%`;
    const LIKE = likeOp();
    return this.model.findAll({
      where: {
        [Op.or]: [
          { fullName: { [LIKE]: term } },
          { phoneNumber: { [LIKE]: term } },
          { displayId: { [LIKE]: term } },
        ],
      },
      limit,
      attributes: ["id", "displayId", "fullName", "phoneNumber", "gender", "birthDate", "address", "email"],
      order: [["fullName", "ASC"]],
    });
  }

  async hasUnpaidInvoices(patientId) {
    const count = await Invoice.count({
      where: { patientId, invoiceStatus: "unpaid" },
    });
    return count > 0;
  }

  async findByIdWithRelations(id) {
    return this.model.findByPk(id, {
      include: [
        { model: Appointment, as: "appointments", limit: 5, order: [["appointmentDate", "DESC"]] },
        { model: EyeExamination, as: "eyeExaminations", limit: 5, order: [["examDate", "DESC"]] },
        { model: Invoice, as: "invoices", limit: 5, order: [["invoiceDate", "DESC"]] },
      ],
    });
  }

  async findByEmail(email) {
    return this.model.findOne({ where: { email } });
  }
}

module.exports = PatientRepository;

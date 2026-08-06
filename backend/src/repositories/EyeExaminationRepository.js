const BaseRepository = require("./BaseRepository");
const { EyeExamination } = require("../models");
const { Op } = require("sequelize");

class EyeExaminationRepository extends BaseRepository {
  constructor() {
    super(EyeExamination);
  }

  async findByPatientId(patientId, query = {}) {
    const { offset, limit, where } = query;
    return this.model.findAndCountAll({
      where: { patientId, ...where },
      offset,
      limit,
      order: [["examDate", "DESC"]],
    });
  }

  async findByIdWithPatient(id) {
    return this.model.findByPk(id, {
      include: [{ association: "patient", attributes: ["id", "displayId", "fullName", "birthDate", "gender"] }],
    });
  }
}

module.exports = EyeExaminationRepository;

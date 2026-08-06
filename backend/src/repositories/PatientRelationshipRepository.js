const BaseRepository = require("./BaseRepository");
const { PatientRelationship } = require("../models");
const { Op } = require("sequelize");

class PatientRelationshipRepository extends BaseRepository {
  constructor() {
    super(PatientRelationship);
  }

  async findByPatientId(patientId) {
    return this.model.findAll({
      where: { [Op.or]: [{ guardianId: patientId }, { childId: patientId }] },
      include: [
        { association: "child", attributes: ["id", "displayId", "fullName", "birthDate", "gender", "profileImage", "patientType"] },
        { association: "guardian", attributes: ["id", "displayId", "fullName", "birthDate", "gender", "profileImage", "patientType"] },
      ],
    });
  }

  async findExisting(guardianId, childId) {
    return this.model.findOne({ where: { guardianId, childId } });
  }

  async findExistingBidirectional(patientAId, patientBId) {
    return this.model.findOne({
      where: {
        [Op.or]: [
          { guardianId: patientAId, childId: patientBId },
          { guardianId: patientBId, childId: patientAId },
        ],
      },
    });
  }

  async hasActiveRelationships(patientId) {
    const count = await this.model.count({
      where: { [Op.or]: [{ guardianId: patientId }, { childId: patientId }] },
    });
    return count > 0;
  }
}

module.exports = PatientRelationshipRepository;

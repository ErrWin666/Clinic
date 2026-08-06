const BaseRepository = require("./BaseRepository");
const { PatientNote, File } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class PatientNoteRepository extends BaseRepository {
  constructor() {
    super(PatientNote);
  }

  async searchWithFilters(query) {
    const { where, offset, limit, order } = query;
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["createdAt", "DESC"]],
      include: [{ model: File, as: "attachments", required: false }],
    });
  }

  async findByIdWithAttachments(id) {
    return this.model.findByPk(id, {
      include: [
        { model: File, as: "attachments", required: false },
      ],
    });
  }

  async listByPatient(patientId, offset, limit) {
    return this.model.findAndCountAll({
      where: { patientId },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      include: [{ model: File, as: "attachments", required: false }],
    });
  }

  async searchByPatient(patientId, searchTerm, offset, limit) {
    const term = `%${escapeLike(searchTerm)}%`;
    const LIKE = likeOp();
    return this.model.findAndCountAll({
      where: {
        patientId,
        [Op.or]: [
          { title: { [LIKE]: term } },
          { content: { [LIKE]: term } },
        ],
      },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      include: [{ model: File, as: "attachments", required: false }],
    });
  }
}

module.exports = PatientNoteRepository;

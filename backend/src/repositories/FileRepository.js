const BaseRepository = require("./BaseRepository");
const { File } = require("../models");

class FileRepository extends BaseRepository {
  constructor() {
    super(File);
  }

  async listByPatient(patientId, folderId = null) {
    const where = { patientId };
    if (folderId !== undefined && folderId !== null) {
      where.folderId = folderId;
    }
    return this.model.findAll({ where, order: [["createdAt", "DESC"]] });
  }

  async searchWithFilters({ where, offset, limit, order }) {
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["createdAt", "DESC"]],
    });
  }
}

module.exports = FileRepository;

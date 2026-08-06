const BaseRepository = require("./BaseRepository");
const { Folder } = require("../models");

class FolderRepository extends BaseRepository {
  constructor() {
    super(Folder);
  }

  async listByPatient(patientId) {
    return this.model.findAll({
      where: { patientId },
      order: [["name", "ASC"]],
    });
  }

  async searchWithFilters({ where, offset, limit, order }) {
    return this.model.findAndCountAll({
      where: where || {},
      offset,
      limit,
      order: order || [["name", "ASC"]],
    });
  }
}

module.exports = FolderRepository;

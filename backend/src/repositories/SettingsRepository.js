const BaseRepository = require("./BaseRepository");
const { Settings } = require("../models");

class SettingsRepository extends BaseRepository {
  constructor() {
    super(Settings);
  }

  async findByKey(key) {
    return this.model.findOne({ where: { key } });
  }

  async findByCategory(category) {
    return this.model.findAll({ where: { category } });
  }

  async upsert(key, value, category) {
    const [record, created] = await this.model.findOrCreate({
      where: { key },
      defaults: { key, value, category },
    });
    if (!created) {
      await record.update({ value, category });
    }
    return record;
  }

  async getAll() {
    return this.model.findAll();
  }
}

module.exports = SettingsRepository;

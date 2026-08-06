const { Op } = require("sequelize");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    const record = await this.model.findByPk(id, options);
    if (!record) {
      throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
    }
    return record;
  }

  async findByIdOrNull(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findAll(query = {}) {
    const { where, ...options } = query;
    return this.model.findAll({ where: where || {}, ...options });
  }

  async findAndCountAll(query = {}) {
    const { where, ...options } = query;
    return this.model.findAndCountAll({ where: where || {}, ...options });
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const record = await this.findById(id, options);
    return record.update(data, options);
  }

  async delete(id) {
    const record = await this.findById(id);
    await record.destroy();
    return true;
  }

  async count(where = {}) {
    return this.model.count({ where });
  }
}

module.exports = BaseRepository;

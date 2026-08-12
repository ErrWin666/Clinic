const BaseRepository = require("./BaseRepository");
const { User } = require("../models");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByUsername(username) {
    return this.model.scope("withSecrets").findOne({ where: { username } });
  }

  async findAdmin() {
    return this.model.scope("withSecrets").findOne({ where: { role: "admin" } });
  }
}

module.exports = UserRepository;

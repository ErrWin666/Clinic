const config = require("./index");
const logger = require("../utils/logger");

const databaseConfig = {
  dialect: config.database.dialect,
  decimalNumbers: true,
  logging: config.server.isDev ? (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    paranoid: true,
    underscored: false,
    freezeTableName: false,
  },
};

if (config.database.dialect === "sqlite") {
  databaseConfig.storage = config.database.storage;
} else {
  databaseConfig.host = config.database.host;
  databaseConfig.port = config.database.port;
  databaseConfig.database = config.database.name;
  databaseConfig.username = config.database.user;
  databaseConfig.password = config.database.password;
}

module.exports = databaseConfig;

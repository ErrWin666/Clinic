const { Sequelize } = require("sequelize");
const databaseConfig = require("../config/database");
const config = require("../config");
const logger = require("../utils/logger");

const sequelize = new Sequelize(databaseConfig);

async function connectDatabase() {
  try {
    await sequelize.authenticate();

    // SQLite-specific PRAGMAs for data safety (guarded by dialect check)
    if (config.database.dialect === "sqlite") {
      await sequelize.query("PRAGMA journal_mode = WAL;");
      await sequelize.query("PRAGMA synchronous = NORMAL;");
      await sequelize.query("PRAGMA foreign_keys = ON;");
    }

    logger.info("Database connection established");
    return sequelize;
  } catch (error) {
    logger.error({ message: "Database connection failed", error: error.message });
    throw error;
  }
}

async function syncDatabase() {
  try {
    const strategy = (config.database.migrate || "auto").toLowerCase();

    if (strategy === "sync") {
      // Legacy behaviour: keep schema in lockstep with models in development.
      if (config.server.isDev) {
        await sequelize.sync({ alter: true });
      } else {
        await sequelize.sync();
      }
      logger.info("Database models synced (sync strategy)");
      return;
    }

    if (strategy === "manual") {
      const { pendingMigrations } = require("./migrator");
      const pending = await pendingMigrations();
      if (pending.length > 0) {
        logger.warn(
          `${pending.length} pending migration(s) detected but DB_MIGRATE=manual: ${pending
            .map((m) => m.name)
            .join(", ")}`
        );
      }
      return;
    }

    // Default: "auto" — run migrations, then a non-destructive sync to cover
    // any drift that is not yet captured by a migration.
    const { runMigrations } = require("./migrator");
    await runMigrations();
    await sequelize.sync();
    logger.info("Database models synced (auto strategy)");
  } catch (error) {
    logger.error({ message: "Database sync failed", error: error.message });
    throw error;
  }
}

async function closeDatabase() {
  await sequelize.close();
  logger.info("Database connection closed");
}

module.exports = { sequelize, connectDatabase, syncDatabase, closeDatabase };

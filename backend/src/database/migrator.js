const { Umzug, SequelizeStorage } = require("umzug");
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const { sequelize } = require("./index");
const logger = require("../utils/logger");

const migrationsDir = path.resolve(__dirname, "migrations");

function loadMigration(migrationPath) {
  // Read and compile the migration manually so Jest's intercepted require
  // does not break migration loading in tests.
  const source = fs.readFileSync(migrationPath, "utf8");
  const compiled = new vm.SourceTextModule(source, { url: `file://${migrationPath}` });
  return compiled;
}

async function evaluateMigration(migrationPath) {
  const source = fs.readFileSync(migrationPath, "utf8");
  const wrapper = `(function (module, exports, require) { ${source}\n })`;
  const fn = vm.runInThisContext(wrapper, { filename: migrationPath });
  const moduleObj = { exports: {} };
  fn(moduleObj, moduleObj.exports, require);
  return moduleObj.exports;
}

const migrator = new Umzug({
  migrations: {
    glob: {
      pattern: "*.js",
      cwd: migrationsDir,
    },
    resolve: ({ name, path: migrationPath }) => {
      // umzug v3 resolves the glob path against the process CWD rather than
      // the configured cwd, so build the path from the name ourselves.
      const migrationName = name.replace(/\.js$/, "");
      const resolved = path.resolve(migrationsDir, name);
      return {
        name: migrationName,
        up: async () => {
          const migration = await evaluateMigration(resolved);
          return migration.up({ sequelize, queryInterface: sequelize.getQueryInterface() });
        },
        down: async () => {
          const migration = await evaluateMigration(resolved);
          return migration.down ? migration.down({ sequelize, queryInterface: sequelize.getQueryInterface() }) : undefined;
        },
      };
    },
  },
  storage: new SequelizeStorage({ sequelize, modelName: "SequelizeMeta" }),
  context: { sequelize, queryInterface: sequelize.getQueryInterface() },
  logger: {
    info: (msg) => logger.info(typeof msg === "string" ? msg : JSON.stringify(msg)),
    warn: (msg) => logger.warn(typeof msg === "string" ? msg : JSON.stringify(msg)),
    error: (msg) => logger.error(typeof msg === "string" ? msg : JSON.stringify(msg)),
    debug: (msg) => logger.debug(typeof msg === "string" ? msg : JSON.stringify(msg)),
  },
});

async function runMigrations() {
  const pending = await migrator.pending();
  if (pending.length > 0) {
    logger.info(`Running ${pending.length} pending migration(s): ${pending.map((m) => m.name).join(", ")}`);
  }
  const executed = await migrator.up();
  if (executed.length > 0) {
    logger.info(`Applied ${executed.length} migration(s): ${executed.map((m) => m.name).join(", ")}`);
  } else {
    logger.info("No pending migrations");
  }
  return executed;
}

async function pendingMigrations() {
  return migrator.pending();
}

async function migrationStatus() {
  const [executed, pending] = await Promise.all([migrator.executed(), migrator.pending()]);
  return {
    executed: executed.map((m) => m.name),
    pending: pending.map((m) => m.name),
  };
}

module.exports = { migrator, runMigrations, pendingMigrations, migrationStatus };

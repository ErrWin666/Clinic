const { Sequelize } = require("sequelize");
const path = require("path");
const os = require("os");
const fs = require("fs");

const tmpStorage = path.join(os.tmpdir(), `clinic-migrator-${Date.now()}-${process.pid}.sqlite`);

function buildMigrator(sequelize) {
  const { Umzug, SequelizeStorage } = require("umzug");
  const fs = require("fs");
  const vm = require("vm");
  const migrationsDir = path.resolve(__dirname, "..", "..", "src", "database", "migrations");

  async function evaluateMigration(migrationPath) {
    const source = fs.readFileSync(migrationPath, "utf8");
    const wrapper = `(function (module, exports, require) { ${source}\n })`;
    const fn = vm.runInThisContext(wrapper, { filename: migrationPath });
    const moduleObj = { exports: {} };
    fn(moduleObj, moduleObj.exports, require);
    return moduleObj.exports;
  }

  return new Umzug({
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
    logger: undefined,
  });
}

describe("migrator", () => {
  let sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: tmpStorage,
      logging: false,
    });
    await sequelize.authenticate();
  });

  afterEach(async () => {
    await sequelize.close();
    if (fs.existsSync(tmpStorage)) fs.rmSync(tmpStorage, { force: true });
  });

  it("applies the baseline migration and records it", async () => {
    const migrator = buildMigrator(sequelize);
    const executed = await migrator.up();
    expect(executed.map((m) => m.name)).toContain("0000-baseline");

    const tables = await sequelize.getQueryInterface().showAllTables();
    expect(tables).toContain("SequelizeMeta");
  });

  it("is idempotent: running twice applies the migration only once", async () => {
    const migrator = buildMigrator(sequelize);
    await migrator.up();
    const secondRun = await migrator.up();
    expect(secondRun).toHaveLength(0);
  });

  it("reports no pending migrations after the baseline", async () => {
    const migrator = buildMigrator(sequelize);
    await migrator.up();
    const pending = await migrator.pending();
    expect(pending).toHaveLength(0);
  });
});

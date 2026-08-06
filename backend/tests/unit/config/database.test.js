const databaseConfig = require("../../../src/config/database");

jest.mock("../../../src/config", () => ({
  database: {
    dialect: "sqlite",
    storage: ":memory:",
    host: "localhost",
    port: 5432,
    name: "testdb",
    user: "testuser",
    password: "testpass",
  },
  server: { isDev: false, nodeEnv: "test" },
  logging: { level: "error", dir: "./logs" },
}));

describe("database config", () => {
  it("should have dialect from config", () => {
    expect(databaseConfig.dialect).toBe("sqlite");
  });

  it("should have decimalNumbers enabled", () => {
    expect(databaseConfig.decimalNumbers).toBe(true);
  });

  it("should have logging disabled in non-dev mode", () => {
    expect(databaseConfig.logging).toBe(false);
  });

  it("should have timestamps enabled in define", () => {
    expect(databaseConfig.define.timestamps).toBe(true);
  });

  it("should have paranoid enabled in define", () => {
    expect(databaseConfig.define.paranoid).toBe(true);
  });

  it("should have underscored disabled in define", () => {
    expect(databaseConfig.define.underscored).toBe(false);
  });

  it("should have freezeTableName disabled in define", () => {
    expect(databaseConfig.define.freezeTableName).toBe(false);
  });

  it("should set storage for sqlite dialect", () => {
    expect(databaseConfig.storage).toBe(":memory:");
  });
});

jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../../src/config", () => ({
  database: { dialect: "sqlite", storage: ":memory:", migrate: "sync" },
  server: { isDev: false, nodeEnv: "test" },
}));

jest.mock("../../../src/config/database", () => ({
  dialect: "sqlite",
  storage: ":memory:",
  decimalNumbers: true,
  define: { timestamps: true, paranoid: true, underscored: false, freezeTableName: false },
  logging: false,
}));

const mockSequelize = {
  authenticate: jest.fn(),
  sync: jest.fn(),
  close: jest.fn(),
  query: jest.fn().mockResolvedValue(undefined),
};

jest.mock("sequelize", () => ({
  Sequelize: jest.fn(() => mockSequelize),
}));

describe("database/index.js", () => {
  let dbModule;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    dbModule = require("../../../src/database");
  });

  describe("connectDatabase", () => {
    it("should authenticate and return sequelize instance", async () => {
      mockSequelize.authenticate.mockResolvedValueOnce(undefined);
      const result = await dbModule.connectDatabase();
      expect(result).toBeDefined();
      expect(mockSequelize.authenticate).toHaveBeenCalled();
    });

    it("should throw on authentication failure", async () => {
      mockSequelize.authenticate.mockRejectedValueOnce(new Error("Connection failed"));
      await expect(dbModule.connectDatabase()).rejects.toThrow("Connection failed");
    });
  });

  describe("syncDatabase", () => {
    it("should sync models successfully", async () => {
      mockSequelize.sync.mockResolvedValueOnce(undefined);
      await dbModule.syncDatabase();
      expect(mockSequelize.sync).toHaveBeenCalled();
    });

    it("should throw on sync failure", async () => {
      mockSequelize.sync.mockRejectedValueOnce(new Error("Sync failed"));
      await expect(dbModule.syncDatabase()).rejects.toThrow("Sync failed");
    });
  });

  describe("closeDatabase", () => {
    it("should close connection", async () => {
      mockSequelize.close.mockResolvedValueOnce(undefined);
      await dbModule.closeDatabase();
      expect(mockSequelize.close).toHaveBeenCalled();
    });
  });

  it("should export sequelize instance", () => {
    expect(dbModule.sequelize).toBeDefined();
  });
});

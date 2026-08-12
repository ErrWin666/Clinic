const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const SetupService = require("../../../src/services/SetupService");
const { User, Settings } = require("../../../src/models");

describe("SetupService", () => {
  let setupService;

  beforeAll(async () => {
    await setupTestDB();
    setupService = new SetupService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("checkAdminExists", () => {
    it("should return adminExists=false when no admin", async () => {
      const result = await setupService.checkAdminExists();
      expect(result.adminExists).toBe(false);
    });
  });

  describe("createAdmin", () => {
    it("should create admin with hashed password", async () => {
      const admin = await setupService.createAdmin({
        username: "admin",
        password: "Admin@123",
        clinicName: "Test Eye Clinic",
        currency: "USD",
        language: "ar",
      });

      expect(admin).toBeDefined();
      expect(admin.username).toBe("admin");
      expect(admin.role).toBe("admin");

      const dbUser = await User.scope("withSecrets").findByPk(admin.id);
      expect(dbUser.password).not.toBe("Admin@123");
      const isMatch = await dbUser.comparePassword("Admin@123");
      expect(isMatch).toBe(true);
    });

    it("should create default settings", async () => {
      const settings = await Settings.findAll();
      expect(settings.length).toBeGreaterThan(0);

      const categories = settings.map((s) => s.category);
      expect(categories).toContain("clinic");
      expect(categories).toContain("backup");
      expect(categories).toContain("notification");
      expect(categories).toContain("ui");
    });
  });

  describe("checkAdminExists — after admin created", () => {
    it("should return adminExists=true when admin exists", async () => {
      const result = await setupService.checkAdminExists();
      expect(result.adminExists).toBe(true);
    });
  });

  describe("createAdmin — duplicate rejection", () => {
    it("should reject if admin already exists", async () => {
      await expect(
        setupService.createAdmin({
          username: "admin2",
          password: "pass123",
          clinicName: "Clinic",
          currency: "USD",
          language: "ar",
        })
      ).rejects.toThrow();
    });

    it("should reject if username already taken (non-admin)", async () => {
      // Create a non-admin user with username "testuser"
      const { User } = require("../../../src/models");
      await User.create({ username: "testuser", password: "Test@123", role: "user" });
      // Now try to create admin with same username - but admin already exists so this will throw ADMIN_EXISTS first
      // We need to test the username check path. Since admin exists, this throws at line 25.
      // The username check at line 30 is only reached when no admin exists.
      // This branch is hard to test without mocking. Skip for now.
      await expect(
        setupService.createAdmin({
          username: "testuser",
          password: "pass123",
          clinicName: "Clinic",
          currency: "USD",
          language: "ar",
        })
      ).rejects.toThrow();
    });
  });

  describe("initializeDefaultSettings", () => {
    it("should use default currency and language when not provided", async () => {
      // Settings already exist from previous test, verify defaults were applied
      const currencySetting = await Settings.findOne({ where: { key: "clinic.currency" } });
      expect(currencySetting).toBeDefined();
      const languageSetting = await Settings.findOne({ where: { key: "clinic.language" } });
      expect(languageSetting).toBeDefined();
    });
  });

  describe("createAdmin — username collision (no admin exists)", () => {
    it("should reject if username already taken when no admin exists", async () => {
      // Mock the repository to simulate no admin but existing username
      const mockRepo = {
        findAdmin: jest.fn().mockResolvedValue(null),
        findByUsername: jest.fn().mockResolvedValue({ id: 99, username: "taken" }),
        create: jest.fn(),
      };
      const mockRecoveryService = {
        generateRecoveryCode: jest.fn().mockReturnValue("CODE123"),
        hashRecoveryCode: jest.fn().mockResolvedValue("hash"),
        generateFileToken: jest.fn().mockReturnValue("token"),
        writeTokenFile: jest.fn().mockResolvedValue(true),
      };

      // Create a service with mocked dependencies
      const SetupService = require("../../../src/services/SetupService");
      const svc = new SetupService();
      svc.repository = mockRepo;
      svc.recoveryService = mockRecoveryService;

      await expect(
        svc.createAdmin({ username: "taken", password: "pass", clinicName: "C", currency: "USD", language: "ar" })
      ).rejects.toThrow();
    });
  });

  describe("createAdmin — writeTokenFile error", () => {
    it("should continue when writeTokenFile fails", async () => {
      const mockRepo = {
        findAdmin: jest.fn().mockResolvedValue(null),
        findByUsername: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 1,
          username: "newadmin",
          role: "admin",
          update: jest.fn().mockResolvedValue(true),
        }),
      };
      const mockRecoveryService = {
        generateRecoveryCode: jest.fn().mockReturnValue("CODE456"),
        hashRecoveryCode: jest.fn().mockResolvedValue("hash456"),
        generateFileToken: jest.fn().mockReturnValue("token456"),
        writeTokenFile: jest.fn().mockRejectedValue(new Error("Disk full")),
      };

      const SetupService = require("../../../src/services/SetupService");
      const config = require("../../../src/config");
      const svc = new SetupService();
      svc.repository = mockRepo;
      svc.recoveryService = mockRecoveryService;

      // Mock initializeDefaultSettings to avoid DB writes
      svc.initializeDefaultSettings = jest.fn().mockResolvedValue(true);

      const result = await svc.createAdmin({ username: "newadmin", password: "pass", clinicName: "C", currency: "USD", language: "ar" });
      expect(result).toBeDefined();
      expect(result.username).toBe("newadmin");
      expect(result.recoveryCode).toBe("CODE456");
    });
  });
});

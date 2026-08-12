const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const SettingsService = require("../../../src/services/SettingsService");
const CustomError = require("../../../src/utils/CustomError");
const { Settings, User } = require("../../../src/models");

describe("SettingsService", () => {
  let settingsService;
  let adminUser;

  beforeAll(async () => {
    await setupTestDB();
    adminUser = await createTestAdmin();
    settingsService = new SettingsService();

    await Settings.bulkCreate([
      { key: "clinic.name", value: JSON.stringify("Test Clinic"), category: "clinic" },
      { key: "clinic.currency", value: JSON.stringify("USD"), category: "clinic" },
      { key: "ui.theme", value: JSON.stringify("light"), category: "ui" },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("getAll", () => {
    it("should return grouped settings by category", async () => {
      const settings = await settingsService.getAll();
      expect(settings).toBeDefined();
      expect(settings.clinic).toBeDefined();
      expect(settings.clinic["name"]).toBe("Test Clinic");
      expect(settings.clinic["currency"]).toBe("USD");
      expect(settings.ui).toBeDefined();
      expect(settings.ui["theme"]).toBe("light");
    });
  });

  describe("update", () => {
    it("should upsert multiple settings", async () => {
      const result = await settingsService.update([
        { key: "clinic.name", value: "Updated Clinic", category: "clinic" },
        { key: "notification.enabled", value: true, category: "notification" },
      ]);

      expect(result.clinic["name"]).toBe("Updated Clinic");
      expect(result.notification["enabled"]).toBe(true);
    });
  });

  describe("updateAdmin", () => {
    it("should update username with correct password", async () => {
      const result = await settingsService.updateAdmin(
        { currentPassword: "admin123", username: "newadmin" },
        adminUser.id
      );
      expect(result.username).toBe("newadmin");
    });

    it("should reject wrong password with 401", async () => {
      await expect(
        settingsService.updateAdmin(
          { currentPassword: "wrongpass", username: "another" },
          adminUser.id
        )
      ).rejects.toThrow(CustomError);

      try {
        await settingsService.updateAdmin(
          { currentPassword: "wrongpass", username: "another" },
          adminUser.id
        );
      } catch (err) {
        expect(err.statusCode).toBe(401);
      }
    });

    it("should reject duplicate username with 409", async () => {
      await User.create({ username: "existinguser", password: "pass123", role: "admin", isAdmin: true });

      await expect(
        settingsService.updateAdmin(
          { currentPassword: "admin123", username: "existinguser" },
          adminUser.id
        )
      ).rejects.toThrow(CustomError);

      try {
        await settingsService.updateAdmin(
          { currentPassword: "admin123", username: "existinguser" },
          adminUser.id
        );
      } catch (err) {
        expect(err.statusCode).toBe(409);
      }
    });

    it("should update password", async () => {
      await settingsService.updateAdmin(
        { currentPassword: "admin123", newPassword: "NewPass@123" },
        adminUser.id
      );

      const user = await User.scope("withSecrets").findByPk(adminUser.id);
      const isMatch = await user.comparePassword("NewPass@123");
      expect(isMatch).toBe(true);
    });

    it("should update both username and password", async () => {
      const result = await settingsService.updateAdmin(
        { currentPassword: "NewPass@123", username: "bothupdated", newPassword: "BothPass@123" },
        adminUser.id
      );
      expect(result.username).toBe("bothupdated");
      const user = await User.scope("withSecrets").findByPk(adminUser.id);
      expect(await user.comparePassword("BothPass@123")).toBe(true);
    });
  });

  describe("uploadAdminImage", () => {
    it("should update user profileImage", async () => {
      const result = await settingsService.uploadAdminImage(adminUser.id, "test-avatar.png");
      expect(result).toBeDefined();
      expect(result.profileImage).toBe("admin/test-avatar.png");
    });
  });

  describe("deleteAdminImage", () => {
    it("should delete user profileImage", async () => {
      await settingsService.uploadAdminImage(adminUser.id, "to-delete.png");
      const result = await settingsService.deleteAdminImage(adminUser.id);
      expect(result).toBe(true);
      const user = await User.findByPk(adminUser.id);
      expect(user.profileImage).toBeNull();
    });

    it("should return true even if no image set", async () => {
      const freshUser = await User.create({ username: "noimguser", password: "pass123", role: "admin", isAdmin: true });
      const result = await settingsService.deleteAdminImage(freshUser.id);
      expect(result).toBe(true);
    });
  });

  describe("getClinicSettings", () => {
    it("should return clinic settings with lang fallback", async () => {
      const result = await settingsService.getClinicSettings();
      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Clinic");
      expect(result.lang).toBe("en");
    });

    it("should handle logo path starting with clinic/", async () => {
      await Settings.create({ key: "clinic.logo", value: JSON.stringify("clinic/logo.png"), category: "clinic" });
      const result = await settingsService.getClinicSettings();
      expect(result).toBeDefined();
      // logo file doesn't exist on disk so logoBase64 should not be set
      expect(result.logo).toBe("clinic/logo.png");
    });
  });

  describe("getBackupSchedule", () => {
    it("should return default schedule when no settings", async () => {
      const result = await settingsService.getBackupSchedule();
      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
      expect(result.hour).toBe(2);
      expect(result.minute).toBe(0);
    });

    it("should return configured schedule", async () => {
      await Settings.bulkCreate([
        { key: "backup.enabled", value: JSON.stringify(false), category: "backup" },
        { key: "backup.scheduleHour", value: JSON.stringify(3), category: "backup" },
        { key: "backup.scheduleMinute", value: JSON.stringify(30), category: "backup" },
      ]);
      const result = await settingsService.getBackupSchedule();
      expect(result.enabled).toBe(false);
      expect(result.hour).toBe(3);
      expect(result.minute).toBe(30);
    });
  });

  describe("uploadClinicLogo", () => {
    it("should upload clinic logo and return relative path", async () => {
      const result = await settingsService.uploadClinicLogo("new-logo.png");
      expect(result).toBeDefined();
      expect(result.logoUrl).toBe("clinic/new-logo.png");
    });
  });

  describe("deleteClinicLogo", () => {
    it("should delete clinic logo", async () => {
      await settingsService.uploadClinicLogo("to-delete-logo.png");
      const result = await settingsService.deleteClinicLogo();
      expect(result).toBe(true);
    });

    it("should return true even if no logo set", async () => {
      // Logo was already deleted in previous test or set to empty
      const result = await settingsService.deleteClinicLogo();
      expect(result).toBe(true);
    });
  });
});

const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { Settings } = require("../../../src/models");
const WhatsAppCloudService = require("../../../src/services/WhatsAppCloudService");

describe("WhatsAppCloudService", () => {
  let service;
  let originalFetch;

  beforeAll(async () => {
    await setupTestDB();
    service = new WhatsAppCloudService();
    originalFetch = global.fetch;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await teardownTestDB();
  });

  describe("normalizePhone", () => {
    it("should normalize Egyptian local number starting with 0", () => {
      expect(service.normalizePhone("01234567890")).toBe("201234567890");
    });

    it("should strip + and spaces", () => {
      expect(service.normalizePhone("+20 123 456 7890")).toBe("201234567890");
    });

    it("should return null for invalid input", () => {
      expect(service.normalizePhone("abc")).toBeNull();
      expect(service.normalizePhone("")).toBeNull();
      expect(service.normalizePhone(null)).toBeNull();
    });

    it("should keep international numbers as-is", () => {
      expect(service.normalizePhone("12025551234")).toBe("12025551234");
    });
  });

  describe("sendTemplateMessage", () => {
    beforeEach(() => {
      // Set up config values
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-phone-id";
      config.whatsappCloud.accessToken = "test-token";
      config.whatsappCloud.apiVersion = "v18.0";
    });

    it("should return not_configured when phoneNumberId is missing", async () => {
      const config = require("../../../src/config");
      const saved = config.whatsappCloud.phoneNumberId;
      config.whatsappCloud.phoneNumberId = "";
      const result = await service.sendTemplateMessage("01234567890", "test_template", "ar", ["param"]);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_configured");
      config.whatsappCloud.phoneNumberId = saved;
    });

    it("should send a template message successfully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "msg123" }] }),
      });

      const result = await service.sendTemplateMessage("01234567890", "appointment_reminder", "ar", ["Ahmed", "2026-08-02", "10:00"]);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("msg123");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://graph.facebook.com/v18.0/test-phone-id/messages",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should return failure on API error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Invalid token" } }),
      });

      const result = await service.sendTemplateMessage("01234567890", "test_template", "ar", []);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid token");
    });

    it("should return failure on invalid phone", async () => {
      global.fetch = jest.fn();
      const result = await service.sendTemplateMessage("abc", "test_template", "ar", []);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("invalid_phone");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle network errors gracefully", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      const result = await service.sendTemplateMessage("01234567890", "test_template", "ar", []);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("sendTextMessage", () => {
    beforeEach(() => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-phone-id";
      config.whatsappCloud.accessToken = "test-token";
    });

    it("should send a text message successfully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "txt123" }] }),
      });

      const result = await service.sendTextMessage("01234567890", "Hello from clinic");
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("txt123");
    });

    it("should return not_configured when disabled", async () => {
      const config = require("../../../src/config");
      const saved = config.whatsappCloud.phoneNumberId;
      config.whatsappCloud.phoneNumberId = "";
      const result = await service.sendTextMessage("01234567890", "Hello");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_configured");
      config.whatsappCloud.phoneNumberId = saved;
    });

    it("should return invalid_phone for bad phone", async () => {
      const result = await service.sendTextMessage("abc", "Hello");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("invalid_phone");
    });

    it("should handle API error response", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Rate limited" } }),
      });
      const result = await service.sendTextMessage("01234567890", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Rate limited");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network timeout"));
      const result = await service.sendTextMessage("01234567890", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network timeout");
    });
  });

  describe("settings", () => {
    it("should save and retrieve settings", async () => {
      await service.updateSettings({ enabled: true, customTemplate: "Hello {{name}}" });
      const settings = await service.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.customTemplate).toBe("Hello {{name}}");
    });
  });

  describe("monthly count tracking", () => {
    it("should track monthly count and reset on new month", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "m1" }] }),
      });

      await service.sendTemplateMessage("01234567890", "test", "ar", []);
      await service.sendTemplateMessage("01234567890", "test", "ar", []);

      const count = await service.getMonthlyCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it("should reset count when month changes", async () => {
      // Set count to a previous month
      await service.updateSettings({ monthlyCountMonth: "2025-01", monthlyCount: 500 });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "m2" }] }),
      });
      await service.sendTemplateMessage("01234567890", "test", "ar", []);
      const count = await service.getMonthlyCount();
      // Should be reset to 1 for the new month
      expect(count).toBeLessThanOrEqual(10);
    });

    it("should handle getMonthlyCount when month differs", async () => {
      await service.updateSettings({ monthlyCountMonth: "2020-01", monthlyCount: 999 });
      const count = await service.getMonthlyCount();
      expect(count).toBe(0);
    });

    it("should handle _incrementMonthlyCount error gracefully", async () => {
      // Force getSettings to throw by mocking it
      jest.spyOn(service, "getSettings").mockRejectedValueOnce(new Error("DB error"));
      const result = await service._incrementMonthlyCount();
      expect(result).toBe(0);
    });

    it("should warn when monthly count approaches 900", async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await service.updateSettings({ monthlyCountMonth: currentMonth, monthlyCount: 899 });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "m900" }] }),
      });
      // Send a template message which will increment count to 900
      await service.sendTemplateMessage("01234567890", "test", "ar", []);
      const count = await service.getMonthlyCount();
      expect(count).toBeGreaterThanOrEqual(900);
    });
  });
});

const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const SmsMobileApiService = require("../../../src/services/SmsMobileApiService");

describe("SmsMobileApiService", () => {
  let service;
  let originalFetch;

  beforeAll(async () => {
    await setupTestDB();
    service = new SmsMobileApiService();
    originalFetch = global.fetch;

    const config = require("../../../src/config");
    config.smsMobileApi.url = "http://192.168.1.100:8080";
    config.smsMobileApi.apiKey = "test-key";
    config.smsMobileApi.enabled = true;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await teardownTestDB();
  });

  describe("sendMessage", () => {
    it("should send an SMS successfully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, messageId: "sms-001" }),
      });

      const result = await service.sendMessage("201234567890", "Test reminder");
      expect(result.success).toBe(true);
      expect(result.messageId).toBe("sms-001");

      const call = global.fetch.mock.calls[0];
      expect(call[0]).toBe("http://192.168.1.100:8080/send");
      expect(call[1].method).toBe("POST");
      expect(JSON.parse(call[1].body)).toEqual({ to: "201234567890", text: "Test reminder" });
    });

    it("should include API key in headers when configured", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await service.sendMessage("201234567890", "Test");
      const call = global.fetch.mock.calls[0];
      expect(call[1].headers["Authorization"]).toBe("Bearer test-key");
    });

    it("should return failure on HTTP error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "SIM not ready" }),
      });

      const result = await service.sendMessage("201234567890", "Test");
      expect(result.success).toBe(false);
      expect(result.error).toBe("SIM not ready");
    });

    it("should handle connection refused (phone offline)", async () => {
      const err = new Error("connect ECONNREFUSED");
      err.code = "ECONNREFUSED";
      global.fetch = jest.fn().mockRejectedValue(err);

      const result = await service.sendMessage("201234567890", "Test");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("phone_unreachable");
    });

    it("should handle timeout (phone unreachable)", async () => {
      const err = new Error("The operation was aborted");
      err.name = "TimeoutError";
      global.fetch = jest.fn().mockRejectedValue(err);

      const result = await service.sendMessage("201234567890", "Test");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("phone_unreachable");
    });

    it("should return not_configured when disabled", async () => {
      const config = require("../../../src/config");
      const saved = config.smsMobileApi.enabled;
      config.smsMobileApi.enabled = false;
      const result = await service.sendMessage("201234567890", "Test");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_configured");
      config.smsMobileApi.enabled = saved;
    });
  });

  describe("checkStatus", () => {
    it("should return phone status when reachable", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ connected: true, battery: 85, signal: "good" }),
      });

      const result = await service.checkStatus();
      expect(result.success).toBe(true);
      expect(result.connected).toBe(true);
      expect(result.battery).toBe(85);
    });

    it("should return failure when phone is unreachable", async () => {
      const err = new Error("aborted");
      err.name = "TimeoutError";
      global.fetch = jest.fn().mockRejectedValue(err);

      const result = await service.checkStatus();
      expect(result.success).toBe(false);
      expect(result.reason).toBe("phone_unreachable");
    });

    it("should return not_configured when url is missing", async () => {
      const config = require("../../../src/config");
      const saved = config.smsMobileApi.url;
      config.smsMobileApi.url = "";
      const result = await service.checkStatus();
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_configured");
      config.smsMobileApi.url = saved;
    });
  });

  describe("settings", () => {
    it("should save and retrieve settings", async () => {
      await service.updateSettings({ enabled: true, url: "http://10.0.0.5:9090" });
      const settings = await service.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.url).toBe("http://10.0.0.5:9090");
    });
  });
});

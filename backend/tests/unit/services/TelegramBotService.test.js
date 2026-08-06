const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { Patient } = require("../../../src/models");
const TelegramBotService = require("../../../src/services/TelegramBotService");

describe("TelegramBotService", () => {
  let service;
  let originalFetch;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    service = new TelegramBotService();
    originalFetch = global.fetch;

    const config = require("../../../src/config");
    config.telegram.botToken = "test-bot-token";
    config.telegram.apiBase = "https://api.telegram.org";
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await teardownTestDB();
  });

  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 42 } }),
      });

      const result = await service.sendMessage("123456", "Hello");
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(42);
    });

    it("should return failure when Telegram API returns error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: false, description: "Chat not found" }),
      });

      const result = await service.sendMessage("999", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Chat not found");
    });

    it("should handle network errors", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
      const result = await service.sendMessage("123", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should return not_configured when botToken is missing", async () => {
      const config = require("../../../src/config");
      const saved = config.telegram.botToken;
      config.telegram.botToken = "";
      const result = await service.sendMessage("123", "Hello");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_configured");
      config.telegram.botToken = saved;
    });

    it("should send with parseMode when provided", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 99 } }),
      });
      const result = await service.sendMessage("123", "<b>Hello</b>", "HTML");
      expect(result.success).toBe(true);
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.parse_mode).toBe("HTML");
    });

    it("should handle API error without description field", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: false, error_code: 400 }),
      });
      const result = await service.sendMessage("123", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Send failed");
    });
  });

  describe("sendReminder", () => {
    it("should send an appointment reminder with HTML formatting", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      const result = await service.sendReminder("123", "appointment_reminder", {
        patientName: "Ahmed",
        clinicName: "Eye Clinic",
        date: "2026-08-02",
        time: "10:00",
      });
      expect(result.success).toBe(true);

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.parse_mode).toBe("HTML");
      expect(callBody.text).toContain("تذكير موعد");
      expect(callBody.text).toContain("Ahmed");
    });

    it("should send an overdue invoice reminder", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 2 } }),
      });

      const result = await service.sendReminder("123", "overdue_invoice", {
        patientName: "Ahmed",
        invoiceId: "INV-001",
        amount: "500",
        currency: "EGP",
      });
      expect(result.success).toBe(true);
    });

    it("should send a follow-up reminder", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 3 } }),
      });

      const result = await service.sendReminder("123", "follow_up_due", {
        patientName: "Ahmed",
        lastVisitDate: "2026-01-01",
      });
      expect(result.success).toBe(true);
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.text).toContain("متابعة");
    });

    it("should send default message for unknown reminder type", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 4 } }),
      });

      const result = await service.sendReminder("123", "unknown_type", {
        message: "Custom reminder text",
      });
      expect(result.success).toBe(true);
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.text).toContain("Custom reminder text");
    });
  });

  describe("handleUpdate", () => {
    it("should handle /start with token and link patient", async () => {
      // Create a patient with a link token
      const patient = await Patient.create({
        displayId: "P001",
        fullName: "Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "01000000000",
        telegramLinkToken: "test-link-token-123",
      });

      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      await service.handleUpdate({
        update_id: 1,
        message: {
          chat: { id: 987654 },
          text: "/start test-link-token-123",
        },
      });

      // Patient should be linked
      const updated = await Patient.findByPk(patient.id);
      expect(updated.telegramChatId).toBe("987654");
      expect(updated.telegramLinkToken).toBeNull();
    });

    it("should handle /start without token with welcome message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      await service.handleUpdate({
        update_id: 2,
        message: {
          chat: { id: 111 },
          text: "/start",
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.text).toContain("مرحباً");
    });

    it("should handle unknown commands with help message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      await service.handleUpdate({
        update_id: 3,
        message: {
          chat: { id: 222 },
          text: "random text",
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.text).toContain("رابط");
    });

    it("should handle /help command", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      await service.handleUpdate({
        update_id: 4,
        message: {
          chat: { id: 333 },
          text: "/help",
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.text).toContain("تذكيرات");
    });

    it("should return early when no message in update", async () => {
      global.fetch = jest.fn();

      await service.handleUpdate({
        update_id: 5,
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle callback_query message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      await service.handleUpdate({
        update_id: 6,
        callback_query: {
          message: {
            chat: { id: 444 },
            text: "callback text",
          },
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.chat_id).toBe(444);
    });
    it("should handle /start with invalid token and send failure message", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      await service.handleUpdate({
        update_id: 7,
        message: {
          chat: { id: 555 },
          text: "/start invalid-token-xyz",
        },
      });

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.text).toContain("تعذر");
    });
  });

  describe("linkPatient - error handling", () => {
    it("should return error when Patient.findOne throws", async () => {
      const { Patient } = require("../../../src/models");
      const originalFindOne = Patient.findOne;
      Patient.findOne = jest.fn().mockRejectedValue(new Error("DB error"));
      try {
        const result = await service.linkPatient("some-token", "123");
        expect(result.success).toBe(false);
        expect(result.error).toBe("DB error");
      } finally {
        Patient.findOne = originalFindOne;
      }
    });
  });

  describe("updateSettings - existing key update", () => {
    it("should update existing setting rather than create new one", async () => {
      // First call creates the setting
      await service.updateSettings({ enabled: true });
      // Second call should update the existing one
      await service.updateSettings({ enabled: false });
      const settings = await service.getSettings();
      expect(settings.enabled).toBe(false);
    });
  });

  describe("generateInviteLink", () => {
    it("should generate a unique invite link for a patient", async () => {
      const patient = await Patient.create({
        displayId: "P002",
        fullName: "Test Patient 2",
        birthDate: "1985-05-15",
        gender: "female",
        phoneNumber: "01111111111",
      });

      const result = await service.generateInviteLink(patient.id);
      expect(result.success).toBe(true);
      expect(result.link).toMatch(/^https:\/\/t\.me\/.+start=.+$/);
      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(32);

      // Patient should have the token stored
      const updated = await Patient.findByPk(patient.id);
      expect(updated.telegramLinkToken).toBe(result.token);
    });

    it("should return failure for non-existent patient", async () => {
      const result = await service.generateInviteLink(99999);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("patient_not_found");
    });
  });

  describe("linkPatient", () => {
    it("should link patient with valid token", async () => {
      const patient = await Patient.create({
        displayId: "P003",
        fullName: "Test Patient 3",
        birthDate: "2000-01-01",
        gender: "male",
        phoneNumber: "01222222222",
        telegramLinkToken: "link-token-456",
      });

      const result = await service.linkPatient("link-token-456", "555555");
      expect(result.success).toBe(true);
      expect(result.patientId).toBe(patient.id);

      const updated = await Patient.findByPk(patient.id);
      expect(updated.telegramChatId).toBe("555555");
      expect(updated.telegramLinkToken).toBeNull();
    });

    it("should fail with invalid token", async () => {
      const result = await service.linkPatient("nonexistent-token", "123");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("invalid_token");
    });
  });

  describe("settings", () => {
    it("should save and retrieve settings", async () => {
      await service.updateSettings({ enabled: true, botUsername: "MyClinicBot" });
      const settings = await service.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.botUsername).toBe("MyClinicBot");
    });
  });

  describe("polling", () => {
    it("should start and stop polling", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: [] }),
      });

      await service.startPolling();
      expect(service._polling).toBe(true);

      // Stop immediately — we only verify start/stop works
      service.stopPolling();
      expect(service._polling).toBe(false);
    });

    it("should not start polling when not configured", async () => {
      const config = require("../../../src/config");
      const saved = config.telegram.botToken;
      config.telegram.botToken = "";
      await service.startPolling();
      expect(service._polling).toBe(false);
      config.telegram.botToken = saved;
    });

    it("should not start polling when already polling", async () => {
      service._polling = true;
      await service.startPolling();
      // Should remain true but not start a new loop
      expect(service._polling).toBe(true);
      service._polling = false;
    });

    it("should stop polling and abort controller", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: [] }),
      });

      await service.startPolling();
      expect(service._polling).toBe(true);

      service.stopPolling();
      expect(service._polling).toBe(false);
      expect(service._abortController).toBeNull();
    });

    it("should handle stopPolling when no abortController exists", () => {
      service._polling = false;
      service._abortController = null;
      service.stopPolling();
      expect(service._polling).toBe(false);
      expect(service._abortController).toBeNull();
    });
  });
});

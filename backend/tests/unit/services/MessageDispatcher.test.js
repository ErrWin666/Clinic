const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { Patient, Notification } = require("../../../src/models");
const MessageDispatcher = require("../../../src/services/MessageDispatcher");

describe("MessageDispatcher", () => {
  let dispatcher;
  let originalFetch;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    originalFetch = global.fetch;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await teardownTestDB();
  });

  beforeEach(() => {
    dispatcher = new MessageDispatcher();
    // Disable all channels by default — individual tests enable what they need
    const config = require("../../../src/config");
    config.whatsappCloud.phoneNumberId = "";
    config.whatsappCloud.accessToken = "";
    config.telegram.botToken = "";
    config.smsMobileApi.url = "";
    config.smsMobileApi.enabled = false;
    global.fetch = jest.fn();
  });

  async function createPatient(overrides = {}) {
    return Patient.create({
      displayId: `P-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fullName: "Test Patient",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "01000000000",
      ...overrides,
    });
  }

  async function createNotification(overrides = {}) {
    return Notification.create({
      type: "appointment_reminder",
      title: "Test Notification",
      message: "Test message",
      ...overrides,
    });
  }

  describe("dispatch — auto cascade", () => {
    it("should return no_patient when patient is null", async () => {
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, null, "appointment_reminder");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_patient");
    });

    it("should fall through all layers and return none when all disabled", async () => {
      const patient = await createPatient();
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
    });

    it("should record dispatchChannel=none on notification when all fail", async () => {
      const patient = await createPatient();
      const notification = await createNotification();
      await dispatcher.dispatch(notification, patient, "appointment_reminder");
      await notification.reload();
      expect(notification.dispatchChannel).toBe("none");
      expect(notification.dispatchedAt).not.toBeNull();
    });

    it("should dispatch via WhatsApp when enabled and patient has phone", async () => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-id";
      config.whatsappCloud.accessToken = "test-token";

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "wa-1" }] }),
      });

      const patient = await createPatient({ whatsappOptIn: true });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("whatsapp");

      await notification.reload();
      expect(notification.dispatchChannel).toBe("whatsapp");
    });

    it("should skip WhatsApp when patient opted out", async () => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-id";
      config.whatsappCloud.accessToken = "test-token";
      // Enable Telegram as fallback to verify the cascade moves on
      config.telegram.botToken = "test-bot-token";
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      const patient = await createPatient({ whatsappOptIn: false, telegramChatId: "12345" });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("telegram");
    });

    it("should dispatch via Telegram when WhatsApp fails", async () => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-id";
      config.whatsappCloud.accessToken = "test-token";
      config.telegram.botToken = "test-bot-token";

      // WhatsApp fails, Telegram succeeds
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: "Failed" } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ ok: true, result: { message_id: 42 } }),
        });

      const patient = await createPatient({ telegramChatId: "99999" });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("telegram");
    });

    it("should dispatch via SMSMobileAPI when WhatsApp+Telegram fail", async () => {
      const config = require("../../../src/config");
      config.smsMobileApi.url = "http://localhost:8080";
      config.smsMobileApi.enabled = true;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, messageId: "sms-m-1" }),
      });

      const patient = await createPatient();
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("sms_mobile");
    });
  });

  describe("dispatch — preferred channel", () => {
    it("should use preferred telegram when set, skipping WhatsApp", async () => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-id";
      config.whatsappCloud.accessToken = "test-token";
      config.telegram.botToken = "test-bot-token";

      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: true, result: { message_id: 1 } }),
      });

      const patient = await createPatient({
        preferredContactMethod: "telegram",
        telegramChatId: "77777",
      });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("telegram");

      // Verify WhatsApp was NOT called (only one fetch call to Telegram)
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain("sendMessage");
    });

    it("should fall back to auto if preferred channel fails", async () => {
      const config = require("../../../src/config");
      config.telegram.botToken = "test-bot-token";
      config.smsMobileApi.url = "http://localhost:8080";
      config.smsMobileApi.enabled = true;

      // Preferred Telegram fails (1st call), auto Telegram also fails (2nd call),
      // then SMSMobileAPI succeeds (3rd call)
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({ ok: false, description: "blocked" }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ ok: false, description: "still blocked" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, messageId: "sms-1" }),
        });

      const patient = await createPatient({
        preferredContactMethod: "telegram",
        telegramChatId: "77777",
      });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      // Should fall through to sms_mobile after telegram fails
      expect(result.channel).toBe("sms_mobile");
    });
  });

  describe("template rendering (via MessageTemplateService)", () => {
    it("should render appointment reminder with patient name and clinic info", async () => {
      const clinicInfo = await dispatcher.templates.getClinicInfo();
      const msg = await dispatcher.templates.renderText(
        "appointment_reminder",
        { message: "Appointment at 10:00", entityId: null, entityType: null },
        { fullName: "Ahmed" },
        clinicInfo
      );
      expect(msg).toContain("Ahmed");
      expect(msg).toContain("تذكير موعد");
      expect(msg).toContain(clinicInfo.name);
    });

    it("should render overdue invoice reminder with patient name", async () => {
      const clinicInfo = await dispatcher.templates.getClinicInfo();
      const msg = await dispatcher.templates.renderText(
        "overdue_invoice",
        { message: "Invoice overdue", entityId: null, entityType: null },
        { fullName: "Sara" },
        clinicInfo
      );
      expect(msg).toContain("Sara");
      expect(msg).toContain("فاتورة");
    });

    it("should render follow-up reminder with patient name", async () => {
      const clinicInfo = await dispatcher.templates.getClinicInfo();
      const msg = await dispatcher.templates.renderText(
        "follow_up_due",
        { message: "Follow up needed", entityId: null, entityType: null },
        { fullName: "Ali" },
        clinicInfo
      );
      expect(msg).toContain("Ali");
      expect(msg).toContain("متابعة");
    });

    it("should render welcome message", async () => {
      const clinicInfo = await dispatcher.templates.getClinicInfo();
      const msg = await dispatcher.templates.renderText(
        "welcome",
        { message: "" },
        { fullName: "Omar" },
        clinicInfo
      );
      expect(msg).toContain("Omar");
      expect(msg).toContain("مرحباً");
    });

    it("should render thank you visit message", async () => {
      const clinicInfo = await dispatcher.templates.getClinicInfo();
      const msg = await dispatcher.templates.renderText(
        "thank_you_visit",
        { message: "" },
        { fullName: "Layla" },
        clinicInfo
      );
      expect(msg).toContain("Layla");
      expect(msg).toContain("شكراً");
    });

    it("should render HTML for Telegram with bold tags", async () => {
      const clinicInfo = await dispatcher.templates.getClinicInfo();
      const html = await dispatcher.templates.renderHtml(
        "appointment_reminder",
        { message: "Test", entityId: null, entityType: null },
        { fullName: "Test" },
        clinicInfo
      );
      expect(html).toContain("<b>");
      expect(html).toContain("Test");
    });
  });

  describe("getStats", () => {
    it("should return stats object with all channels", async () => {
      const stats = await dispatcher.getStats();
      expect(stats).toHaveProperty("whatsapp");
      expect(stats).toHaveProperty("telegram");
      expect(stats).toHaveProperty("sms_mobile");
      expect(stats).toHaveProperty("sms");
      expect(stats).toHaveProperty("none");
      expect(stats).toHaveProperty("total");
    });
  });

  describe("preferred channel - sms_mobile and sms", () => {
    it("should use preferred whatsapp when set", async () => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-id";
      config.whatsappCloud.accessToken = "test-token";

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "wa-pref-1" }] }),
      });

      const patient = await createPatient({ preferredContactMethod: "whatsapp", whatsappOptIn: true });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("whatsapp");
    });

    it("should use preferred sms_mobile when set", async () => {
      const config = require("../../../src/config");
      config.smsMobileApi.url = "http://localhost:8080";
      config.smsMobileApi.enabled = true;

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, messageId: "sms-m-2" }),
      });

      const patient = await createPatient({ preferredContactMethod: "sms_mobile" });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("sms_mobile");
    });

    it("should use preferred sms when set", async () => {
      const patient = await createPatient({ preferredContactMethod: "sms" });
      const notification = await createNotification();

      // Mock the sms service
      jest.spyOn(dispatcher.sms, "sendMessage").mockResolvedValue({ success: true, channel: "twilio" });

      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("twilio");
    });

    it("should return none for unknown preferred method", async () => {
      const patient = await createPatient({ preferredContactMethod: "unknown_method" });
      const notification = await createNotification();
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
    });
  });

  describe("trySms - edge cases", () => {
    it("should skip sms when patient has no phone", async () => {
      const patient = await createPatient({ phoneNumber: "" });
      const notification = await createNotification();
      const result = await dispatcher.trySms(patient, "test message", notification);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("skipped");
    });

    it("should handle sms failure", async () => {
      const patient = await createPatient();
      const notification = await createNotification();
      jest.spyOn(dispatcher.sms, "sendMessage").mockResolvedValue({ success: false, error: "SMS provider down" });
      const result = await dispatcher.trySms(patient, "test message", notification);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("SMS provider down");
    });

    it("should handle sms failure with reason field", async () => {
      const patient = await createPatient();
      const notification = await createNotification();
      jest.spyOn(dispatcher.sms, "sendMessage").mockResolvedValue({ success: false, reason: "no_provider" });
      const result = await dispatcher.trySms(patient, "test message", notification);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_provider");
    });

    it("should dispatch via SMS in auto cascade when all other channels fail", async () => {
      const patient = await createPatient();
      const notification = await createNotification();
      jest.spyOn(dispatcher.sms, "sendMessage").mockResolvedValue({ success: true, channel: "twilio" });
      const result = await dispatcher.dispatch(notification, patient, "appointment_reminder");
      expect(result.success).toBe(true);
      expect(result.channel).toBe("twilio");
    });
  });

  describe("trySmsMobile - edge cases", () => {
    it("should skip sms_mobile when patient has no phone", async () => {
      const patient = await createPatient({ phoneNumber: "" });
      const notification = await createNotification();
      const result = await dispatcher.trySmsMobile(patient, "test", notification);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("skipped");
    });

    it("should handle sms_mobile failure", async () => {
      const config = require("../../../src/config");
      config.smsMobileApi.url = "http://localhost:8080";
      config.smsMobileApi.enabled = true;

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "Device offline" }),
      });

      const patient = await createPatient();
      const notification = await createNotification();
      const result = await dispatcher.trySmsMobile(patient, "test", notification);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Device offline");
    });

    it("should handle sms_mobile failure with reason field", async () => {
      const config = require("../../../src/config");
      config.smsMobileApi.url = "http://localhost:8080";
      config.smsMobileApi.enabled = true;

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: "timeout" }),
      });

      const patient = await createPatient();
      const notification = await createNotification();
      const result = await dispatcher.trySmsMobile(patient, "test", notification);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("timeout");
    });
  });

  describe("tryWhatsApp - edge cases", () => {
    it("should handle WhatsApp failure with reason field", async () => {
      const config = require("../../../src/config");
      config.whatsappCloud.phoneNumberId = "test-id";
      config.whatsappCloud.accessToken = "test-token";

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Template not found" } }),
      });

      const patient = await createPatient({ whatsappOptIn: true });
      const notification = await createNotification();
      const result = await dispatcher.tryWhatsApp(patient, "test", notification, "appointment_reminder", "test_template", []);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Template not found");
    });

    it("should skip WhatsApp when patient has no phone", async () => {
      const patient = await createPatient({ phoneNumber: "" });
      const notification = await createNotification();
      const result = await dispatcher.tryWhatsApp(patient, "test", notification, "appointment_reminder", "test_template", []);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("skipped");
    });
  });

  describe("tryTelegram - edge cases", () => {
    it("should skip Telegram when patient has no chatId", async () => {
      const patient = await createPatient();
      const notification = await createNotification();
      const result = await dispatcher.tryTelegram(patient, "test", {}, notification, "appointment_reminder");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("skipped");
    });

    it("should handle Telegram failure with reason field", async () => {
      const config = require("../../../src/config");
      config.telegram.botToken = "test-bot-token";

      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ ok: false, description: "Chat blocked" }),
      });

      const patient = await createPatient({ telegramChatId: "12345" });
      const notification = await createNotification();
      const result = await dispatcher.tryTelegram(patient, "test", {}, notification, "appointment_reminder");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Chat blocked");
    });
  });

  describe("getStats - with notifications", () => {
    it("should count notifications with null dispatchChannel as none", async () => {
      // Create a notification with null dispatchChannel
      await Notification.create({
        type: "appointment_reminder",
        title: "Test",
        message: "Test",
        dispatchedAt: new Date(),
        dispatchChannel: null,
      });
      const stats = await dispatcher.getStats();
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe("_recordDispatch - error handling", () => {
    it("should handle error when recording dispatch fails", async () => {
      const notification = await createNotification();
      // Force update to throw
      notification.update = jest.fn().mockRejectedValue(new Error("DB error"));
      await dispatcher._recordDispatch(notification, "test_channel");
      // Should not throw
    });

    it("should skip recording when notification is null", async () => {
      await dispatcher._recordDispatch(null, "test_channel");
      // Should not throw
    });
  });
});

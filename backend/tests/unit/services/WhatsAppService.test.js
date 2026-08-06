jest.mock("../../../src/models");
jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../../src/services/messaging", () => {
  return jest.fn().mockImplementation(() => ({
    render: jest.fn().mockReturnValue("rendered message"),
    getClinicInfo: jest.fn().mockResolvedValue({ name: "Test Clinic", currency: "USD" }),
    renderText: jest.fn().mockResolvedValue("Rendered template message"),
  }));
});

global.fetch = jest.fn();

const WhatsAppService = require("../../../src/services/WhatsAppService");
const { Settings } = require("../../../src/models");

describe("WhatsAppService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WhatsAppService();
  });

  describe("getSettings", () => {
    it("should parse settings from database", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.fromNumber", value: '"1234567890"' },
        { key: "whatsapp.accountSid", value: '"AC12345"' },
      ]);

      const settings = await service.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.fromNumber).toBe("1234567890");
      expect(settings.accountSid).toBe("AC12345");
    });

    it("should handle non-JSON values", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.rawValue", value: "plain text" },
      ]);

      const settings = await service.getSettings();
      expect(settings.rawValue).toBe("plain text");
    });

    it("should return empty object when no settings", async () => {
      Settings.findAll.mockResolvedValue([]);
      const settings = await service.getSettings();
      expect(settings).toEqual({});
    });
  });

  describe("updateSettings", () => {
    it("should update existing settings", async () => {
      const mockUpdate = jest.fn();
      Settings.findOne.mockResolvedValue({ update: mockUpdate });
      Settings.findAll.mockResolvedValue([{ key: "whatsapp.enabled", value: "true" }]);

      await service.updateSettings({ enabled: true });
      expect(mockUpdate).toHaveBeenCalledWith({ value: "true" });
    });

    it("should create new settings when not found", async () => {
      Settings.findOne.mockResolvedValue(null);
      Settings.create.mockResolvedValue({});
      Settings.findAll.mockResolvedValue([]);

      await service.updateSettings({ newSetting: "value" });
      expect(Settings.create).toHaveBeenCalledWith({
        key: "whatsapp.newSetting",
        value: "value",
        category: "whatsapp",
      });
    });

    it("should stringify object values", async () => {
      Settings.findOne.mockResolvedValue(null);
      Settings.create.mockResolvedValue({});
      Settings.findAll.mockResolvedValue([]);

      await service.updateSettings({ config: { nested: true } });
      expect(Settings.create).toHaveBeenCalledWith(
        expect.objectContaining({ value: JSON.stringify({ nested: true }) })
      );
    });
  });

  describe("sendMessage", () => {
    it("should return disabled when not enabled", async () => {
      Settings.findAll.mockResolvedValue([{ key: "whatsapp.enabled", value: "false" }]);
      const result = await service.sendMessage("+1234567890", "Test");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("disabled");
    });

    it("should return not_configured when missing credentials", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '""' },
      ]);
      const result = await service.sendMessage("+1234567890", "Test");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_configured");
    });

    it("should send message successfully", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"whatsapp:+123"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM123" }),
      });

      const result = await service.sendMessage("+1234567890", "Hello");
      expect(result.success).toBe(true);
      expect(result.sid).toBe("SM123");
    });

    it("should handle API error response", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"whatsapp:+123"' },
      ]);
      fetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ message: "Invalid number" }),
      });

      const result = await service.sendMessage("+1234567890", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid number");
    });

    it("should handle network error", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"whatsapp:+123"' },
      ]);
      fetch.mockRejectedValue(new Error("Network error"));

      const result = await service.sendMessage("+1234567890", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should use empty string when fromNumber not set", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM999" }),
      });

      const result = await service.sendMessage("+1234567890", "Hello");
      expect(result.success).toBe(true);
    });

    it("should handle API error without message field", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
      ]);
      fetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error_code: 123 }),
      });

      const result = await service.sendMessage("+1234567890", "Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Send failed");
    });
  });

  describe("sendAppointmentReminder", () => {
    it("should return no_phone if patient has no phone", async () => {
      const result = await service.sendAppointmentReminder({}, { phoneNumber: null }, "Clinic");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_phone");
    });

    it("should use custom template if set", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
        { key: "whatsapp.appointmentTemplate", value: '"Hi {{patientName}}, appt on {{date}} at {{time}}"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendAppointmentReminder(
        { id: 1, appointmentDate: "2026-07-01", startTime: "10:00" },
        { phoneNumber: "123", fullName: "John" },
        "Clinic"
      );
      expect(result.success).toBe(true);
    });

    it("should use centralized template when no custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendAppointmentReminder(
        { id: 1, appointmentDate: "2026-07-01", startTime: "10:00" },
        { phoneNumber: "123", fullName: "John" },
        "Clinic"
      );
      expect(result.success).toBe(true);
      expect(service.templates.renderText).toHaveBeenCalled();
    });

    it("should handle null fields in custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
        { key: "whatsapp.appointmentTemplate", value: '"Hi {{patientName}}, appt on {{date}} at {{time}} at {{clinicName}}"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendAppointmentReminder(
        { id: 1, appointmentDate: null, startTime: null },
        { phoneNumber: "123", fullName: null },
        null
      );
      expect(result.success).toBe(true);
    });
  });

  describe("sendInvoiceNotification", () => {
    it("should return no_phone if patient has no phone", async () => {
      const result = await service.sendInvoiceNotification({}, { phoneNumber: null }, "Clinic");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_phone");
    });

    it("should send invoice notification with custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
        { key: "whatsapp.invoiceTemplate", value: '"Invoice {{invoiceId}}: {{amount}} {{currency}}"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendInvoiceNotification(
        { id: 1, displayId: "INV-001", totalAmount: 100, currency: "USD" },
        { phoneNumber: "123", fullName: "John" },
        "Clinic"
      );
      expect(result.success).toBe(true);
    });

    it("should use centralized template when no custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendInvoiceNotification(
        { id: 1, displayId: "INV-001", totalAmount: 100, currency: "USD" },
        { phoneNumber: "123", fullName: "John" },
        "Clinic"
      );
      expect(result.success).toBe(true);
      expect(service.templates.renderText).toHaveBeenCalled();
    });

    it("should handle null fields in invoice custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
        { key: "whatsapp.invoiceTemplate", value: '"Invoice {{invoiceId}}: {{amount}} {{currency}} for {{patientName}} at {{clinicName}}"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendInvoiceNotification(
        { id: 1, displayId: null, totalAmount: null, currency: null },
        { phoneNumber: "123", fullName: null },
        null
      );
      expect(result.success).toBe(true);
    });
  });

  describe("sendFollowUpReminder", () => {
    it("should return no_phone if patient has no phone", async () => {
      const result = await service.sendFollowUpReminder({ phoneNumber: null }, "Clinic", "2026-01-01");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_phone");
    });

    it("should send follow-up with custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
        { key: "whatsapp.followUpTemplate", value: '"Hi {{patientName}}, follow-up after {{lastVisitDate}}"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendFollowUpReminder(
        { phoneNumber: "123", fullName: "John" },
        "Clinic",
        "2026-06-01"
      );
      expect(result.success).toBe(true);
    });

    it("should use centralized template when no custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendFollowUpReminder(
        { phoneNumber: "123", fullName: "John" },
        "Clinic",
        "2026-06-01"
      );
      expect(result.success).toBe(true);
      expect(service.templates.renderText).toHaveBeenCalled();
    });

    it("should handle null fields in follow-up custom template", async () => {
      Settings.findAll.mockResolvedValue([
        { key: "whatsapp.enabled", value: "true" },
        { key: "whatsapp.accountSid", value: '"AC123"' },
        { key: "whatsapp.authToken", value: '"token"' },
        { key: "whatsapp.fromNumber", value: '"123"' },
        { key: "whatsapp.followUpTemplate", value: '"Hi {{patientName}}, follow-up after {{lastVisitDate}} at {{clinicName}}"' },
      ]);
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ sid: "SM1" }),
      });

      const result = await service.sendFollowUpReminder(
        { phoneNumber: "123", fullName: null },
        null,
        null
      );
      expect(result.success).toBe(true);
    });
  });
});

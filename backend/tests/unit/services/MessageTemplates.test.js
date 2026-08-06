const {
  DEFAULT_TEMPLATES_AR,
  DEFAULT_TEMPLATES_EN,
  WHATSAPP_CLOUD_TEMPLATES_AR,
  WHATSAPP_CLOUD_TEMPLATES_EN,
} = require("../../../src/services/messaging/MessageTemplates");

describe("MessageTemplates", () => {
  describe("DEFAULT_TEMPLATES_AR", () => {
    it("should have appointment_reminder template", () => {
      expect(DEFAULT_TEMPLATES_AR.appointment_reminder).toBeDefined();
      expect(DEFAULT_TEMPLATES_AR.appointment_reminder.text).toContain("{{patientName}}");
      expect(DEFAULT_TEMPLATES_AR.appointment_reminder.text).toContain("{{date}}");
      expect(DEFAULT_TEMPLATES_AR.appointment_reminder.text).toContain("{{time}}");
    });

    it("should have html and text versions for all templates", () => {
      for (const [key, template] of Object.entries(DEFAULT_TEMPLATES_AR)) {
        expect(template.text).toBeDefined();
        expect(template.html).toBeDefined();
        expect(typeof template.text).toBe("string");
        expect(typeof template.html).toBe("string");
      }
    });

    it("should have whatsappParams array for all templates", () => {
      for (const [key, template] of Object.entries(DEFAULT_TEMPLATES_AR)) {
        expect(Array.isArray(template.whatsappParams)).toBe(true);
      }
    });

    it("should include clinicName in templates", () => {
      expect(DEFAULT_TEMPLATES_AR.appointment_reminder.text).toContain("{{clinicName}}");
      expect(DEFAULT_TEMPLATES_AR.welcome.text).toContain("{{clinicName}}");
    });

    it("should have all required template types", () => {
      const requiredTypes = [
        "appointment_reminder",
        "appointment_confirmation",
        "appointment_cancellation",
        "appointment_rescheduled",
        "overdue_invoice",
        "welcome",
        "thank_you_visit",
        "general",
      ];
      for (const type of requiredTypes) {
        expect(DEFAULT_TEMPLATES_AR[type]).toBeDefined();
      }
    });
  });

  describe("DEFAULT_TEMPLATES_EN", () => {
    it("should have appointment_reminder template in English", () => {
      expect(DEFAULT_TEMPLATES_EN.appointment_reminder).toBeDefined();
      expect(DEFAULT_TEMPLATES_EN.appointment_reminder.text).toContain("{{patientName}}");
      expect(DEFAULT_TEMPLATES_EN.appointment_reminder.text).toContain("Appointment");
    });

    it("should have all required template types", () => {
      const requiredTypes = [
        "appointment_reminder",
        "appointment_confirmation",
        "appointment_cancellation",
        "overdue_invoice",
        "welcome",
        "general",
      ];
      for (const type of requiredTypes) {
        expect(DEFAULT_TEMPLATES_EN[type]).toBeDefined();
      }
    });
  });

  describe("WHATSAPP_CLOUD_TEMPLATES_AR", () => {
    it("should be an array", () => {
      expect(Array.isArray(WHATSAPP_CLOUD_TEMPLATES_AR)).toBe(true);
    });

    it("should have name, language, category, body, and params for each template", () => {
      for (const template of WHATSAPP_CLOUD_TEMPLATES_AR) {
        expect(template.name).toBeDefined();
        expect(template.language).toBe("ar");
        expect(template.category).toBeDefined();
        expect(template.body).toBeDefined();
        expect(Array.isArray(template.params)).toBe(true);
      }
    });

    it("should include appointment_reminder template", () => {
      const reminder = WHATSAPP_CLOUD_TEMPLATES_AR.find((t) => t.name === "appointment_reminder");
      expect(reminder).toBeDefined();
      expect(reminder.params).toContain("patientName");
      expect(reminder.params).toContain("date");
      expect(reminder.params).toContain("time");
    });

    it("should include appointment_rescheduled, appointment_missed, invoice_paid", () => {
      const names = WHATSAPP_CLOUD_TEMPLATES_AR.map((t) => t.name);
      expect(names).toContain("appointment_rescheduled");
      expect(names).toContain("appointment_missed");
      expect(names).toContain("invoice_paid");
    });
  });

  describe("WHATSAPP_CLOUD_TEMPLATES_EN", () => {
    it("should be an array", () => {
      expect(Array.isArray(WHATSAPP_CLOUD_TEMPLATES_EN)).toBe(true);
    });

    it("should have name, language, category, body, and params for each template", () => {
      for (const template of WHATSAPP_CLOUD_TEMPLATES_EN) {
        expect(template.name).toBeDefined();
        expect(template.language).toBe("en");
        expect(template.category).toBeDefined();
        expect(template.body).toBeDefined();
        expect(Array.isArray(template.params)).toBe(true);
      }
    });

    it("should include appointment_reminder template", () => {
      const reminder = WHATSAPP_CLOUD_TEMPLATES_EN.find((t) => t.name === "appointment_reminder");
      expect(reminder).toBeDefined();
      expect(reminder.params).toContain("patientName");
      expect(reminder.params).toContain("date");
      expect(reminder.params).toContain("time");
    });

    it("should include appointment_rescheduled, appointment_missed, invoice_paid", () => {
      const names = WHATSAPP_CLOUD_TEMPLATES_EN.map((t) => t.name);
      expect(names).toContain("appointment_rescheduled");
      expect(names).toContain("appointment_missed");
      expect(names).toContain("invoice_paid");
    });
  });
});

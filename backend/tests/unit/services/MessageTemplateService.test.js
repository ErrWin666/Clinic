const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { Settings, Patient, Appointment, Invoice } = require("../../../src/models");
const MessageTemplateService = require("../../../src/services/messaging");

describe("MessageTemplateService", () => {
  let service;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    // Seed clinic settings
    await Settings.bulkCreate([
      { key: "clinic.name", value: JSON.stringify("عيادة النور"), category: "clinic" },
      { key: "clinic.phone", value: JSON.stringify("01012345678"), category: "clinic" },
      { key: "clinic.address", value: JSON.stringify("شارع الجمهورية"), category: "clinic" },
      { key: "clinic.email", value: JSON.stringify("info@noor.com"), category: "clinic" },
      { key: "clinic.currency", value: JSON.stringify("EGP"), category: "clinic" },
      { key: "clinic.language", value: JSON.stringify("ar"), category: "clinic" },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(() => {
    service = new MessageTemplateService();
  });

  describe("getClinicInfo", () => {
    it("should load clinic settings from the database", async () => {
      const info = await service.getClinicInfo();
      expect(info.name).toBe("عيادة النور");
      expect(info.phone).toBe("01012345678");
      expect(info.address).toBe("شارع الجمهورية");
      expect(info.email).toBe("info@noor.com");
      expect(info.currency).toBe("EGP");
      expect(info.language).toBe("ar");
    });

    it("should return defaults when settings are missing", async () => {
      // Delete all clinic settings
      await Settings.destroy({ where: { category: "clinic" } });
      const info = await service.getClinicInfo();
      expect(info.name).toBe("العيادة");
      expect(info.currency).toBe("EGP");
      expect(info.language).toBe("ar");
      // Re-seed for subsequent tests
      await Settings.bulkCreate([
        { key: "clinic.name", value: JSON.stringify("عيادة النور"), category: "clinic" },
        { key: "clinic.phone", value: JSON.stringify("01012345678"), category: "clinic" },
        { key: "clinic.address", value: JSON.stringify("شارع الجمهورية"), category: "clinic" },
        { key: "clinic.email", value: JSON.stringify("info@noor.com"), category: "clinic" },
        { key: "clinic.currency", value: JSON.stringify("EGP"), category: "clinic" },
        { key: "clinic.language", value: JSON.stringify("ar"), category: "clinic" },
      ]);
    });
  });

  describe("render", () => {
    it("should interpolate variables in a template", () => {
      const result = service.render("Hello {{name}}, your code is {{code}}", {
        name: "Ahmed",
        code: "1234",
      });
      expect(result).toBe("Hello Ahmed, your code is 1234");
    });

    it("should replace missing variables with empty string", () => {
      const result = service.render("Hello {{name}}, code: {{code}}", { name: "Sara" });
      expect(result).toBe("Hello Sara, code: ");
    });

    it("should handle multiple occurrences of the same variable", () => {
      const result = service.render("{{x}} and {{x}}", { x: "YES" });
      expect(result).toBe("YES and YES");
    });
  });

  describe("renderText", () => {
    it("should render appointment_reminder with real clinic name", async () => {
      const clinicInfo = await service.getClinicInfo();
      const msg = await service.renderText(
        "appointment_reminder",
        { message: "Test", entityId: null, entityType: null },
        { fullName: "أحمد" },
        clinicInfo
      );
      expect(msg).toContain("أحمد");
      expect(msg).toContain("عيادة النور");
      expect(msg).toContain("تذكير موعد");
    });

    it("should render overdue_invoice with patient name", async () => {
      const clinicInfo = await service.getClinicInfo();
      const msg = await service.renderText(
        "overdue_invoice",
        { message: "Overdue", entityId: null, entityType: null },
        { fullName: "سارة" },
        clinicInfo
      );
      expect(msg).toContain("سارة");
      expect(msg).toContain("فاتورة");
    });

    it("should render welcome message", async () => {
      const clinicInfo = await service.getClinicInfo();
      const msg = await service.renderText(
        "welcome",
        { message: "" },
        { fullName: "محمد" },
        clinicInfo
      );
      expect(msg).toContain("محمد");
      expect(msg).toContain("مرحباً");
      expect(msg).toContain("عيادة النور");
    });

    it("should render thank_you_visit message", async () => {
      const clinicInfo = await service.getClinicInfo();
      const msg = await service.renderText(
        "thank_you_visit",
        { message: "" },
        { fullName: "فاطمة" },
        clinicInfo
      );
      expect(msg).toContain("فاطمة");
      expect(msg).toContain("شكراً");
    });

    it("should render medication_reminder message", async () => {
      const clinicInfo = await service.getClinicInfo();
      const msg = await service.renderText(
        "medication_reminder",
        { message: "" },
        { fullName: "علي" },
        clinicInfo
      );
      expect(msg).toContain("علي");
      expect(msg).toContain("دواء");
    });

    it("should fall back to general template for unknown types", async () => {
      const clinicInfo = await service.getClinicInfo();
      const msg = await service.renderText(
        "unknown_type",
        { message: "Custom message here" },
        { fullName: "Test" },
        clinicInfo
      );
      expect(msg).toContain("عيادة النور");
      expect(msg).toContain("Custom message here");
    });
  });

  describe("renderHtml", () => {
    it("should render HTML with bold tags for Telegram", async () => {
      const clinicInfo = await service.getClinicInfo();
      const html = await service.renderHtml(
        "appointment_reminder",
        { message: "Test", entityId: null, entityType: null },
        { fullName: "Test" },
        clinicInfo
      );
      expect(html).toContain("<b>");
      expect(html).toContain("</b>");
      expect(html).toContain("Test");
      expect(html).toContain("عيادة النور");
    });

    it("should render HTML for welcome with contact info", async () => {
      const clinicInfo = await service.getClinicInfo();
      const html = await service.renderHtml(
        "welcome",
        { message: "" },
        { fullName: "New Patient" },
        clinicInfo
      );
      expect(html).toContain("<b>");
      expect(html).toContain("New Patient");
      expect(html).toContain("01012345678"); // clinic phone
      expect(html).toContain("شارع الجمهورية"); // clinic address
    });
  });

  describe("buildVariables — entity data extraction", () => {
    it("should extract date/time from Appointment entity", async () => {
      const clinicInfo = await service.getClinicInfo();
      const patient = await Patient.create({
        displayId: `P-${Date.now()}`,
        fullName: "Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "01000000000",
      });
      const apt = await Appointment.create({
        displayId: `APT-${Date.now()}`,
        patientId: patient.id,
        appointmentDate: "2026-08-15",
        startTime: "10:30",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "scheduled",
      });

      const vars = await service.buildVariables(
        "appointment_reminder",
        { entityId: apt.id, entityType: "Appointment", message: "" },
        patient,
        clinicInfo
      );
      expect(vars.date).toBe("2026-08-15");
      expect(vars.time).toBe("10:30");
      expect(vars.appointmentType).toBe("checkup");
    });

    it("should extract invoiceId/amount from Invoice entity", async () => {
      const clinicInfo = await service.getClinicInfo();
      const patient = await Patient.create({
        displayId: `P-${Date.now()}-2`,
        fullName: "Invoice Patient",
        birthDate: "1985-05-05",
        gender: "female",
        phoneNumber: "01100000000",
      });
      const inv = await Invoice.create({
        displayId: "INV-TEST-001",
        patientId: patient.id,
        invoiceDate: "2026-07-01",
        totalAmount: 750,
        invoiceStatus: "unpaid",
        dueDate: "2026-08-01",
      });

      const vars = await service.buildVariables(
        "overdue_invoice",
        { entityId: inv.id, entityType: "Invoice", message: "" },
        patient,
        clinicInfo
      );
      expect(vars.invoiceId).toBe("INV-TEST-001");
      expect(vars.amount).toBe("750");
    });

    it("should return empty entity fields when no entityId", async () => {
      const clinicInfo = await service.getClinicInfo();
      const vars = await service.buildVariables(
        "appointment_reminder",
        { entityId: null, entityType: null, message: "Test" },
        { fullName: "Test" },
        clinicInfo
      );
      expect(vars.date).toBe("");
      expect(vars.time).toBe("");
      expect(vars.patientName).toBe("Test");
      expect(vars.clinicName).toBe("عيادة النور");
    });
  });

  describe("getWhatsAppCloudParams", () => {
    it("should return ordered params for appointment_reminder", async () => {
      const clinicInfo = await service.getClinicInfo();
      const patient = await Patient.create({
        displayId: `P-${Date.now()}-3`,
        fullName: "WA Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "01200000000",
      });
      const apt = await Appointment.create({
        displayId: `APT-${Date.now()}-2`,
        patientId: patient.id,
        appointmentDate: "2026-09-01",
        startTime: "14:00",
        endTime: "14:30",
        appointmentType: "follow_up",
        status: "scheduled",
      });

      const params = await service.getWhatsAppCloudParams(
        "appointment_reminder",
        { entityId: apt.id, entityType: "Appointment", message: "" },
        patient,
        clinicInfo
      );
      // appointment_reminder template params: [patientName, date, time]
      expect(params).toHaveLength(3);
      expect(params[0]).toBe("WA Patient");
      expect(params[1]).toBe("2026-09-01");
      expect(params[2]).toBe("14:00");
    });

    it("should return 4 params for overdue_invoice", async () => {
      const clinicInfo = await service.getClinicInfo();
      const params = await service.getWhatsAppCloudParams(
        "overdue_invoice",
        { entityId: null, entityType: null, message: "" },
        { fullName: "Test" },
        clinicInfo
      );
      // invoice template params: [patientName, invoiceId, amount, currency]
      expect(params).toHaveLength(4);
      expect(params[0]).toBe("Test");
    });
  });

  describe("getWhatsAppTemplateName", () => {
    it("should map appointment_reminder to appointment_reminder", () => {
      expect(service.getWhatsAppTemplateName("appointment_reminder")).toBe("appointment_reminder");
    });

    it("should map overdue_invoice to invoice_notification", () => {
      expect(service.getWhatsAppTemplateName("overdue_invoice")).toBe("invoice_notification");
    });

    it("should map follow_up_due to follow_up_reminder", () => {
      expect(service.getWhatsAppTemplateName("follow_up_due")).toBe("follow_up_reminder");
    });

    it("should map welcome to welcome_message", () => {
      expect(service.getWhatsAppTemplateName("welcome")).toBe("welcome_message");
    });

    it("should map appointment_rescheduled to appointment_rescheduled (not cancellation)", () => {
      expect(service.getWhatsAppTemplateName("appointment_rescheduled")).toBe("appointment_rescheduled");
    });

    it("should map appointment_missed to appointment_missed", () => {
      expect(service.getWhatsAppTemplateName("appointment_missed")).toBe("appointment_missed");
    });

    it("should map invoice_paid to invoice_paid (not invoice_notification)", () => {
      expect(service.getWhatsAppTemplateName("invoice_paid")).toBe("invoice_paid");
    });

    it("should return null for medication_reminder (no WhatsApp template)", () => {
      expect(service.getWhatsAppTemplateName("medication_reminder")).toBeNull();
    });

    it("should return null for general (no WhatsApp template)", () => {
      expect(service.getWhatsAppTemplateName("general")).toBeNull();
    });
  });

  describe("getWhatsAppCloudTemplateDefinitions", () => {
    it("should return Arabic template definitions by default", () => {
      const defs = service.getWhatsAppCloudTemplateDefinitions();
      expect(defs).toHaveLength(10);
      expect(defs[0]).toHaveProperty("name");
      expect(defs[0]).toHaveProperty("language");
      expect(defs[0]).toHaveProperty("body");
      expect(defs[0].body).toContain("{{1}}");
      expect(defs.every((d) => d.language === "ar")).toBe(true);
    });

    it("should return Arabic template definitions when lang=ar", () => {
      const defs = service.getWhatsAppCloudTemplateDefinitions("ar");
      expect(defs).toHaveLength(10);
      expect(defs.every((d) => d.language === "ar")).toBe(true);
      expect(defs[0].body).toContain("تذكير");
    });

    it("should return English template definitions when lang=en", () => {
      const defs = service.getWhatsAppCloudTemplateDefinitions("en");
      expect(defs).toHaveLength(10);
      expect(defs.every((d) => d.language === "en")).toBe(true);
      expect(defs[0].body).toContain("Appointment Reminder");
      expect(defs[0].body).toContain("{{1}}");
    });

    it("should include appointment_rescheduled, appointment_missed, invoice_paid in ar", () => {
      const defs = service.getWhatsAppCloudTemplateDefinitions("ar");
      const names = defs.map((d) => d.name);
      expect(names).toContain("appointment_rescheduled");
      expect(names).toContain("appointment_missed");
      expect(names).toContain("invoice_paid");
    });

    it("should include appointment_rescheduled, appointment_missed, invoice_paid in en", () => {
      const defs = service.getWhatsAppCloudTemplateDefinitions("en");
      const names = defs.map((d) => d.name);
      expect(names).toContain("appointment_rescheduled");
      expect(names).toContain("appointment_missed");
      expect(names).toContain("invoice_paid");
    });

    it("should have matching template names between ar and en", () => {
      const arDefs = service.getWhatsAppCloudTemplateDefinitions("ar");
      const enDefs = service.getWhatsAppCloudTemplateDefinitions("en");
      const arNames = arDefs.map((d) => d.name).sort();
      const enNames = enDefs.map((d) => d.name).sort();
      expect(arNames).toEqual(enNames);
    });

    it("should have matching params between ar and en for each template", () => {
      const arDefs = service.getWhatsAppCloudTemplateDefinitions("ar");
      const enDefs = service.getWhatsAppCloudTemplateDefinitions("en");
      for (let i = 0; i < arDefs.length; i++) {
        expect(arDefs[i].params).toEqual(enDefs[i].params);
      }
    });
  });

  describe("listTemplateTypes", () => {
    it("should list all available template types", () => {
      const types = service.listTemplateTypes();
      expect(types).toContain("appointment_reminder");
      expect(types).toContain("overdue_invoice");
      expect(types).toContain("follow_up_due");
      expect(types).toContain("welcome");
      expect(types).toContain("thank_you_visit");
      expect(types).toContain("medication_reminder");
      expect(types).toContain("general");
      expect(types).toContain("appointment_missed");
      expect(types).toContain("invoice_paid");
    });
  });

  describe("English templates", () => {
    it("should render English appointment reminder", async () => {
      const templates = await service.getTemplates("en");
      expect(templates.appointment_reminder.text).toContain("Appointment");
      expect(templates.appointment_reminder.text).toContain("{{patientName}}");
    });

    it("should render English welcome message", async () => {
      const templates = await service.getTemplates("en");
      expect(templates.welcome.text).toContain("Welcome");
    });
  });

  describe("getClinicInfo - non-JSON values", () => {
    it("should handle non-JSON setting values gracefully", async () => {
      await Settings.destroy({ where: { category: "clinic" } });
      await Settings.bulkCreate([
        { key: "clinic.name", value: "Plain String Name", category: "clinic" },
        { key: "clinic.phone", value: "01012345678", category: "clinic" },
      ]);
      const info = await service.getClinicInfo();
      expect(info.name).toBe("Plain String Name");
      expect(info.phone).toBe("01012345678");
      // Re-seed
      await Settings.destroy({ where: { category: "clinic" } });
      await Settings.bulkCreate([
        { key: "clinic.name", value: JSON.stringify("عيادة النور"), category: "clinic" },
        { key: "clinic.phone", value: JSON.stringify("01012345678"), category: "clinic" },
        { key: "clinic.address", value: JSON.stringify("شارع الجمهورية"), category: "clinic" },
        { key: "clinic.email", value: JSON.stringify("info@noor.com"), category: "clinic" },
        { key: "clinic.currency", value: JSON.stringify("EGP"), category: "clinic" },
        { key: "clinic.language", value: JSON.stringify("ar"), category: "clinic" },
      ]);
    });
  });

  describe("getCustomTemplates - non-JSON values", () => {
    it("should handle non-JSON custom template values", async () => {
      await Settings.create({
        key: "message_templates.appointment_reminder",
        value: "Plain text template",
        category: "message_templates",
      });
      const custom = await service.getCustomTemplates();
      expect(custom["message_templates.appointment_reminder"]).toBe("Plain text template");
      await Settings.destroy({ where: { key: "message_templates.appointment_reminder" } });
    });

    it("should return empty object on error", async () => {
      jest.spyOn(Settings, "findAll").mockRejectedValueOnce(new Error("DB error"));
      const custom = await service.getCustomTemplates();
      expect(custom).toEqual({});
      jest.restoreAllMocks();
    });
  });

  describe("buildVariables - follow_up_due with EyeExamination", () => {
    it("should extract lastVisitDate from EyeExamination entity", async () => {
      const { EyeExamination } = require("../../../src/models");
      const clinicInfo = await service.getClinicInfo();
      const patient = await Patient.create({
        displayId: `P-${Date.now()}-fu`,
        fullName: "Follow Up Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "01500000000",
      });
      const exam = await EyeExamination.create({
        displayId: `EX-${Date.now()}`,
        patientId: patient.id,
        examDate: "2026-06-01",
        findings: "Normal",
      });

      const vars = await service.buildVariables(
        "follow_up_due",
        { entityId: exam.id, entityType: "EyeExamination", message: "" },
        patient,
        clinicInfo
      );
      expect(vars.lastVisitDate).toBe("2026-06-01");
    });

    it("should handle entity lookup error gracefully", async () => {
      const clinicInfo = await service.getClinicInfo();
      const vars = await service.buildVariables(
        "appointment_reminder",
        { entityId: 99999, entityType: "Appointment", message: "" },
        { fullName: "Test" },
        clinicInfo
      );
      // Should not throw, vars should have empty entity fields
      expect(vars.date).toBe("");
    });
  });
});

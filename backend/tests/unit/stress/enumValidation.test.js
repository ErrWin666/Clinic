const ENUMS = require("../../../src/constants/enums");

describe("Enum Validation", () => {
  describe("PATIENT_TYPE", () => {
    it("should contain regular, guardian, child", () => {
      expect(ENUMS.PATIENT_TYPE).toContain("regular");
      expect(ENUMS.PATIENT_TYPE).toContain("guardian");
      expect(ENUMS.PATIENT_TYPE).toContain("child");
    });
  });

  describe("GENDER", () => {
    it("should contain male and female", () => {
      expect(ENUMS.GENDER).toContain("male");
      expect(ENUMS.GENDER).toContain("female");
    });
  });

  describe("RELATION_TYPE", () => {
    it("should contain all valid relation types", () => {
      expect(ENUMS.RELATION_TYPE).toContain("father");
      expect(ENUMS.RELATION_TYPE).toContain("mother");
      expect(ENUMS.RELATION_TYPE).toContain("guardian");
      expect(ENUMS.RELATION_TYPE).toContain("single-father");
      expect(ENUMS.RELATION_TYPE).toContain("single-mother");
    });
  });

  describe("APPOINTMENT_STATUS", () => {
    it("should contain all valid statuses", () => {
      expect(ENUMS.APPOINTMENT_STATUS).toContain("upcoming");
      expect(ENUMS.APPOINTMENT_STATUS).toContain("completed");
      expect(ENUMS.APPOINTMENT_STATUS).toContain("cancelled");
      expect(ENUMS.APPOINTMENT_STATUS).toContain("no-show");
      expect(ENUMS.APPOINTMENT_STATUS).toContain("rescheduled");
    });
  });

  describe("EXAM_STATUS", () => {
    it("should contain pending, completed, cancelled", () => {
      expect(ENUMS.EXAM_STATUS).toContain("pending");
      expect(ENUMS.EXAM_STATUS).toContain("completed");
      expect(ENUMS.EXAM_STATUS).toContain("cancelled");
    });
  });

  describe("INVOICE_STATUS", () => {
    it("should contain unpaid, paid, partially-paid, overdue", () => {
      expect(ENUMS.INVOICE_STATUS).toContain("unpaid");
      expect(ENUMS.INVOICE_STATUS).toContain("paid");
      expect(ENUMS.INVOICE_STATUS).toContain("partially-paid");
      expect(ENUMS.INVOICE_STATUS).toContain("overdue");
      expect(ENUMS.INVOICE_STATUS).toContain("cancelled");
    });

    it("should have exactly 5 statuses", () => {
      expect(ENUMS.INVOICE_STATUS.length).toBe(5);
    });
  });

  describe("NOTIFICATION_TYPE", () => {
    it("should contain all valid notification types", () => {
      expect(ENUMS.NOTIFICATION_TYPE).toContain("appointment_reminder");
      expect(ENUMS.NOTIFICATION_TYPE).toContain("overdue_invoice");
      expect(ENUMS.NOTIFICATION_TYPE).toContain("follow_up_due");
    });
  });

  describe("BACKUP_STATUS", () => {
    it("should contain success and failed", () => {
      expect(ENUMS.BACKUP_STATUS).toContain("success");
      expect(ENUMS.BACKUP_STATUS).toContain("failed");
    });
  });

  describe("SETTINGS_CATEGORY", () => {
    it("should contain clinic, backup, notification, ui", () => {
      expect(ENUMS.SETTINGS_CATEGORY).toContain("clinic");
      expect(ENUMS.SETTINGS_CATEGORY).toContain("backup");
      expect(ENUMS.SETTINGS_CATEGORY).toContain("notification");
      expect(ENUMS.SETTINGS_CATEGORY).toContain("ui");
    });
  });

  describe("ALLOWED_FILE_TYPES", () => {
    it("should contain common file types", () => {
      expect(ENUMS.ALLOWED_FILE_TYPES).toContain("jpg");
      expect(ENUMS.ALLOWED_FILE_TYPES).toContain("pdf");
      expect(ENUMS.ALLOWED_FILE_TYPES).toContain("png");
    });
  });
});

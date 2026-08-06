const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient, createTestAppointment, createTestInvoice, createTestExam } = require("../../helpers/factories");
const ReportService = require("../../../src/services/reports");

describe("ReportService", () => {
  let reportService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    reportService = new ReportService();

    const patient = await createTestPatient({ fullName: "Report Patient", patientType: "regular" });
    await createTestPatient({ fullName: "Report Patient 2", patientType: "guardian", gender: "female" });

    await createTestAppointment(patient.id, {
      appointmentDate: "2026-07-01",
      startTime: "10:00",
      endTime: "11:00",
    });

    await createTestInvoice(patient.id, {
      invoiceDate: "2026-07-15",
      invoiceStatus: "paid",
      items: [{ description: "Report item", quantity: 1, unitPrice: 75.0 }],
    });

    await createTestExam(patient.id, { examDate: "2026-07-20" });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("exportPatients", () => {
    it("should return headers and rows", async () => {
      const { headers, rows } = await reportService.exportPatients({});
      expect(headers).toBeDefined();
      expect(headers).toContain("DisplayID");
      expect(headers).toContain("Full Name");
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by patientType", async () => {
      const { rows } = await reportService.exportPatients({ patientType: "guardian" });
      expect(rows.length).toBeGreaterThan(0);
      const typeIndex = 6;
      expect(rows.every((r) => r[typeIndex] === "guardian")).toBe(true);
    });

    it("should filter by gender", async () => {
      const { rows } = await reportService.exportPatients({ gender: "female" });
      expect(rows.length).toBeGreaterThan(0);
      const genderIndex = 3;
      expect(rows.every((r) => r[genderIndex] === "female")).toBe(true);
    });

    it("should filter by search term", async () => {
      const { rows } = await reportService.exportPatients({ search: "Report Patient" });
      expect(rows.length).toBeGreaterThan(0);
      const nameIndex = 1;
      expect(rows.every((r) => r[nameIndex].includes("Report Patient"))).toBe(true);
    });

    it("should filter by date range", async () => {
      const now = new Date().toISOString();
      const past = new Date(Date.now() - 86400000).toISOString();
      const { rows } = await reportService.exportPatients({ startDate: past, endDate: now });
      expect(rows).toBeDefined();
    });
  });

  describe("exportInvoices", () => {
    it("should return headers and rows", async () => {
      const { headers, rows } = await reportService.exportInvoices({});
      expect(headers).toBeDefined();
      expect(headers).toContain("DisplayID");
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const { rows } = await reportService.exportInvoices({ status: "paid" });
      expect(rows.length).toBeGreaterThan(0);
      const statusIndex = 3;
      expect(rows.every((r) => r[statusIndex] === "paid")).toBe(true);
    });

    it("should filter by date range", async () => {
      const { rows } = await reportService.exportInvoices({
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should include walk-in customer name when no patient", async () => {
      const InvoiceService = require("../../../src/services/InvoiceService");
      const invService = new InvoiceService();
      await invService.create({
        customerName: "Walk-in Report Customer",
        customerPhone: "5550000",
        invoiceDate: "2026-07-18",
        items: [{ description: "Walk-in item", quantity: 1, unitPrice: 30.0 }],
      });

      const { rows } = await reportService.exportInvoices({});
      const nameIndex = 2;
      const hasWalkIn = rows.some((r) => r[nameIndex] === "Walk-in Report Customer");
      expect(hasWalkIn).toBe(true);
    });
  });

  describe("exportAppointments", () => {
    it("should return headers and rows", async () => {
      const { headers, rows } = await reportService.exportAppointments({});
      expect(headers).toBeDefined();
      expect(headers).toContain("DisplayID");
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const { rows } = await reportService.exportAppointments({ status: "upcoming" });
      expect(rows.length).toBeGreaterThan(0);
      const statusIndex = 5;
      expect(rows.every((r) => r[statusIndex] === "upcoming")).toBe(true);
    });

    it("should filter by date range", async () => {
      const { rows } = await reportService.exportAppointments({
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      });
      expect(rows).toBeDefined();
    });

    it("should include quick appointment name when no patient", async () => {
      const AppointmentService = require("../../../src/services/AppointmentService");
      const aptService = new AppointmentService();
      await aptService.create({
        appointmentDate: "2026-07-10",
        startTime: "13:00",
        endTime: "14:00",
        appointmentType: "checkup",
        quickName: "Quick Report Person",
        quickPhone: "5551111",
      });

      const { rows } = await reportService.exportAppointments({});
      const nameIndex = 6;
      const hasQuick = rows.some((r) => r[nameIndex] === "Quick Report Person");
      expect(hasQuick).toBe(true);
    });
  });
});

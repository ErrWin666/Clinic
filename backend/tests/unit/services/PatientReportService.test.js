const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const PatientReportService = require("../../../src/services/reports/PatientReportService");
const { Invoice, Patient } = require("../../../src/models");
const { generateDisplayId } = require("../../../src/utils/displayId");

describe("PatientReportService", () => {
  let service;

  beforeAll(async () => {
    await setupTestDB();
    service = new PatientReportService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("exportPatients", () => {
    it("should return empty export when no patients", async () => {
      const result = await service.exportPatients({});
      expect(result.headers).toBeDefined();
      expect(result.rows).toEqual([]);
    });

    it("should export patients with correct headers", async () => {
      await createTestPatient({ fullName: "Export Patient 1", phoneNumber: "5550000001" });

      const result = await service.exportPatients({});
      expect(result.headers).toContain("DisplayID");
      expect(result.headers).toContain("Full Name");
      expect(result.headers).toContain("Phone");
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should filter by patient type", async () => {
      await createTestPatient({ fullName: "Regular Type", phoneNumber: "5550000002", patientType: "regular" });
      await createTestPatient({ fullName: "Child Type", phoneNumber: "5550000003", patientType: "child" });

      const result = await service.exportPatients({ patientType: "child" });
      expect(result.rows.length).toBe(1);
      expect(result.rows[0][6]).toBe("child");
    });

    it("should filter by gender", async () => {
      await createTestPatient({ fullName: "Male Patient", phoneNumber: "5550000004", gender: "male" });
      await createTestPatient({ fullName: "Female Patient", phoneNumber: "5550000005", gender: "female" });

      const result = await service.exportPatients({ gender: "female" });
      expect(result.rows.length).toBe(1);
      expect(result.rows[0][3]).toBe("female");
    });

    it("should filter by search term", async () => {
      await createTestPatient({ fullName: "Searchable Name", phoneNumber: "5550000006" });

      const result = await service.exportPatients({ search: "Searchable" });
      expect(result.rows.length).toBe(1);
      expect(result.rows[0][1]).toContain("Searchable");
    });
  });

  describe("exportInvoices", () => {
    it("should return empty export when no invoices", async () => {
      const result = await service.exportInvoices({});
      expect(result.headers).toBeDefined();
      expect(result.rows).toEqual([]);
    });

    it("should export invoices with correct headers", async () => {
      const patient = await createTestPatient({ fullName: "Invoice Export Patient", phoneNumber: "5550000007" });
      const displayId = await generateDisplayId(Invoice, "INV");
      await Invoice.create({
        displayId,
        patientId: patient.id,
        invoiceDate: "2026-06-01",
        invoiceStatus: "paid",
        totalAmount: 150,
      });

      const result = await service.exportInvoices({});
      expect(result.headers).toContain("DisplayID");
      expect(result.headers).toContain("Status");
      expect(result.headers).toContain("Total");
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const patient = await createTestPatient({ fullName: "Status Filter Patient", phoneNumber: "5550000008" });
      const d1 = await generateDisplayId(Invoice, "INV");
      await Invoice.create({
        displayId: d1,
        patientId: patient.id,
        invoiceDate: "2026-07-15",
        invoiceStatus: "paid",
        totalAmount: 100,
      });
      const d2 = await generateDisplayId(Invoice, "INV");
      await Invoice.create({
        displayId: d2,
        patientId: patient.id,
        invoiceDate: "2026-07-16",
        invoiceStatus: "unpaid",
        totalAmount: 200,
      });

      const result = await service.exportInvoices({ status: "paid", patientId: patient.id });
      expect(result.rows.length).toBe(1);
      expect(result.rows[0][3]).toBe("paid");
    });
  });
});

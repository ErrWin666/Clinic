const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const PatientService = require("../../../src/services/PatientService");
const CustomError = require("../../../src/utils/CustomError");

jest.mock("../../../src/utils/pdf/pdfPatientSummary", () => ({
  generatePatientSummaryPDF: jest.fn(),
}));

describe("PatientService", () => {
  let patientService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a patient with displayId", async () => {
      const patient = await patientService.create({
        fullName: "John Doe",
        birthDate: "1990-01-15",
        gender: "male",
        phoneNumber: "1234567890",
      });
      expect(patient).toBeDefined();
      expect(patient.displayId).toBe("P-0001");
      expect(patient.fullName).toBe("John Doe");
    });

    it("should throw 409 for duplicate email", async () => {
      await patientService.create({
        fullName: "Jane Doe",
        birthDate: "1991-02-20",
        gender: "female",
        phoneNumber: "0987654321",
        email: "jane@test.com",
      });
      await expect(
        patientService.create({
          fullName: "Jane Clone",
          birthDate: "1991-02-20",
          gender: "female",
          phoneNumber: "1111111111",
          email: "jane@test.com",
        })
      ).rejects.toThrow(CustomError);
    });
  });

  describe("getById", () => {
    it("should return patient with relations", async () => {
      const created = await patientService.create({
        fullName: "Test Patient",
        birthDate: "1985-05-10",
        gender: "male",
        phoneNumber: "5555555555",
      });
      const patient = await patientService.getById(created.id);
      expect(patient).toBeDefined();
      expect(patient.fullName).toBe("Test Patient");
    });

    it("should throw 404 for non-existent patient", async () => {
      await expect(patientService.getById(99999)).rejects.toThrow(CustomError);
      try {
        await patientService.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should return paginated patients", async () => {
      const { rows, pagination } = await patientService.list({ page: 1, pageSize: 10 });
      expect(rows).toBeDefined();
      expect(pagination).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should search by fullName", async () => {
      const { rows } = await patientService.list({ search: "John" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.fullName.includes("John"))).toBe(true);
    });

    it("should search by phoneNumber", async () => {
      const { rows } = await patientService.list({ search: "1234567890" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.phoneNumber.includes("1234567890"))).toBe(true);
    });

    it("should search by displayId", async () => {
      const { rows } = await patientService.list({ search: "P-0001" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by gender", async () => {
      const { rows } = await patientService.list({ gender: "male" });
      expect(rows.every((r) => r.gender === "male")).toBe(true);
    });

    it("should filter by patientType", async () => {
      const { rows } = await patientService.list({ patientType: "regular" });
      expect(rows.every((r) => r.patientType === "regular")).toBe(true);
    });

    it("should filter by minAge", async () => {
      const { rows } = await patientService.list({ minAge: 30 });
      const now = new Date();
      for (const r of rows) {
        const birth = new Date(r.birthDate);
        const age = now.getFullYear() - birth.getFullYear();
        expect(age).toBeGreaterThanOrEqual(30);
      }
    });

    it("should filter by maxAge", async () => {
      const { rows } = await patientService.list({ maxAge: 40 });
      const now = new Date();
      for (const r of rows) {
        const birth = new Date(r.birthDate);
        const age = now.getFullYear() - birth.getFullYear();
        expect(age).toBeLessThanOrEqual(40);
      }
    });

    it("should filter by minAge and maxAge together", async () => {
      const { rows } = await patientService.list({ minAge: 20, maxAge: 50 });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should sort by fullName ascending", async () => {
      const { rows } = await patientService.list({ sortBy: "fullName", sortOrder: "ASC" });
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].fullName >= rows[i - 1].fullName).toBe(true);
      }
    });

    it("should sort by createdAt descending (default)", async () => {
      const { rows } = await patientService.list({});
      for (let i = 1; i < rows.length; i++) {
        expect(new Date(rows[i].createdAt) <= new Date(rows[i - 1].createdAt)).toBe(true);
      }
    });
  });

  describe("autocomplete", () => {
    it("should return matching patients", async () => {
      const results = await patientService.autocomplete("John", 5);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].fullName).toContain("John");
    });

    it("should return empty for non-matching term", async () => {
      const results = await patientService.autocomplete("ZZZZNONEXIST", 5);
      expect(results.length).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const results = await patientService.autocomplete("", 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("update", () => {
    it("should update patient name", async () => {
      const created = await patientService.create({
        fullName: "Update Me",
        birthDate: "2000-01-01",
        gender: "male",
        phoneNumber: "7777777777",
      });
      const updated = await patientService.update(created.id, { fullName: "Updated Name" });
      expect(updated.fullName).toBe("Updated Name");
    });

    it("should update email successfully", async () => {
      const created = await patientService.create({
        fullName: "Email Update",
        birthDate: "2000-01-01",
        gender: "female",
        phoneNumber: "6666666666",
      });
      const updated = await patientService.update(created.id, { email: "newemail@test.com" });
      expect(updated.email).toBe("newemail@test.com");
    });

    it("should reject duplicate email on update", async () => {
      const p1 = await patientService.create({
        fullName: "Email Owner",
        birthDate: "2000-01-01",
        gender: "male",
        phoneNumber: "5555550001",
        email: "owner@test.com",
      });
      const p2 = await patientService.create({
        fullName: "Email Taker",
        birthDate: "2000-01-01",
        gender: "female",
        phoneNumber: "5555550002",
      });
      await expect(
        patientService.update(p2.id, { email: "owner@test.com" })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("exportPatients", () => {
    it("should export all patients", async () => {
      const patients = await patientService.exportPatients({});
      expect(patients).toBeDefined();
      expect(patients.length).toBeGreaterThan(0);
    });

    it("should export with gender filter", async () => {
      const patients = await patientService.exportPatients({ gender: "male" });
      expect(patients.every((p) => p.gender === "male")).toBe(true);
    });

    it("should export with patientType filter", async () => {
      const patients = await patientService.exportPatients({ patientType: "regular" });
      expect(patients.every((p) => p.patientType === "regular")).toBe(true);
    });

    it("should export with search filter", async () => {
      const patients = await patientService.exportPatients({ search: "John" });
      expect(patients.some((p) => p.fullName.includes("John"))).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete patient without unpaid invoices", async () => {
      const created = await patientService.create({
        fullName: "Delete Me",
        birthDate: "2000-01-01",
        gender: "female",
        phoneNumber: "8888888888",
      });
      await patientService.delete(created.id);
      await expect(patientService.getById(created.id)).rejects.toThrow(CustomError);
    });

    it("should reject delete if patient has unpaid invoices", async () => {
      const InvoiceService = require("../../../src/services/InvoiceService");
      const invoiceService = new InvoiceService();

      const created = await patientService.create({
        fullName: "Has Invoices",
        birthDate: "2000-01-01",
        gender: "male",
        phoneNumber: "9999999999",
      });
      await invoiceService.create({
        patientId: created.id,
        invoiceDate: "2026-08-01",
        items: [{ description: "Unpaid", quantity: 1, unitPrice: 50.0 }],
      });
      await expect(patientService.delete(created.id)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("generateSummaryPDF", () => {
    it("should generate patient summary PDF", async () => {
      const { generatePatientSummaryPDF } = require("../../../src/utils/pdf/pdfPatientSummary");
      const patient = await patientService.create({
        fullName: "PDF Summary Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "555-pdf-test",
      });
      const mockDoc = { output: jest.fn().mockReturnValue("pdf-data") };
      generatePatientSummaryPDF.mockReturnValue(mockDoc);
      const result = await patientService.generateSummaryPDF(patient.id, { clinicName: "Test Clinic" });
      expect(result).toBeDefined();
      expect(generatePatientSummaryPDF).toHaveBeenCalled();
    });
  });
});

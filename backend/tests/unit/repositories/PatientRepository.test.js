const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const PatientRepository = require("../../../src/repositories/PatientRepository");
const { Invoice, Appointment } = require("../../../src/models");
const { generateDisplayId } = require("../../../src/utils/displayId");

describe("PatientRepository", () => {
  let repo;

  beforeAll(async () => {
    await setupTestDB();
    repo = new PatientRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("searchWithFilters", () => {
    it("should search with where clause and pagination", async () => {
      await createTestPatient({ fullName: "Search Patient 1" });
      const result = await repo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
        order: [["createdAt", "DESC"]],
      });
      expect(result.rows).toBeDefined();
      expect(result.count).toBeGreaterThan(0);
    });

    it("should use default order when not provided", async () => {
      await createTestPatient({ fullName: "Search Patient 2" });
      const result = await repo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
      });
      expect(result.rows).toBeDefined();
    });

    it("should use empty where when not provided", async () => {
      const result = await repo.searchWithFilters({
        offset: 0,
        limit: 5,
      });
      expect(result.rows).toBeDefined();
    });
  });

  describe("autocomplete", () => {
    it("should find patients by name", async () => {
      await createTestPatient({ fullName: "Autocomplete Test" });
      const result = await repo.autocomplete("Autocomplete");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].fullName).toContain("Autocomplete");
    });

    it("should use default limit of 10", async () => {
      const result = await repo.autocomplete("Test");
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should find patients by phone", async () => {
      await createTestPatient({ fullName: "Phone Search", phoneNumber: "5559999999" });
      const result = await repo.autocomplete("5559999999");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty for no matches", async () => {
      const result = await repo.autocomplete("XYZNOMATCH123");
      expect(result.length).toBe(0);
    });
  });

  describe("hasUnpaidInvoices", () => {
    it("should return true when patient has unpaid invoices", async () => {
      const patient = await createTestPatient({ fullName: "Unpaid Invoice Patient" });
      const invDisplayId = await generateDisplayId(Invoice, "INV");
      await Invoice.create({
        displayId: invDisplayId,
        patientId: patient.id,
        totalAmount: 100,
        paidAmount: 0,
        invoiceStatus: "unpaid",
        invoiceDate: new Date().toISOString().split("T")[0],
      });
      const result = await repo.hasUnpaidInvoices(patient.id);
      expect(result).toBe(true);
    });

    it("should return false when patient has no unpaid invoices", async () => {
      const patient = await createTestPatient({ fullName: "No Unpaid Patient" });
      const result = await repo.hasUnpaidInvoices(patient.id);
      expect(result).toBe(false);
    });
  });

  describe("findByIdWithRelations", () => {
    it("should return patient with relations", async () => {
      const patient = await createTestPatient({ fullName: "Relations Patient" });
      const result = await repo.findByIdWithRelations(patient.id);
      expect(result).not.toBeNull();
      expect(result.id).toBe(patient.id);
    });

    it("should return null for non-existent patient", async () => {
      const result = await repo.findByIdWithRelations(99999);
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find patient by email", async () => {
      await createTestPatient({ fullName: "Email Patient", email: "findbyemail@test.com" });
      const result = await repo.findByEmail("findbyemail@test.com");
      expect(result).not.toBeNull();
      expect(result.email).toBe("findbyemail@test.com");
    });

    it("should return null for non-existent email", async () => {
      const result = await repo.findByEmail("nonexistent@test.com");
      expect(result).toBeNull();
    });
  });
});

const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const { generateDisplayId, generateInvoiceDisplayId } = require("../../../src/utils/displayId");
const { Patient, Invoice, Appointment } = require("../../../src/models");

describe("Display ID Generation", () => {
  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("generateDisplayId", () => {
    it("should generate sequential patient IDs", async () => {
      const id1 = await generateDisplayId(Patient, "P");
      expect(id1).toBe("P-0001");

      await createTestPatient({ fullName: "ID Test 1" });

      const id2 = await generateDisplayId(Patient, "P");
      expect(id2).toBe("P-0002");
    });

    it("should generate sequential appointment IDs", async () => {
      const id1 = await generateDisplayId(Appointment, "APT");
      expect(id1).toBe("APT-0001");
    });
  });

  describe("generateInvoiceDisplayId", () => {
    it("should generate year-based invoice IDs", async () => {
      const id = await generateInvoiceDisplayId(Invoice);
      const year = new Date().getFullYear();
      expect(id).toBe(`INV-${year}-0001`);
    });

    it("should increment count for same year", async () => {
      await createTestPatient({ fullName: "Invoice ID Patient" });
      const InvoiceService = require("../../../src/services/InvoiceService");
      const svc = new InvoiceService();
      await svc.create({
        patientId: 1,
        invoiceDate: "2026-07-23",
        items: [{ description: "X", quantity: 1, unitPrice: 10 }],
      });

      const id = await generateInvoiceDisplayId(Invoice);
      const year = new Date().getFullYear();
      expect(id).toBe(`INV-${year}-0002`);
    });
  });

  describe("sequential creation", () => {
    it("should generate unique displayIds for sequential patients", async () => {
      const patients = [];
      for (let i = 0; i < 5; i++) {
        patients.push(await createTestPatient({ fullName: `Sequential ${i}` }));
      }

      const displayIds = patients.map((p) => p.displayId);
      const uniqueIds = new Set(displayIds);
      expect(uniqueIds.size).toBe(displayIds.length);
    });
  });
});

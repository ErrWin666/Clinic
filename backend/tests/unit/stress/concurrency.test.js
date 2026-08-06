const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const AppointmentService = require("../../../src/services/AppointmentService");
const InvoiceService = require("../../../src/services/InvoiceService");

describe("Concurrency & Transaction Tests", () => {
  let appointmentService;
  let invoiceService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    appointmentService = new AppointmentService();
    invoiceService = new InvoiceService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("appointment conflict detection", () => {
    it("should reject second appointment with same time slot (conflict)", async () => {
      const patient = await createTestPatient({ fullName: "Conflict Apt Patient" });
      const patient2 = await createTestPatient({ fullName: "Conflict Apt Patient 2" });

      const aptData = {
        appointmentDate: "2026-09-15",
        startTime: "14:00",
        endTime: "15:00",
        appointmentType: "checkup",
      };

      await appointmentService.create({ ...aptData, patientId: patient.id });

      await expect(
        appointmentService.create({ ...aptData, patientId: patient2.id })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("sequential invoice creation", () => {
    it("should allow two invoices for same patient sequentially", async () => {
      const patient = await createTestPatient({ fullName: "Seq Inv Patient" });

      const invData = {
        invoiceDate: "2026-07-24",
        items: [{ description: "Seq item", quantity: 1, unitPrice: 25.0 }],
      };

      const inv1 = await invoiceService.create({ ...invData, patientId: patient.id });
      const inv2 = await invoiceService.create({ ...invData, patientId: patient.id });

      expect(inv1.displayId).not.toBe(inv2.displayId);
    });
  });

  describe("invoice transaction rollback", () => {
    it("should rollback invoice creation if item creation fails", async () => {
      const patient = await createTestPatient({ fullName: "Rollback Patient" });

      const { Invoice, InvoiceItem } = require("../../../src/models");
      const countBefore = await Invoice.count();

      await expect(
        invoiceService.create({
          patientId: patient.id,
          invoiceDate: "2026-07-26",
          items: [{ description: "Valid", quantity: 1, unitPrice: 10 }],
        })
      ).resolves.toBeDefined();

      const countAfterValid = await Invoice.count();
      expect(countAfterValid).toBe(countBefore + 1);

      const originalCreate = InvoiceItem.create;
      InvoiceItem.create = jest.fn().mockRejectedValue(new Error("DB error"));

      try {
        await expect(
          invoiceService.create({
            patientId: patient.id,
            invoiceDate: "2026-07-27",
            items: [{ description: "Will fail", quantity: 1, unitPrice: 10 }],
          })
        ).rejects.toThrow();
      } finally {
        InvoiceItem.create = originalCreate;
      }

      const countAfterFailed = await Invoice.count();
      expect(countAfterFailed).toBe(countAfterValid);
    });
  });
});

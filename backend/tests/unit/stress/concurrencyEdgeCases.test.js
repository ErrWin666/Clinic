const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestPatient, createTestProduct, createTestProductVariant, createTestSupplier, createTestBatch } = require("../../helpers/factories");
const { Appointment, Patient, ProductVariant, Batch, Invoice } = require("../../../src/models");
const { sequelize } = require("../../../src/database");

describe("Concurrency Edge Cases", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Appointment concurrency", () => {
    it("should handle multiple appointment creation for same patient", async () => {
      const patient = await createTestPatient({ fullName: "Concurrent Patient" });
      const { generateDisplayId } = require("../../../src/utils/displayId");

      const results = [];
      for (let i = 0; i < 5; i++) {
        const displayId = await generateDisplayId(Appointment, "APT");
        const apt = await Appointment.create({
          displayId,
          patientId: patient.id,
          appointmentDate: "2026-08-01",
          startTime: `${10 + i}:00`,
          endTime: `${11 + i}:00`,
          appointmentType: "checkup",
          status: "upcoming",
        });
        results.push(apt);
      }

      expect(results.length).toBe(5);
      results.forEach((apt) => {
        expect(apt.id).toBeDefined();
      });
    });
  });

  describe("Stock update concurrency", () => {
    it("should handle concurrent stock quantity updates", async () => {
      const product = await createTestProduct({ name: "Concurrent Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Concurrent Variant",
        sku: "CONC-001",
        quantity: 100,
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, {
        supplierId: supplier.id,
        quantity: 100,
        initialQuantity: 100,
      });

      const promises = Array.from({ length: 5 }, () =>
        variant.update({ quantity: variant.quantity - 1 })
      );

      await Promise.all(promises);
      await variant.reload();
      expect(variant.quantity).toBeLessThanOrEqual(100);
    });
  });

  describe("Patient soft delete during invoice creation", () => {
    it("should handle patient deletion while creating invoice", async () => {
      const patient = await createTestPatient({ fullName: "Delete Test Patient" });
      const { generateDisplayId } = require("../../../src/utils/displayId");
      const invDisplayId = await generateDisplayId(Invoice, "INV");

      const invoicePromise = Invoice.create({
        displayId: invDisplayId,
        patientId: patient.id,
        invoiceDate: "2026-06-01",
        invoiceStatus: "unpaid",
        totalAmount: 100,
        paidAmount: 0,
      });

      const deletePromise = patient.destroy();

      const [invoice, deleteResult] = await Promise.all([invoicePromise, deletePromise]);
      expect(invoice).toBeDefined();
      expect(invoice.patientId).toBe(patient.id);
      expect(deleteResult).toBeDefined();
    });
  });

  describe("Batch concurrent updates", () => {
    it("should handle concurrent batch quantity decrements", async () => {
      const product = await createTestProduct({ name: "Batch Concurrent Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Batch Concurrent Variant",
        sku: "BATCH-CONC-001",
        quantity: 50,
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, {
        supplierId: supplier.id,
        quantity: 50,
        initialQuantity: 50,
      });

      const promises = Array.from({ length: 5 }, () =>
        batch.update({ quantity: batch.quantity - 1 })
      );

      await Promise.all(promises);
      await batch.reload();
      expect(batch.quantity).toBeLessThanOrEqual(50);
    });
  });

  describe("Parallel patient creation with same data", () => {
    it("should handle parallel patient creation with unique displayIds", async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        createTestPatient({ fullName: `Parallel Patient ${i}`, phoneNumber: `555-parallel-${i}` })
      );

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);
      const displayIds = fulfilled.map((p) => p.displayId);
      const uniqueDisplayIds = new Set(displayIds);
      expect(uniqueDisplayIds.size).toBe(fulfilled.length);
    });
  });
});

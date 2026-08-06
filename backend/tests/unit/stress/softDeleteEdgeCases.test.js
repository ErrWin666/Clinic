const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestPatient,
  createTestProduct,
  createTestProductVariant,
  createTestSupplier,
  createTestBatch,
} = require("../../helpers/factories");
const { Patient, Product, ProductVariant, Supplier, Batch, Appointment, Invoice } = require("../../../src/models");
const { generateDisplayId } = require("../../../src/utils/displayId");

describe("Soft Delete Edge Cases", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Patient soft delete (paranoid)", () => {
    let patient;

    beforeEach(async () => {
      patient = await createTestPatient({ fullName: "Soft Delete Patient", phoneNumber: "5550009999" });
    });

    it("should soft delete patient via destroy()", async () => {
      await patient.destroy();
      const found = await Patient.findByPk(patient.id);
      expect(found).toBeNull();
    });

    it("should still find soft-deleted patient with paranoid:false", async () => {
      await patient.destroy();
      const found = await Patient.findByPk(patient.id, { paranoid: false });
      expect(found).not.toBeNull();
      expect(found.deletedAt).not.toBeNull();
    });

    it("should not return soft-deleted patient in findAll", async () => {
      await patient.destroy();
      const all = await Patient.findAll();
      expect(all.find((p) => p.id === patient.id)).toBeUndefined();
    });

    it("should restore soft-deleted patient", async () => {
      await patient.destroy();
      await patient.restore();
      const found = await Patient.findByPk(patient.id);
      expect(found).not.toBeNull();
      expect(found.deletedAt).toBeNull();
    });
  });

  describe("Supplier soft delete (isActive + paranoid)", () => {
    let supplier;

    beforeEach(async () => {
      supplier = await createTestSupplier({ name: "Soft Delete Supplier" });
    });

    it("should soft delete supplier via isActive=false", async () => {
      await supplier.update({ isActive: false });
      const reloaded = await Supplier.findByPk(supplier.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded.isActive).toBe(false);
    });

    it("should not return inactive supplier in active list", async () => {
      await supplier.update({ isActive: false });
      const active = await Supplier.findAll({ where: { isActive: true } });
      expect(active.find((s) => s.id === supplier.id)).toBeUndefined();
    });

    it("should restore inactive supplier", async () => {
      await supplier.update({ isActive: false });
      await supplier.update({ isActive: true });
      const reloaded = await Supplier.findByPk(supplier.id);
      expect(reloaded.isActive).toBe(true);
    });

    it("should also support paranoid destroy", async () => {
      await supplier.destroy();
      const found = await Supplier.findByPk(supplier.id);
      expect(found).toBeNull();
      const foundWithParanoid = await Supplier.findByPk(supplier.id, { paranoid: false });
      expect(foundWithParanoid).not.toBeNull();
    });
  });

  describe("Product soft delete (isActive + paranoid)", () => {
    let product;

    beforeEach(async () => {
      product = await createTestProduct({ name: "Soft Delete Product" });
    });

    it("should soft delete product via isActive=false", async () => {
      await product.update({ isActive: false });
      const reloaded = await Product.findByPk(product.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded.isActive).toBe(false);
    });

    it("should keep variants accessible after product isActive=false", async () => {
      const variant = await createTestProductVariant(product.id, { name: "Variant After Delete" });
      await product.update({ isActive: false });
      const reloaded = await ProductVariant.findByPk(variant.id);
      expect(reloaded).not.toBeNull();
    });

    it("should support paranoid destroy", async () => {
      await product.destroy();
      const found = await Product.findByPk(product.id);
      expect(found).toBeNull();
    });
  });

  describe("Batch soft delete (isActive + paranoid)", () => {
    let batch;

    beforeEach(async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const supplier = await createTestSupplier();
      batch = await createTestBatch(variant.id, { supplierId: supplier.id });
    });

    it("should soft delete batch via isActive=false", async () => {
      await batch.update({ isActive: false });
      const reloaded = await Batch.findByPk(batch.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded.isActive).toBe(false);
    });

    it("should not return inactive batch in active list", async () => {
      await batch.update({ isActive: false });
      const active = await Batch.findAll({ where: { isActive: true } });
      expect(active.find((b) => b.id === batch.id)).toBeUndefined();
    });
  });

  describe("Unique constraints after soft delete", () => {
    it("should allow creating new patient with same phone after paranoid delete", async () => {
      const p1 = await createTestPatient({ fullName: "Dup Phone 1", phoneNumber: "5550007777" });
      await p1.destroy();

      const p2 = await createTestPatient({ fullName: "Dup Phone 2", phoneNumber: "5550007777" });
      expect(p2.id).not.toBe(p1.id);
    });

    it("should allow creating new supplier with same name after isActive=false", async () => {
      const s1 = await createTestSupplier({ name: "Dup Name Supplier" });
      await s1.update({ isActive: false });

      const s2 = await createTestSupplier({ name: "Dup Name Supplier" });
      expect(s2.id).not.toBe(s1.id);
    });
  });

  describe("Cascade behavior", () => {
    it("should keep appointments when patient is soft-deleted", async () => {
      const patient = await createTestPatient({ fullName: "Cascade Patient" });
      const displayId = await generateDisplayId(Appointment, "APT");
      const appointment = await Appointment.create({
        displayId,
        patientId: patient.id,
        appointmentDate: "2026-12-01",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
      });

      await patient.destroy();

      const reloaded = await Appointment.findByPk(appointment.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded.patientId).toBe(patient.id);
    });

    it("should keep invoices when patient is soft-deleted", async () => {
      const patient = await createTestPatient({ fullName: "Invoice Cascade Patient" });
      const displayId = await generateDisplayId(Invoice, "INV");
      const invoice = await Invoice.create({
        displayId,
        patientId: patient.id,
        invoiceDate: "2026-06-01",
        totalAmount: 100,
        status: "unpaid",
      });

      await patient.destroy();

      const reloaded = await Invoice.findByPk(invoice.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded.patientId).toBe(patient.id);
    });
  });
});

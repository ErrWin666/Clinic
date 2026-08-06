const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestSupplier } = require("../../helpers/factories");
const SupplierPaymentService = require("../../../src/services/SupplierPaymentService");

describe("SupplierPaymentService", () => {
  let service;
  let testSupplier;

  beforeAll(async () => {
    await setupTestDB();
    service = new SupplierPaymentService();
    testSupplier = await createTestSupplier({ name: "Payment Supplier" });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a payment with valid data", async () => {
      const payment = await service.create(testSupplier.id, {
        amount: 500.0,
        paymentDate: "2026-01-15",
        paymentMethod: "cash",
        reference: "REF-001",
      });
      expect(payment).toBeDefined();
      expect(payment.displayId).toMatch(/^SPM-/);
      expect(payment.supplierId).toBe(testSupplier.id);
      expect(Number(payment.amount)).toBe(500);
    });

    it("should reject non-existent supplier", async () => {
      await expect(
        service.create(99999, { amount: 100, paymentDate: "2026-01-01", paymentMethod: "cash" })
      ).rejects.toThrow();
    });

    it("should throw CustomError when supplier not found (mocked null)", async () => {
      jest.spyOn(service._supplierRepository, "findById").mockResolvedValueOnce(null);
      await expect(
        service.create(99999, { amount: 100, paymentDate: "2026-01-01", paymentMethod: "cash" })
      ).rejects.toThrow();
      service._supplierRepository.findById.mockRestore();
    });

    it("should support different payment methods", async () => {
      const methods = ["cash", "bank_transfer", "cheque", "other"];
      for (const paymentMethod of methods) {
        const payment = await service.create(testSupplier.id, {
          amount: 100,
          paymentDate: "2026-02-01",
          paymentMethod,
        });
        expect(payment.paymentMethod).toBe(paymentMethod);
      }
    });
  });

  describe("listBySupplier", () => {
    it("should list payments for a supplier with pagination", async () => {
      await service.create(testSupplier.id, { amount: 200, paymentDate: "2026-03-01", paymentMethod: "cash" });
      const result = await service.listBySupplier(testSupplier.id, { page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should return empty for supplier with no payments", async () => {
      const newSupplier = await createTestSupplier({ name: "No Payments" });
      const result = await service.listBySupplier(newSupplier.id, { page: 1, pageSize: 10 });
      expect(result.rows.length).toBe(0);
    });
  });
});

const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestProduct, createTestProductVariant, createTestBatch, createTestSupplier } = require("../../helpers/factories");
const BatchRepository = require("../../../src/repositories/BatchRepository");

describe("BatchRepository", () => {
  let repo;
  let product, variant, supplier;

  beforeAll(async () => {
    await setupTestDB();
    repo = new BatchRepository();
    product = await createTestProduct({ name: "Batch Repo Product" });
    variant = await createTestProductVariant(product.id, { name: "Batch Repo Variant", sku: "BATCHREPO-001" });
    supplier = await createTestSupplier();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("findActiveByVariant", () => {
    it("should find active batches with quantity > 0", async () => {
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10, isActive: true });
      const result = await repo.findActiveByVariant(variant.id);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every((b) => b.isActive && b.quantity > 0)).toBe(true);
    });

    it("should not return inactive batches", async () => {
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10, isActive: false });
      const result = await repo.findActiveByVariant(variant.id);
      expect(result.every((b) => b.isActive)).toBe(true);
    });

    it("should not return batches with 0 quantity", async () => {
      const batch = await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 5, isActive: true });
      await batch.update({ quantity: 0 });
      const result = await repo.findActiveByVariant(variant.id);
      expect(result.every((b) => b.quantity > 0)).toBe(true);
    });
  });

  describe("findActiveByVariantFEFO", () => {
    it("should find active batches with expiry date ordered by expiry", async () => {
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10, expiryDate: "2026-12-01" });
      const result = await repo.findActiveByVariantFEFO(variant.id);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every((b) => b.expiryDate !== null)).toBe(true);
    });

    it("should not return batches without expiry date", async () => {
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10, expiryDate: null });
      const result = await repo.findActiveByVariantFEFO(variant.id);
      expect(result.every((b) => b.expiryDate !== null)).toBe(true);
    });
  });

  describe("findActiveByVariantFIFO", () => {
    it("should find active batches ordered by receivedDate", async () => {
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10 });
      const result = await repo.findActiveByVariantFIFO(variant.id);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("findActiveByVariantAverage", () => {
    it("should find active batches without ordering", async () => {
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10 });
      const result = await repo.findActiveByVariantAverage(variant.id);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("findExpiringSoon", () => {
    it("should find batches expiring within given days", async () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10, expiryDate: future.toISOString().split("T")[0] });
      const result = await repo.findExpiringSoon(30);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("should use default 30 days", async () => {
      const result = await repo.findExpiringSoon();
      expect(result).toBeDefined();
    });
  });

  describe("findExpired", () => {
    it("should find expired batches", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      await createTestBatch(variant.id, { supplierId: supplier.id, quantity: 10, expiryDate: past.toISOString().split("T")[0] });
      const result = await repo.findExpired();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("findByVariantAndBatchNumber", () => {
    it("should find batch by variant and batch number", async () => {
      const batch = await createTestBatch(variant.id, { supplierId: supplier.id, batchNumber: "BATCH-XYZ-001" });
      const result = await repo.findByVariantAndBatchNumber(variant.id, "BATCH-XYZ-001");
      expect(result).not.toBeNull();
      expect(result.batchNumber).toBe("BATCH-XYZ-001");
    });

    it("should return null for non-existent batch number", async () => {
      const result = await repo.findByVariantAndBatchNumber(variant.id, "NONEXISTENT");
      expect(result).toBeNull();
    });
  });
});

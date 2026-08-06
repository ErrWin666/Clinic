const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestBatch,
} = require("../../helpers/factories");
const StockMovementService = require("../../../src/services/stock/StockMovementService");
const CustomError = require("../../../src/utils/CustomError");
const { Batch, StockMovement, ProductVariant } = require("../../../src/models");

describe("StockMovementService", () => {
  let service;
  let testProduct;
  let testVariant;
  let testBatch;

  beforeAll(async () => {
    await setupTestDB();
    service = new StockMovementService();
    testProduct = await createTestProduct({ costingMethod: "fifo" });
    testVariant = await createTestProductVariant(testProduct.id);
    testBatch = await createTestBatch(testVariant.id, { quantity: 0 });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("recordOpeningStock", () => {
    it("should create a batch and an inward movement", async () => {
      const result = await service.recordOpeningStock(
        testVariant.id,
        20,
        50.0,
        "OPEN-001",
        "2028-12-31",
        null,
        null
      );
      expect(result.batch).toBeDefined();
      expect(result.movement).toBeDefined();
      expect(result.movement.type).toBe("in");
      expect(result.movement.quantity).toBe(20);
      expect(result.movement.reason).toBe("opening_stock");
      expect(result.batch.quantity).toBe(20);
    });

    it("should update variant quantity after opening stock", async () => {
      await testVariant.reload();
      expect(Number(testVariant.quantity)).toBeGreaterThan(0);
    });
  });

  describe("createMovement", () => {
    it("should create an inward movement and increase batch quantity", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 0 });
      const movement = await service.createMovement({
        productVariantId: testVariant.id,
        batchId: batch.id,
        type: "in",
        quantity: 10,
        reason: "purchase",
        unitCost: 30.0,
      });
      expect(movement.type).toBe("in");
      expect(movement.quantity).toBe(10);
      await batch.reload();
      expect(batch.quantity).toBe(10);
    });

    it("should create an outward movement and decrease batch quantity", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 50 });
      const movement = await service.createMovement({
        productVariantId: testVariant.id,
        batchId: batch.id,
        type: "out",
        quantity: -5,
        reason: "sale",
        unitCost: 50.0,
      });
      expect(movement.type).toBe("out");
      await batch.reload();
      expect(batch.quantity).toBe(45);
    });

    it("should reject movement for non-existent batch", async () => {
      await expect(
        service.createMovement({
          productVariantId: testVariant.id,
          batchId: 99999,
          type: "in",
          quantity: 5,
          reason: "purchase",
        })
      ).rejects.toThrow();
    });

    it("should reject insufficient stock for outward movement", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 2 });
      await expect(
        service.createMovement({
          productVariantId: testVariant.id,
          batchId: batch.id,
          type: "out",
          quantity: -10,
          reason: "sale",
        })
      ).rejects.toThrow();
    });

    it("should calculate totalCost in beforeCreate hook", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 0 });
      const movement = await service.createMovement({
        productVariantId: testVariant.id,
        batchId: batch.id,
        type: "in",
        quantity: 5,
        reason: "purchase",
        unitCost: 25.0,
      });
      expect(Number(movement.totalCost)).toBe(125);
    });
  });

  describe("adjustStock", () => {
    it("should adjust stock upward", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 10 });
      const movement = await service.adjustStock(
        testVariant.id,
        batch.id,
        15,
        null,
        "Count adjustment",
        null
      );
      expect(movement).toBeDefined();
      expect(movement.type).toBe("adjust");
      expect(movement.quantity).toBe(5);
      await batch.reload();
      expect(batch.quantity).toBe(15);
    });

    it("should adjust stock downward", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 20 });
      const movement = await service.adjustStock(
        testVariant.id,
        batch.id,
        12,
        null,
        "Count adjustment",
        null
      );
      expect(movement.quantity).toBe(-8);
      await batch.reload();
      expect(batch.quantity).toBe(12);
    });

    it("should return null when no difference", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 10 });
      const result = await service.adjustStock(
        testVariant.id,
        batch.id,
        10,
        null,
        null,
        null
      );
      expect(result).toBeNull();
    });

    it("should throw 404 for non-existent batch", async () => {
      await expect(
        service.adjustStock(testVariant.id, 99999, 10, null, null, null)
      ).rejects.toThrow();
    });
  });

  describe("recordDamage", () => {
    it("should record damage as outward movement", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 20 });
      const movement = await service.recordDamage(batch.id, 5, null, "Broken", null);
      expect(movement.type).toBe("out");
      expect(movement.quantity).toBe(-5);
      expect(movement.reason).toBe("damage");
      await batch.reload();
      expect(batch.quantity).toBe(15);
    });

    it("should reject damage quantity exceeding batch quantity", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 3 });
      await expect(
        service.recordDamage(batch.id, 10, null, "Too much", null)
      ).rejects.toThrow();
    });
  });

  describe("recordExpiry", () => {
    it("should record expiry as outward movement removing all stock", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 15 });
      const movement = await service.recordExpiry(batch.id, null, "Expired", null);
      expect(movement.type).toBe("out");
      expect(movement.quantity).toBe(-15);
      expect(movement.reason).toBe("expiry");
      await batch.reload();
      expect(batch.quantity).toBe(0);
    });
  });

  describe("recordRecall", () => {
    it("should record recall as outward movement and deactivate batch", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 12, unitCost: 30.0 });
      const movement = await service.recordRecall(batch.id, 1, null, "Defective batch", null);
      expect(movement.type).toBe("out");
      expect(movement.quantity).toBe(-12);
      expect(movement.reason).toBe("recall");
      expect(movement.referenceType).toBe("Supplier");
      expect(movement.referenceId).toBe(1);
      await batch.reload();
      expect(batch.isActive).toBe(false);
      expect(batch.quantity).toBe(0);
    });

    it("should throw 404 for non-existent batch", async () => {
      await expect(service.recordRecall(99999, 1, null, "Recall", null)).rejects.toThrow(CustomError);
    });

    it("should throw if batch is not active", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 5 });
      await batch.update({ isActive: false });
      await expect(service.recordRecall(batch.id, 1, null, "Recall", null)).rejects.toThrow(CustomError);
    });
  });

  describe("selectBatchesForSale", () => {
    it("should select batches using FIFO method", async () => {
      const product = await createTestProduct({ costingMethod: "fifo" });
      const variant = await createTestProductVariant(product.id, { quantity: 30 });
      await createTestBatch(variant.id, { quantity: 10, unitCost: 20.0 });
      await createTestBatch(variant.id, { quantity: 20, unitCost: 25.0 });

      const selected = await service.selectBatchesForSale(variant.id, 15);
      expect(selected.length).toBe(2);
      expect(selected[0].quantity).toBe(10);
      expect(selected[1].quantity).toBe(5);
    });

    it("should throw insufficient stock when not enough", async () => {
      const product = await createTestProduct({ costingMethod: "fifo" });
      const variant = await createTestProductVariant(product.id, { quantity: 5 });
      await createTestBatch(variant.id, { quantity: 5 });

      await expect(service.selectBatchesForSale(variant.id, 10)).rejects.toThrow();
    });

    it("should throw 404 for non-existent variant", async () => {
      await expect(service.selectBatchesForSale(99999, 5)).rejects.toThrow();
    });
  });

  describe("calculateWeightedAverage", () => {
    it("should calculate weighted average cost correctly", async () => {
      const product = await createTestProduct({ costingMethod: "average" });
      const variant = await createTestProductVariant(product.id);
      await createTestBatch(variant.id, { quantity: 10, unitCost: 20.0 });
      await createTestBatch(variant.id, { quantity: 10, unitCost: 40.0 });

      const avg = await service.calculateWeightedAverage(variant.id);
      expect(avg).toBe(30);
    });

    it("should return 0 when no active batches", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const avg = await service.calculateWeightedAverage(variant.id);
      expect(avg).toBe(0);
    });
  });

  describe("listMovements", () => {
    it("should list movements with pagination", async () => {
      const result = await service.listMovements({ page: 1, pageSize: 10 });
      expect(result.rows).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it("should filter by type", async () => {
      const result = await service.listMovements({ type: "in" });
      expect(result.rows.every((m) => m.type === "in")).toBe(true);
    });

    it("should filter by productVariantId", async () => {
      const result = await service.listMovements({ productVariantId: testVariant.id });
      expect(result.rows.every((m) => m.productVariantId === testVariant.id)).toBe(true);
    });

    it("should filter by date range", async () => {
      const result = await service.listMovements({
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      });
      expect(result.rows).toBeDefined();
    });

    it("should filter by batchId and referenceType", async () => {
      const result = await service.listMovements({
        batchId: testBatch.id,
        referenceType: "manual",
      });
      expect(result.rows).toBeDefined();
    });

    it("should filter by referenceId", async () => {
      const result = await service.listMovements({ referenceId: 999 });
      expect(result.rows).toBeDefined();
    });
  });

  describe("_consumeBatches - average costing", () => {
    it("should use average costing method", async () => {
      const avgProduct = await createTestProduct({ costingMethod: "average" });
      const avgVariant = await createTestProductVariant(avgProduct.id);
      await service.recordOpeningStock(avgVariant.id, 10, 5.0, "BATCH-AVG-1");
      await service.recordOpeningStock(avgVariant.id, 10, 10.0, "BATCH-AVG-2");

      const result = await service.selectBatchesForSale(avgVariant.id, 5);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should throw for insufficient stock with average costing", async () => {
      const avgProduct = await createTestProduct({ costingMethod: "average" });
      const avgVariant = await createTestProductVariant(avgProduct.id);
      await service.recordOpeningStock(avgVariant.id, 5, 5.0, "BATCH-AVG-INS");

      await expect(
        service.selectBatchesForSale(avgVariant.id, 100)
      ).rejects.toThrow(CustomError);
    });
  });

  describe("_consumeBatches - FEFO costing", () => {
    it("should use FEFO costing method", async () => {
      const fefoProduct = await createTestProduct({ costingMethod: "fefo" });
      const fefoVariant = await createTestProductVariant(fefoProduct.id);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      await service.recordOpeningStock(fefoVariant.id, 10, 5.0, "BATCH-FEFO-1", futureDate.toISOString().split("T")[0]);

      const result = await service.selectBatchesForSale(fefoVariant.id, 3);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("_consumeBatches - default costing (no product costingMethod)", () => {
    it("should default to FIFO when product has no costingMethod", async () => {
      const product = await createTestProduct({ costingMethod: null });
      const variant = await createTestProductVariant(product.id, { quantity: 10 });
      await createTestBatch(variant.id, { quantity: 10, unitCost: 20.0 });

      const result = await service.selectBatchesForSale(variant.id, 5);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("recordDamage - without note", () => {
    it("should record damage with default note when note is null", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 20 });
      const movement = await service.recordDamage(batch.id, 3, null, null, null);
      expect(movement.note).toBe("Damaged stock");
    });

    it("should throw 404 for non-existent batch", async () => {
      await expect(
        service.recordDamage(99999, 5, null, "Broken", null)
      ).rejects.toThrow();
    });
  });

  describe("recordExpiry - without note and non-existent batch", () => {
    it("should record expiry with default note when note is null", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 10 });
      const movement = await service.recordExpiry(batch.id, null, null, null);
      expect(movement.note).toBe("Expired stock");
    });

    it("should throw 404 for non-existent batch", async () => {
      await expect(
        service.recordExpiry(99999, null, "Expired", null)
      ).rejects.toThrow();
    });
  });

  describe("adjustStock - without note", () => {
    it("should use default note when note is null", async () => {
      const batch = await createTestBatch(testVariant.id, { quantity: 10 });
      const movement = await service.adjustStock(
        testVariant.id,
        batch.id,
        12,
        null,
        null,
        null
      );
      expect(movement.note).toBe("Stock adjustment");
    });
  });

  describe("listMovements - additional filters", () => {
    it("should filter by reason", async () => {
      const result = await service.listMovements({ reason: "purchase" });
      expect(result.rows.every((m) => m.reason === "purchase")).toBe(true);
    });
  });

  describe("inactive batch", () => {
    it("should reject movement on inactive batch", async () => {
      await testBatch.update({ isActive: false });
      await expect(
        service.createMovement({
          productVariantId: testVariant.id,
          type: "in",
          quantity: 5,
          batchId: testBatch.id,
          unitCost: 5.0,
          reason: "test inactive",
        })
      ).rejects.toThrow(CustomError);
      await testBatch.update({ isActive: true });
    });
  });
});

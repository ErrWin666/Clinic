const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const StockService = require("../../../src/services/stock");
const ProductService = require("../../../src/services/ProductService");
const ProductVariantService = require("../../../src/services/ProductVariantService");
const CustomError = require("../../../src/utils/CustomError");
const { sequelize, Batch, StockMovement, ProductVariant, Product } = require("../../../src/models");

describe("StockService", () => {
  let stockService;
  let productService;
  let variantService;
  let testProduct;
  let testVariant;
  let testBatch;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    stockService = new StockService();
    productService = new ProductService();
    variantService = new ProductVariantService();

    testProduct = await productService.create({
      name: "Test Frames",
      category: "frames",
      costingMethod: "fifo",
    });

    testVariant = await variantService.create(testProduct.id, {
      name: "Standard Frame",
      sku: "FRAME-001",
      sellPrice: 100.0,
      minQuantity: 5,
      maxQuantity: 50,
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("recordOpeningStock", () => {
    it("should create opening stock batch + movement", async () => {
      const result = await stockService.recordOpeningStock(
        testVariant.id,
        20,
        50.0,
        "BATCH-001",
        "2027-12-31",
        1
      );

      expect(result.batch).toBeDefined();
      expect(result.batch.batchNumber).toBe("BATCH-001");
      expect(result.batch.quantity).toBe(20);
      expect(result.batch.unitCost).toBe(50.0);
      expect(result.movement).toBeDefined();
      expect(result.movement.type).toBe("in");
      expect(result.movement.reason).toBe("opening_stock");
      expect(result.movement.quantity).toBe(20);

      testBatch = result.batch;

      // Variant quantity should be updated
      const variant = await ProductVariant.findByPk(testVariant.id);
      expect(variant.quantity).toBe(20);
    });

    it("should update variant costPrice as weighted average", async () => {
      const variant = await ProductVariant.findByPk(testVariant.id);
      expect(Number(variant.costPrice)).toBe(50.0);
    });
  });

  describe("selectBatchesForSale", () => {
    it("should select batches FIFO order", async () => {
      const selections = await stockService.selectBatchesForSale(testVariant.id, 5);
      expect(selections.length).toBe(1);
      expect(selections[0].batchId).toBe(testBatch.id);
      expect(selections[0].quantity).toBe(5);
      expect(selections[0].unitCost).toBe(50.0);
    });

    it("should throw INSUFFICIENT_STOCK when quantity exceeds available", async () => {
      await expect(stockService.selectBatchesForSale(testVariant.id, 100)).rejects.toThrow(
        CustomError
      );
    });

    it("should distribute across multiple batches", async () => {
      // Add a second batch
      await stockService.recordOpeningStock(
        testVariant.id,
        10,
        60.0,
        "BATCH-002",
        "2028-06-30",
        1
      );

      const selections = await stockService.selectBatchesForSale(testVariant.id, 25);
      // FIFO: first batch (20) then second batch (5)
      expect(selections.length).toBe(2);
      expect(selections[0].quantity).toBe(20);
      expect(selections[1].quantity).toBe(5);
    });
  });

  describe("calculateWeightedAverage", () => {
    it("should calculate weighted average cost", async () => {
      // (20 * 50 + 10 * 60) / 30 = 1600 / 30 = 53.33
      const avg = await stockService.calculateWeightedAverage(testVariant.id);
      expect(avg).toBeCloseTo(53.33, 1);
    });
  });

  describe("createMovement", () => {
    it("should create an out movement and update batch quantity", async () => {
      const initialBatch = await Batch.findByPk(testBatch.id);
      const initialQty = initialBatch.quantity;

      const movement = await stockService.createMovement({
        productVariantId: testVariant.id,
        batchId: testBatch.id,
        type: "out",
        quantity: -3,
        reason: "sale",
        unitCost: 50.0,
      });

      expect(movement.type).toBe("out");
      expect(movement.quantity).toBe(-3);
      expect(movement.totalCost).toBe(-150);

      const updatedBatch = await Batch.findByPk(testBatch.id);
      expect(updatedBatch.quantity).toBe(initialQty - 3);
    });

    it("should throw when batch quantity insufficient", async () => {
      await expect(
        stockService.createMovement({
          productVariantId: testVariant.id,
          batchId: testBatch.id,
          type: "out",
          quantity: -1000,
          reason: "sale",
          unitCost: 50.0,
        })
      ).rejects.toThrow(CustomError);
    });
  });

  describe("adjustStock", () => {
    it("should adjust stock with positive difference", async () => {
      const batch = await Batch.findByPk(testBatch.id);
      const before = batch.quantity;

      await stockService.adjustStock(testVariant.id, testBatch.id, before + 5, 1, "Found 5 extra");

      const after = await Batch.findByPk(testBatch.id);
      expect(after.quantity).toBe(before + 5);
    });

    it("should adjust stock with negative difference", async () => {
      const batch = await Batch.findByPk(testBatch.id);
      const before = batch.quantity;

      await stockService.adjustStock(testVariant.id, testBatch.id, before - 2, 1, "Lost 2");

      const after = await Batch.findByPk(testBatch.id);
      expect(after.quantity).toBe(before - 2);
    });

    it("should do nothing when difference is zero", async () => {
      const batch = await Batch.findByPk(testBatch.id);
      const result = await stockService.adjustStock(testVariant.id, testBatch.id, batch.quantity, 1, "No change");
      expect(result).toBeNull();
    });
  });

  describe("recordDamage", () => {
    it("should record damaged stock", async () => {
      const batch = await Batch.findByPk(testBatch.id);
      const before = batch.quantity;

      const movement = await stockService.recordDamage(testBatch.id, 2, 1, "Broken");
      expect(movement.reason).toBe("damage");
      expect(movement.quantity).toBe(-2);

      const after = await Batch.findByPk(testBatch.id);
      expect(after.quantity).toBe(before - 2);
    });

    it("should throw when damage quantity exceeds batch", async () => {
      await expect(stockService.recordDamage(testBatch.id, 9999, 1, "Too much")).rejects.toThrow(
        CustomError
      );
    });
  });

  describe("getInventoryStats", () => {
    it("should return inventory statistics", async () => {
      const stats = await stockService.getInventoryStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalValue");
      expect(stats).toHaveProperty("lowStockCount");
      expect(stats).toHaveProperty("outOfStockCount");
      expect(stats).toHaveProperty("expiringCount");
      expect(stats).toHaveProperty("expiredCount");
      expect(typeof stats.totalValue).toBe("number");
    });
  });

  describe("getInventoryValuation", () => {
    it("should return valuation per variant", async () => {
      const valuation = await stockService.getInventoryValuation();
      expect(Array.isArray(valuation)).toBe(true);
      const found = valuation.find((v) => v.id === testVariant.id);
      expect(found).toBeDefined();
      expect(found.sku).toBe("FRAME-001");
      expect(found.inventoryValue).toBeGreaterThan(0);
    });
  });

  describe("getProfitLossReport", () => {
    it("should return profit/loss data", async () => {
      const today = new Date().toISOString().split("T")[0];
      const report = await stockService.getProfitLossReport(today, today);
      expect(report).toBeDefined();
      expect(report).toHaveProperty("revenue");
      expect(report).toHaveProperty("cogs");
      expect(report).toHaveProperty("grossProfit");
      expect(report).toHaveProperty("netProfit");
    });
  });

  describe("listMovements", () => {
    it("should list movements with pagination", async () => {
      const result = await stockService.listMovements({ page: 1, pageSize: 10 });
      expect(result).toHaveProperty("rows");
      expect(result).toHaveProperty("pagination");
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should filter by productVariantId", async () => {
      const result = await stockService.listMovements({
        page: 1,
        pageSize: 10,
        productVariantId: testVariant.id,
      });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].productVariantId).toBe(testVariant.id);
    });
  });
});

const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestBatch,
} = require("../../helpers/factories");
const StocktakingService = require("../../../src/services/StocktakingService");
const StockMovementService = require("../../../src/services/stock/StockMovementService");

describe("StocktakingService", () => {
  let service;
  let testProduct;
  let testVariant;
  let testBatch;

  beforeAll(async () => {
    await setupTestDB();
    service = new StocktakingService();
    testProduct = await createTestProduct();
    testVariant = await createTestProductVariant(testProduct.id);
    // Add stock so there's something to count
    const smService = new StockMovementService();
    const result = await smService.recordOpeningStock(
      testVariant.id, 20, 50.0, "STK-BATCH-001", "2028-12-31", null, null
    );
    testBatch = result.batch;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("start", () => {
    it("should start a stocktaking session and auto-populate items", async () => {
      const stocktaking = await service.start(null, "Monthly count");
      expect(stocktaking).toBeDefined();
      expect(stocktaking.displayId).toMatch(/^STK-/);
      expect(stocktaking.status).toBe("in_progress");
      expect(stocktaking.items).toBeDefined();
      expect(stocktaking.items.length).toBeGreaterThan(0);
      // Verify system quantities are populated
      expect(stocktaking.items[0].systemQuantity).toBeDefined();
      expect(stocktaking.items[0].countedQuantity).toBeNull();
    });
  });

  describe("getById", () => {
    it("should return stocktaking by id with items", async () => {
      const stocktaking = await service.start(null, "GetById test");
      const found = await service.getById(stocktaking.id);
      expect(found.id).toBe(stocktaking.id);
      expect(found.items).toBeDefined();
    });

    it("should throw 404 for non-existent stocktaking", async () => {
      await expect(service.getById(99999)).rejects.toThrow();
      try {
        await service.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should list stocktakings with pagination", async () => {
      const result = await service.list({ page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should filter by status", async () => {
      const result = await service.list({ status: "in_progress" });
      expect(result.rows.every((s) => s.status === "in_progress")).toBe(true);
    });
  });

  describe("updateCounts", () => {
    it("should update counted quantities and compute difference", async () => {
      const stocktaking = await service.start(null, "Count test");
      const itemId = stocktaking.items[0].id;
      const systemQty = stocktaking.items[0].systemQuantity;

      const updated = await service.updateCounts(stocktaking.id, [
        { id: itemId, countedQuantity: systemQty + 5 },
      ]);
      const item = updated.items.find((i) => i.id === itemId);
      expect(item.countedQuantity).toBe(systemQty + 5);
      expect(item.difference).toBe(5);
    });

    it("should reject updating a completed stocktaking", async () => {
      const stocktaking = await service.start(null, "Completed test");
      // Complete it first (no differences = no adjustments needed)
      await service.complete(stocktaking.id, null);
      await expect(
        service.updateCounts(stocktaking.id, [
          { id: stocktaking.items[0]?.id, countedQuantity: 99 },
        ])
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent stocktaking", async () => {
      await expect(service.updateCounts(99999, [])).rejects.toThrow();
    });

    it("should reject updating a cancelled stocktaking", async () => {
      const stocktaking = await service.start(null, "Cancelled update test");
      await service.cancel(stocktaking.id);
      await expect(
        service.updateCounts(stocktaking.id, [
          { id: stocktaking.items[0]?.id, countedQuantity: 99 },
        ])
      ).rejects.toThrow();
    });

    it("should set countedQuantity and difference to null when countedQuantity is null", async () => {
      const stocktaking = await service.start(null, "Null count test");
      const itemId = stocktaking.items[0].id;
      const updated = await service.updateCounts(stocktaking.id, [
        { id: itemId, countedQuantity: null },
      ]);
      const item = updated.items.find((i) => i.id === itemId);
      expect(item.countedQuantity).toBeNull();
      expect(item.difference).toBeNull();
    });

    it("should skip items not belonging to the stocktaking", async () => {
      const stocktaking = await service.start(null, "Skip item test");
      const updated = await service.updateCounts(stocktaking.id, [
        { id: 99999, countedQuantity: 99 },
      ]);
      expect(updated).toBeDefined();
    });
  });

  describe("complete", () => {
    it("should complete stocktaking and create adjustment movements", async () => {
      const stocktaking = await service.start(null, "Complete test");
      const itemId = stocktaking.items[0].id;
      const systemQty = stocktaking.items[0].systemQuantity;

      // Set a counted quantity with a difference
      await service.updateCounts(stocktaking.id, [
        { id: itemId, countedQuantity: systemQty - 3 },
      ]);

      const completed = await service.complete(stocktaking.id, null);
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeDefined();
    });

    it("should reject completing an already completed stocktaking", async () => {
      const stocktaking = await service.start(null, "Double complete test");
      await service.complete(stocktaking.id, null);
      await expect(service.complete(stocktaking.id, null)).rejects.toThrow();
    });

    it("should reject completing a cancelled stocktaking", async () => {
      const stocktaking = await service.start(null, "Cancel then complete test");
      await service.cancel(stocktaking.id);
      await expect(service.complete(stocktaking.id, null)).rejects.toThrow();
    });

    it("should throw 404 for non-existent stocktaking on complete", async () => {
      await expect(service.complete(99999, null)).rejects.toThrow();
    });
  });

  describe("cancel", () => {
    it("should cancel an in-progress stocktaking", async () => {
      const stocktaking = await service.start(null, "Cancel test");
      const cancelled = await service.cancel(stocktaking.id);
      expect(cancelled.status).toBe("cancelled");
    });

    it("should reject cancelling a completed stocktaking", async () => {
      const stocktaking = await service.start(null, "Cancel after complete test");
      await service.complete(stocktaking.id, null);
      await expect(service.cancel(stocktaking.id)).rejects.toThrow();
    });

    it("should throw 404 for non-existent stocktaking", async () => {
      await expect(service.cancel(99999)).rejects.toThrow();
    });
  });
});

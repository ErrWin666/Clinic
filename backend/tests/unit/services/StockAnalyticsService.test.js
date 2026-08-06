jest.mock("../../../src/models", () => ({
  StockMovement: { findAll: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  Batch: { findAll: jest.fn(), count: jest.fn() },
  ProductVariant: { findAll: jest.fn() },
  Product: {},
  Invoice: { findAll: jest.fn().mockResolvedValue([]) },
  InvoiceItem: {},
}));

jest.mock("../../../src/utils/money", () => ({
  roundTo2: jest.fn((v) => Math.round(v * 100) / 100),
  multiplyQtyPrice: jest.fn((q, p) => q * p),
  sumMoney: jest.fn((arr) => arr.reduce((a, b) => a + b, 0)),
}));

const StockAnalyticsService = require("../../../src/services/stock/StockAnalyticsService");
const { Batch, ProductVariant, StockMovement } = require("../../../src/models");

describe("StockAnalyticsService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StockAnalyticsService();
  });

  describe("getInventoryStats", () => {
    it("should return inventory statistics", async () => {
      Batch.findAll.mockResolvedValue([
        { quantity: 10, unitCost: 50 },
        { quantity: 5, unitCost: 100 },
      ]);
      ProductVariant.findAll.mockResolvedValue([
        { quantity: 5, minQuantity: 10, maxQuantity: 0 },
        { quantity: 0, minQuantity: 5, maxQuantity: 0 },
        { quantity: 100, minQuantity: 10, maxQuantity: 50 },
      ]);
      Batch.count.mockResolvedValue(2);

      const result = await service.getInventoryStats();

      expect(result).toEqual(
        expect.objectContaining({
          totalValue: expect.any(Number),
          lowStockCount: 1,
          outOfStockCount: 1,
          overstockCount: 1,
          expiringCount: 2,
          expiredCount: 2,
        })
      );
    });

    it("should handle empty inventory", async () => {
      Batch.findAll.mockResolvedValue([]);
      ProductVariant.findAll.mockResolvedValue([]);
      Batch.count.mockResolvedValue(0);

      const result = await service.getInventoryStats();
      expect(result.totalValue).toBe(0);
      expect(result.lowStockCount).toBe(0);
      expect(result.outOfStockCount).toBe(0);
    });
  });

  describe("checkAlerts", () => {
    it("should return alerts for low stock, out of stock, expiring, and expired", async () => {
      ProductVariant.findAll.mockResolvedValue([
        { id: 1, name: "V1", sku: "SKU1", quantity: 3, minQuantity: 10, product: { name: "P1" } },
        { id: 2, name: "V2", sku: "SKU2", quantity: 0, minQuantity: 5, product: { name: "P2" } },
        { id: 3, name: "V3", sku: "SKU3", quantity: 50, minQuantity: 10, product: { name: "P3" } },
      ]);
      Batch.findAll
        .mockResolvedValueOnce([
          { id: 1, batchNumber: "B1", productVariantId: 1, quantity: 5, expiryDate: "2026-09-01", variant: { name: "V1", product: { name: "P1" } } },
        ])
        .mockResolvedValueOnce([
          { id: 2, batchNumber: "B2", productVariantId: 2, quantity: 3, expiryDate: "2025-01-01", variant: { name: "V2", product: { name: "P2" } } },
        ]);

      const result = await service.checkAlerts(30);

      expect(result.lowStock.length).toBe(1);
      expect(result.outOfStock.length).toBe(1);
      expect(result.expiring.length).toBe(1);
      expect(result.expired.length).toBe(1);
      expect(result.summary.total).toBe(4);
    });

    it("should handle no alerts", async () => {
      ProductVariant.findAll.mockResolvedValue([]);
      Batch.findAll.mockResolvedValue([]);

      const result = await service.checkAlerts(30);
      expect(result.summary.total).toBe(0);
    });
  });

  describe("getInventoryValuation", () => {
    it("should return valuation for all active variants", async () => {
      ProductVariant.findAll.mockResolvedValue([
        { id: 1, sku: "SKU1", name: "V1", quantity: 10, costPrice: 50, sellPrice: 100, product: { name: "P1" } },
      ]);
      Batch.findAll.mockResolvedValue([
        { quantity: 10, unitCost: 50 },
      ]);

      const result = await service.getInventoryValuation();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          sku: "SKU1",
          inventoryValue: 500,
          potentialRevenue: 1000,
        })
      );
    });

    it("should handle empty inventory", async () => {
      ProductVariant.findAll.mockResolvedValue([]);
      const result = await service.getInventoryValuation();
      expect(result).toEqual([]);
    });
  });

  describe("getProfitLossReport", () => {
    it("should calculate profit/loss using historical invoice prices", async () => {
      // Invoice.findAll returns paid invoices with items
      const { Invoice } = require("../../../src/models");
      Invoice.findAll.mockResolvedValueOnce([
        {
          items: [
            { quantity: 5, unitPrice: 100, costAmount: 250, productVariantId: 1 },
          ],
        },
      ]);
      // StockMovement.findAll returns damage/expiry losses
      StockMovement.findAll.mockResolvedValueOnce([
        { quantity: -2, unitCost: 30, reason: "damage" },
        { quantity: -1, unitCost: 20, reason: "expiry" },
      ]);

      const result = await service.getProfitLossReport("2026-01-01", "2026-12-31");

      expect(result.revenue).toBe(500); // 5 * 100
      expect(result.cogs).toBe(250);
      expect(result.grossProfit).toBe(250);
      expect(result.damageLoss).toBe(60);
      expect(result.expiryLoss).toBe(20);
      expect(result.netProfit).toBe(170); // 250 - 60 - 20
    });

    it("should handle no invoices and no losses", async () => {
      const { Invoice } = require("../../../src/models");
      Invoice.findAll.mockResolvedValueOnce([]);
      StockMovement.findAll.mockResolvedValueOnce([]);

      const result = await service.getProfitLossReport("2026-01-01", "2026-12-31");
      expect(result.revenue).toBe(0);
      expect(result.cogs).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.netProfit).toBe(0);
    });
  });
});

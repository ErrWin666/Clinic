const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestSupplier,
  createTestBatch,
  createTestStockMovement,
} = require("../../helpers/factories");
const InventoryExportService = require("../../../src/services/reports/InventoryExportService");

describe("InventoryExportService", () => {
  let service;

  beforeAll(async () => {
    await setupTestDB();
    service = new InventoryExportService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("exportInventory", () => {
    it("should return empty export when no variants", async () => {
      const result = await service.exportInventory({});
      expect(result.headers).toBeDefined();
      expect(result.headers.length).toBeGreaterThan(0);
      expect(result.rows).toEqual([]);
    });

    it("should export inventory with correct headers and rows", async () => {
      const product = await createTestProduct({ name: "Export Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Export Variant",
        sku: "EXP-001",
        barcode: "EXPBC001",
        sellPrice: 75,
        quantity: 25,
        minQuantity: 5,
        maxQuantity: 100,
      });

      const result = await service.exportInventory({});
      expect(result.headers).toContain("DisplayID");
      expect(result.headers).toContain("Product");
      expect(result.headers).toContain("SKU");
      expect(result.headers).toContain("Quantity");

      const row = result.rows.find((r) => r[3] === "EXP-001");
      expect(row).toBeDefined();
      expect(row[1]).toBe("Export Product");
      expect(row[2]).toBe("Export Variant");
      expect(row[5]).toBe(25);
    });

    it("should exclude inactive variants", async () => {
      const product = await createTestProduct({ name: "Inactive Export Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Inactive Export Variant",
        sku: "INACT-EXP-001",
        sellPrice: 50,
      });
      await variant.update({ isActive: false });

      const result = await service.exportInventory({});
      expect(result.rows.find((r) => r[3] === "INACT-EXP-001")).toBeUndefined();
    });

    it("should handle variants with null barcode and location", async () => {
      const product = await createTestProduct({ name: "Null Fields Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Null Fields Variant",
        sku: "NULL-001",
        barcode: null,
        location: null,
        sellPrice: 50,
      });
      // Set costPrice to 0 directly since factory uses || which overrides 0
      await variant.update({ costPrice: 0 });

      const result = await service.exportInventory({});
      const row = result.rows.find((r) => r[3] === "NULL-001");
      expect(row).toBeDefined();
      expect(row[4]).toBe(""); // barcode
      expect(Number(row[6])).toBe(0); // costPrice
      expect(row[8]).toBe(""); // location
    });
  });

  describe("exportStockMovements", () => {
    it("should return empty export when no movements", async () => {
      const result = await service.exportStockMovements({});
      expect(result.headers).toBeDefined();
      expect(result.rows).toEqual([]);
    });

    it("should export stock movements with filters", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id, {
        name: "Movement Export Variant",
        sku: "MVTEXP-001",
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, {
        supplierId: supplier.id,
        quantity: 30,
        initialQuantity: 30,
      });

      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "in",
        quantity: 30,
        reason: "purchase",
        unitCost: 15,
      });

      const result = await service.exportStockMovements({ type: "in" });
      expect(result.headers).toContain("DisplayID");
      expect(result.headers).toContain("Type");
      expect(result.headers).toContain("Quantity");

      const inMovement = result.rows.find((r) => r[2] === "in");
      expect(inMovement).toBeDefined();
    });

    it("should filter by date range", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id, {
        name: "Date Filter Variant",
        sku: "DATEFLR-001",
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, { supplierId: supplier.id });

      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "in",
        quantity: 10,
        reason: "purchase",
        unitCost: 5,
        movementDate: "2026-01-15",
      });

      const result = await service.exportStockMovements({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should filter by reason", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id, {
        name: "Reason Filter Variant",
        sku: "RSNFLR-001",
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, { supplierId: supplier.id });

      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "out",
        quantity: 5,
        reason: "sale",
        unitCost: 10,
      });

      const result = await service.exportStockMovements({ reason: "sale" });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows.every((r) => r[3] === "sale")).toBe(true);
    });

    it("should filter by productVariantId", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id, {
        name: "VariantFilter",
        sku: "VARFLR-001",
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, { supplierId: supplier.id });

      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "in",
        quantity: 20,
        reason: "purchase",
        unitCost: 5,
      });

      const result = await service.exportStockMovements({ productVariantId: variant.id });
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should handle movements with null note and unitCost", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id, {
        name: "Null Note Variant",
        sku: "NULLNOTE-001",
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, { supplierId: supplier.id });

      const movement = await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "adjust",
        quantity: 3,
        reason: "correction",
        note: null,
      });
      // Set unitCost to 0 directly since factory uses || which overrides 0/null
      await movement.update({ unitCost: 0 });

      const result = await service.exportStockMovements({ reason: "correction" });
      const row = result.rows.find((r) => r[2] === "adjust");
      expect(row).toBeDefined();
      expect(Number(row[8])).toBe(0); // unitCost
      expect(row[10]).toBe(""); // note
    });
  });
});

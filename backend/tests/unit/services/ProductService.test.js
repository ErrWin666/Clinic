const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const ProductService = require("../../../src/services/ProductService");
const ProductVariantService = require("../../../src/services/ProductVariantService");
const StockService = require("../../../src/services/stock");
const CustomError = require("../../../src/utils/CustomError");

describe("ProductService & ProductVariantService", () => {
  let productService;
  let variantService;
  let stockService;
  let testProduct;
  let testVariant;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    productService = new ProductService();
    variantService = new ProductVariantService();
    stockService = new StockService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ===== ProductService =====

  describe("ProductService.create", () => {
    it("should create a product with generated displayId", async () => {
      testProduct = await productService.create({
        name: "Luxury Frames",
        category: "frames-luxury",
        costingMethod: "fifo",
        description: "Premium titanium frames",
      });
      expect(testProduct).toBeDefined();
      expect(testProduct.displayId).toMatch(/^PRD-/);
      expect(testProduct.name).toBe("Luxury Frames");
      expect(testProduct.category).toBe("frames-luxury");
      expect(testProduct.isActive).toBe(true);
    });

    it("should default category to other", async () => {
      const p = await productService.create({ name: "Generic Item" });
      expect(p.category).toBe("other");
      expect(p.costingMethod).toBe("fifo");
    });
  });

  describe("ProductService.list", () => {
    it("should return paginated products", async () => {
      const result = await productService.list({ page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
    });

    it("should filter by category", async () => {
      const result = await productService.list({ category: "frames-luxury" });
      expect(result.rows.every((p) => p.category === "frames-luxury")).toBe(true);
    });

    it("should search by name", async () => {
      const result = await productService.list({ search: "Luxury" });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].name).toContain("Luxury");
    });
  });

  describe("ProductService.getById", () => {
    it("should return product with variants", async () => {
      const product = await productService.getById(testProduct.id);
      expect(product).toBeDefined();
      expect(product.id).toBe(testProduct.id);
      expect(product.variants).toBeDefined();
    });

    it("should throw 404 for non-existent product", async () => {
      await expect(productService.getById(99999)).rejects.toThrow(CustomError);
    });
  });

  describe("ProductService.update", () => {
    it("should update product fields", async () => {
      const updated = await productService.update(testProduct.id, {
        description: "Updated description",
      });
      expect(updated.description).toBe("Updated description");
    });
  });

  describe("ProductService.delete", () => {
    it("should throw when product has active variants", async () => {
      await variantService.create(testProduct.id, {
        name: "Variant 1",
        sku: "LUX-001",
        sellPrice: 200.0,
      });
      await expect(productService.delete(testProduct.id)).rejects.toThrow(CustomError);
    });

    it("should soft delete product without variants", async () => {
      const p = await productService.create({ name: "To Delete" });
      await productService.delete(p.id);
      const result = await productService.list({});
      expect(result.rows.find((r) => r.id === p.id)).toBeUndefined();
    });
  });

  // ===== ProductVariantService =====

  describe("ProductVariantService.create", () => {
    it("should create a variant", async () => {
      testVariant = await variantService.create(testProduct.id, {
        name: "Monthly Lens -2.00",
        sku: "CL-M-200",
        barcode: "1234567890123",
        sellPrice: 80.0,
        minQuantity: 10,
        maxQuantity: 100,
      });
      expect(testVariant).toBeDefined();
      expect(testVariant.productId).toBe(testProduct.id);
      expect(testVariant.quantity).toBe(0);
      expect(testVariant.isActive).toBe(true);
    });

    it("should reject duplicate SKU", async () => {
      await expect(
        variantService.create(testProduct.id, {
          name: "Duplicate",
          sku: "CL-M-200",
          sellPrice: 50.0,
        })
      ).rejects.toThrow(CustomError);
    });

    it("should reject duplicate barcode", async () => {
      await expect(
        variantService.create(testProduct.id, {
          name: "Duplicate Barcode",
          sku: "CL-M-201",
          barcode: "1234567890123",
          sellPrice: 50.0,
        })
      ).rejects.toThrow(CustomError);
    });
  });

  describe("ProductVariantService.getById", () => {
    it("should return variant with batches", async () => {
      const v = await variantService.getById(testVariant.id);
      expect(v).toBeDefined();
      expect(v.batches).toBeDefined();
    });

    it("should throw 404 for non-existent variant", async () => {
      await expect(variantService.getById(99999)).rejects.toThrow(CustomError);
    });
  });

  describe("ProductVariantService.update", () => {
    it("should update variant fields", async () => {
      const updated = await variantService.update(testVariant.id, {
        sellPrice: 90.0,
        minQuantity: 15,
      });
      expect(Number(updated.sellPrice)).toBe(90.0);
      expect(updated.minQuantity).toBe(15);
    });

    it("should not allow direct quantity update", async () => {
      const updated = await variantService.update(testVariant.id, {
        quantity: 999,
      });
      expect(updated.quantity).not.toBe(999);
    });
  });

  describe("ProductVariantService.getByBarcode", () => {
    it("should find variant by barcode", async () => {
      const v = await variantService.getByBarcode("1234567890123");
      expect(v.id).toBe(testVariant.id);
    });

    it("should throw 404 for unknown barcode", async () => {
      await expect(variantService.getByBarcode("UNKNOWN")).rejects.toThrow(CustomError);
    });
  });

  describe("ProductVariantService.delete", () => {
    it("should throw when variant has stock", async () => {
      await stockService.recordOpeningStock(testVariant.id, 5, 40.0, "OPEN-1", null, 1);
      await expect(variantService.delete(testVariant.id)).rejects.toThrow(CustomError);
    });
  });
});

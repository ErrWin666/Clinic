const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestProduct, createTestProductVariant } = require("../../helpers/factories");
const ProductVariantService = require("../../../src/services/ProductVariantService");
const CustomError = require("../../../src/utils/CustomError");

describe("ProductVariantService", () => {
  let service;
  let testProduct;

  beforeAll(async () => {
    await setupTestDB();
    service = new ProductVariantService();
    testProduct = await createTestProduct();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a variant with valid data", async () => {
      const variant = await service.create(testProduct.id, {
        name: "Standard",
        sku: "UNIQUE-SKU-001",
        sellPrice: 100.0,
        minQuantity: 5,
      });
      expect(variant).toBeDefined();
      expect(variant.productId).toBe(testProduct.id);
      expect(variant.sku).toBe("UNIQUE-SKU-001");
      expect(variant.quantity).toBe(0);
    });

    it("should reject duplicate SKU", async () => {
      await service.create(testProduct.id, { name: "V1", sku: "DUP-SKU", sellPrice: 50 });
      await expect(
        service.create(testProduct.id, { name: "V2", sku: "DUP-SKU", sellPrice: 60 })
      ).rejects.toThrow();
    });

    it("should reject duplicate barcode", async () => {
      await service.create(testProduct.id, {
        name: "V3", sku: "BC-SKU-1", barcode: "BC123", sellPrice: 50,
      });
      await expect(
        service.create(testProduct.id, {
          name: "V4", sku: "BC-SKU-2", barcode: "BC123", sellPrice: 60,
        })
      ).rejects.toThrow();
    });

    it("should reject duplicate serial number", async () => {
      await service.create(testProduct.id, {
        name: "V5", sku: "SN-SKU-1", serialNumber: "SN001", sellPrice: 50,
      });
      await expect(
        service.create(testProduct.id, {
          name: "V6", sku: "SN-SKU-2", serialNumber: "SN001", sellPrice: 60,
        })
      ).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should return variant by id with batches", async () => {
      const variant = await service.create(testProduct.id, {
        name: "GetById", sku: "GET-SKU", sellPrice: 50,
      });
      const found = await service.getById(variant.id);
      expect(found.id).toBe(variant.id);
    });

    it("should throw 404 for non-existent variant", async () => {
      await expect(service.getById(99999)).rejects.toThrow();
      try {
        await service.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should list variants with pagination", async () => {
      const result = await service.list({ page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should filter by productId", async () => {
      const result = await service.list({ productId: testProduct.id });
      expect(result.rows.every((v) => v.productId === testProduct.id)).toBe(true);
    });

    it("should filter by search term", async () => {
      await service.create(testProduct.id, {
        name: "SearchTarget", sku: "SEARCH-SKU", sellPrice: 50,
      });
      const result = await service.list({ search: "SearchTarget" });
      expect(result.rows.some((v) => v.name === "SearchTarget")).toBe(true);
    });

    it("should filter by lowStock", async () => {
      const variant = await service.create(testProduct.id, {
        name: "LowStockVariant", sku: "LOW-STOCK-SKU", sellPrice: 50, minQuantity: 10,
      });
      // Set quantity to 5 (below minQuantity of 10)
      await variant.update({ quantity: 5 });
      const result = await service.list({ lowStock: "true" });
      expect(result.rows.some((v) => v.name === "LowStockVariant")).toBe(true);
    });

    it("should filter by outOfStock", async () => {
      await service.create(testProduct.id, {
        name: "OutOfStockVariant", sku: "OOS-SKU", sellPrice: 50,
      });
      const result = await service.list({ outOfStock: "true" });
      expect(result.rows.every((v) => Number(v.quantity) === 0)).toBe(true);
    });
  });

  describe("update", () => {
    it("should update variant fields", async () => {
      const variant = await service.create(testProduct.id, {
        name: "UpdateMe", sku: "UPD-SKU", sellPrice: 50,
      });
      const updated = await service.update(variant.id, { sellPrice: 75.0 });
      expect(Number(updated.sellPrice)).toBe(75);
    });

    it("should not allow direct quantity update", async () => {
      const variant = await service.create(testProduct.id, {
        name: "NoQtyUpdate", sku: "NOQ-SKU", sellPrice: 50,
      });
      const updated = await service.update(variant.id, { quantity: 999 });
      expect(Number(updated.quantity)).toBe(0);
    });

    it("should reject duplicate SKU on update", async () => {
      await service.create(testProduct.id, { name: "V1", sku: "UPD-DUP-1", sellPrice: 50 });
      const variant = await service.create(testProduct.id, { name: "V2", sku: "UPD-DUP-2", sellPrice: 50 });
      await expect(service.update(variant.id, { sku: "UPD-DUP-1" })).rejects.toThrow();
    });

    it("should reject duplicate barcode on update", async () => {
      await service.create(testProduct.id, { name: "BC1", sku: "UPD-BC-1", barcode: "BCUPD1", sellPrice: 50 });
      const variant = await service.create(testProduct.id, { name: "BC2", sku: "UPD-BC-2", barcode: "BCUPD2", sellPrice: 50 });
      await expect(service.update(variant.id, { barcode: "BCUPD1" })).rejects.toThrow();
    });

    it("should reject duplicate serial number on update", async () => {
      await service.create(testProduct.id, { name: "SN1", sku: "UPD-SN-1", serialNumber: "SNUPD1", sellPrice: 50 });
      const variant = await service.create(testProduct.id, { name: "SN2", sku: "UPD-SN-2", serialNumber: "SNUPD2", sellPrice: 50 });
      await expect(service.update(variant.id, { serialNumber: "SNUPD1" })).rejects.toThrow();
    });

    it("should not allow direct costPrice update", async () => {
      const variant = await service.create(testProduct.id, {
        name: "NoCostUpdate", sku: "NOC-SKU", sellPrice: 50, costPrice: 30,
      });
      const updated = await service.update(variant.id, { costPrice: 999 });
      expect(Number(updated.costPrice)).toBe(30);
    });

    it("should allow update with same SKU (no change)", async () => {
      const variant = await service.create(testProduct.id, {
        name: "SameSku", sku: "SAME-SKU-UPD", sellPrice: 50,
      });
      const updated = await service.update(variant.id, { sku: "SAME-SKU-UPD", sellPrice: 60 });
      expect(Number(updated.sellPrice)).toBe(60);
    });
  });

  describe("delete", () => {
    it("should soft delete variant with zero stock", async () => {
      const variant = await service.create(testProduct.id, {
        name: "DeleteMe", sku: "DEL-SKU", sellPrice: 50,
      });
      const result = await service.delete(variant.id);
      expect(result.isActive).toBe(false);
    });

    it("should reject deletion when variant has stock", async () => {
      const variant = await service.create(testProduct.id, {
        name: "HasStock", sku: "STK-SKU", sellPrice: 50,
      });
      // Manually set quantity to simulate stock
      await variant.update({ quantity: 10 });
      await expect(service.delete(variant.id)).rejects.toThrow();
    });
  });

  describe("getByBarcode", () => {
    it("should find variant by barcode", async () => {
      const variant = await service.create(testProduct.id, {
        name: "BCVariant", sku: "BCV-SKU", barcode: "FINDME123", sellPrice: 50,
      });
      const found = await service.getByBarcode("FINDME123");
      expect(found.id).toBe(variant.id);
    });

    it("should throw 404 for unknown barcode", async () => {
      await expect(service.getByBarcode("UNKNOWN")).rejects.toThrow();
    });
  });

  describe("getBySku", () => {
    it("should find variant by SKU", async () => {
      const variant = await service.create(testProduct.id, {
        name: "SkuVariant", sku: "FIND-SKU-123", sellPrice: 50,
      });
      const found = await service.getBySku("FIND-SKU-123");
      expect(found.id).toBe(variant.id);
    });

    it("should throw 404 for unknown SKU", async () => {
      await expect(service.getBySku("NONEXISTENT-SKU")).rejects.toThrow();
    });
  });
});

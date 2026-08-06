const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestProductBundle,
} = require("../../helpers/factories");
const ProductBundleService = require("../../../src/services/ProductBundleService");
const { ProductBundle, ProductBundleItem } = require("../../../src/models");

describe("ProductBundleService", () => {
  let service;
  let testProduct;
  let testVariant1;
  let testVariant2;

  beforeAll(async () => {
    await setupTestDB();
    service = new ProductBundleService();
    testProduct = await createTestProduct({ name: "Bundle Product" });
    testVariant1 = await createTestProductVariant(testProduct.id, { name: "V1", sellPrice: 50, quantity: 100 });
    testVariant2 = await createTestProductVariant(testProduct.id, { name: "V2", sellPrice: 75, quantity: 100 });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a bundle with items", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        description: "Test bundle",
        items: [
          { productVariantId: testVariant1.id, quantity: 2 },
          { productVariantId: testVariant2.id, quantity: 1 },
        ],
      });
      expect(bundle).toBeDefined();
      expect(bundle.items).toBeDefined();
      expect(bundle.items.length).toBe(2);
    });

    it("should create a bundle without description (null default)", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 1 }],
      });
      expect(bundle).toBeDefined();
      expect(bundle.description).toBeNull();
    });

    it("should reject non-existent product", async () => {
      await expect(
        service.create({
          productId: 99999,
          items: [{ productVariantId: testVariant1.id, quantity: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should reject non-existent variant in items", async () => {
      await expect(
        service.create({
          productId: testProduct.id,
          items: [{ productVariantId: 99999, quantity: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should rollback transaction on create error", async () => {
      jest.spyOn(ProductBundle, "create").mockRejectedValueOnce(new Error("DB error"));
      await expect(
        service.create({
          productId: testProduct.id,
          items: [{ productVariantId: testVariant1.id, quantity: 1 }],
        })
      ).rejects.toThrow();
      ProductBundle.create.mockRestore();
    });
  });

  describe("getById", () => {
    it("should return bundle by id with items", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 3 }],
      });
      const found = await service.getById(bundle.id);
      expect(found.id).toBe(bundle.id);
      expect(found.items.length).toBe(1);
    });

    it("should throw 404 for non-existent bundle", async () => {
      await expect(service.getById(99999)).rejects.toThrow();
      try {
        await service.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should list bundles with pagination", async () => {
      const result = await service.list({ page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should filter by productId", async () => {
      const result = await service.list({ productId: testProduct.id });
      expect(result.rows.every((b) => b.productId === testProduct.id)).toBe(true);
    });

    it("should filter by search term", async () => {
      jest.spyOn(ProductBundle, "findAndCountAll").mockResolvedValueOnce({
        rows: [],
        count: 0,
      });
      const result = await service.list({ search: "test" });
      expect(result).toBeDefined();
      expect(ProductBundle.findAndCountAll).toHaveBeenCalled();
      const callArgs = ProductBundle.findAndCountAll.mock.calls[0][0];
      expect(callArgs.where[Symbol.for("or")]).toBeDefined();
      ProductBundle.findAndCountAll.mockRestore();
    });
  });

  describe("update", () => {
    it("should update bundle description", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 1 }],
      });
      const updated = await service.update(bundle.id, { description: "Updated description" });
      expect(updated.description).toBe("Updated description");
    });

    it("should replace items on update", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 1 }],
      });
      const updated = await service.update(bundle.id, {
        items: [
          { productVariantId: testVariant1.id, quantity: 5 },
          { productVariantId: testVariant2.id, quantity: 2 },
        ],
      });
      expect(updated.items.length).toBe(2);
    });

    it("should throw 404 for non-existent bundle", async () => {
      await expect(service.update(99999, { description: "test" })).rejects.toThrow();
    });

    it("should reject update with non-existent variant in items", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 1 }],
      });
      await expect(
        service.update(bundle.id, {
          items: [{ productVariantId: 99999, quantity: 1 }],
        })
      ).rejects.toThrow();
    });

    it("should update with no description and no items (no-op)", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 1 }],
      });
      const updated = await service.update(bundle.id, {});
      expect(updated).toBeDefined();
      expect(updated.items.length).toBe(1);
    });
  });

  describe("delete", () => {
    it("should soft delete a bundle", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 1 }],
      });
      const result = await service.delete(bundle.id);
      expect(result).toBe(true);
      await expect(service.getById(bundle.id)).rejects.toThrow();
    });

    it("should throw 404 for non-existent bundle", async () => {
      await expect(service.delete(99999)).rejects.toThrow();
    });
  });

  describe("expandBundle", () => {
    it("should expand bundle into invoice line items", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        description: "Expandable bundle",
        items: [
          { productVariantId: testVariant1.id, quantity: 2 },
          { productVariantId: testVariant2.id, quantity: 1 },
        ],
      });
      const items = await service.expandBundle(bundle.id, 3);
      expect(items.length).toBe(2);
      expect(items[0].quantity).toBe(6); // 2 * 3
      expect(items[1].quantity).toBe(3); // 1 * 3
      expect(items[0].unitPrice).toBe(50);
      expect(items[1].unitPrice).toBe(75);
    });

    it("should expand bundle with default quantity=1", async () => {
      const bundle = await service.create({
        productId: testProduct.id,
        items: [{ productVariantId: testVariant1.id, quantity: 2 }],
      });
      const items = await service.expandBundle(bundle.id);
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(2); // 2 * 1
    });

    it("should throw 404 for non-existent bundle", async () => {
      await expect(service.expandBundle(99999)).rejects.toThrow();
    });

    it("should throw 404 when getById returns null", async () => {
      jest.spyOn(service, "getById").mockResolvedValueOnce(null);
      await expect(service.expandBundle(1)).rejects.toThrow();
    });
  });
});

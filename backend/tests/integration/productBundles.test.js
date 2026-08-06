const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { ProductVariant } = require("../../src/models");

describe("Product Bundles API Integration", () => {
  let agent;
  let testProductId;
  let testBundleProductId;
  let testVariant1Id;
  let testVariant2Id;
  let testBundleId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    // Create a product for the bundle's "parent" product
    const bundleProductRes = await agent
      .post("/api/products")
      .send({ name: "Complete Eye Care Kit", category: "other", costingMethod: "fifo" })
      .expect(201);
    testBundleProductId = bundleProductRes.body.data.id;

    // Create a product with variants to be bundle components
    const productRes = await agent
      .post("/api/products")
      .send({ name: "Bundle Components", category: "drops", costingMethod: "fifo" })
      .expect(201);
    testProductId = productRes.body.data.id;

    const variant1Res = await agent
      .post(`/api/products/${testProductId}/variants`)
      .send({ name: "Dilation Drops", sku: "BUNDLE-V1", sellPrice: 20.0 })
      .expect(201);
    testVariant1Id = variant1Res.body.data.id;

    const variant2Res = await agent
      .post(`/api/products/${testProductId}/variants`)
      .send({ name: "Eye Wash", sku: "BUNDLE-V2", sellPrice: 15.0 })
      .expect(201);
    testVariant2Id = variant2Res.body.data.id;

    // Add opening stock for both variants
    await agent
      .post("/api/stock/opening-stock")
      .send({ productVariantId: testVariant1Id, quantity: 100, unitCost: 5, batchNumber: "B1", expiryDate: "2028-12-31" })
      .expect(201);

    await agent
      .post("/api/stock/opening-stock")
      .send({ productVariantId: testVariant2Id, quantity: 100, unitCost: 3, batchNumber: "B2", expiryDate: "2028-12-31" })
      .expect(201);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ===== Bundle CRUD =====

  describe("POST /api/product-bundles", () => {
    it("should create a product bundle", async () => {
      const res = await agent
        .post("/api/product-bundles")
        .send({
          productId: testBundleProductId,
          description: "Complete kit with drops and wash",
          items: [
            { productVariantId: testVariant1Id, quantity: 2 },
            { productVariantId: testVariant2Id, quantity: 1 },
          ],
        })
        .expect(201);

      expect(res.body.data.productId).toBe(testBundleProductId);
      expect(res.body.data.items.length).toBe(2);
      testBundleId = res.body.data.id;
    });

    it("should reject non-existent product", async () => {
      await agent
        .post("/api/product-bundles")
        .send({
          productId: 99999,
          items: [{ productVariantId: testVariant1Id, quantity: 1 }],
        })
        .expect(404);
    });

    it("should reject non-existent variant", async () => {
      await agent
        .post("/api/product-bundles")
        .send({
          productId: testBundleProductId,
          items: [{ productVariantId: 99999, quantity: 1 }],
        })
        .expect(404);
    });
  });

  describe("GET /api/product-bundles", () => {
    it("should list bundles", async () => {
      const res = await agent.get("/api/product-bundles").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].items).toBeDefined();
    });

    it("should filter by productId", async () => {
      const res = await agent.get(`/api/product-bundles?productId=${testBundleProductId}`).expect(200);
      expect(res.body.data.every((b) => b.productId === testBundleProductId)).toBe(true);
    });
  });

  describe("GET /api/product-bundles/:id", () => {
    it("should return bundle with items", async () => {
      const res = await agent.get(`/api/product-bundles/${testBundleId}`).expect(200);
      expect(res.body.data.id).toBe(testBundleId);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.product).toBeDefined();
    });

    it("should return 404 for non-existent", async () => {
      await agent.get("/api/product-bundles/99999").expect(404);
    });
  });

  describe("PUT /api/product-bundles/:id", () => {
    it("should update bundle description", async () => {
      const res = await agent
        .put(`/api/product-bundles/${testBundleId}`)
        .send({ description: "Updated description" })
        .expect(200);
      expect(res.body.data.description).toBe("Updated description");
    });

    it("should replace bundle items", async () => {
      const res = await agent
        .put(`/api/product-bundles/${testBundleId}`)
        .send({
          items: [
            { productVariantId: testVariant1Id, quantity: 3 },
            { productVariantId: testVariant2Id, quantity: 2 },
          ],
        })
        .expect(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.items[0].quantity).toBe(3);
    });
  });

  // ===== Bundle Expansion =====

  describe("POST /api/product-bundles/:id/expand", () => {
    it("should expand bundle into invoice items", async () => {
      const res = await agent
        .post(`/api/product-bundles/${testBundleId}/expand`)
        .send({ quantity: 1 })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty("productVariantId");
      expect(res.body.data[0]).toHaveProperty("quantity");
      expect(res.body.data[0]).toHaveProperty("unitPrice");
      expect(res.body.data[0]).toHaveProperty("description");
    });

    it("should multiply quantities when expanding multiple bundles", async () => {
      const res = await agent
        .post(`/api/product-bundles/${testBundleId}/expand`)
        .send({ quantity: 5 })
        .expect(200);

      // First item: 3 * 5 = 15
      expect(res.body.data[0].quantity).toBe(15);
      // Second item: 2 * 5 = 10
      expect(res.body.data[1].quantity).toBe(10);
    });
  });

  // ===== Delete =====

  describe("DELETE /api/product-bundles/:id", () => {
    it("should delete bundle (soft delete)", async () => {
      await agent.delete(`/api/product-bundles/${testBundleId}`).expect(200);
      await agent.get(`/api/product-bundles/${testBundleId}`).expect(404);
    });
  });

  // ===== RBAC =====

  describe("RBAC", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/product-bundles").expect(401);
    });
  });
});

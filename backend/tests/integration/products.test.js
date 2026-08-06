const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Products & Stock API Integration", () => {
  let agent;
  let testProductId;
  let testVariantId;
  let testBatchId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ===== Products =====

  describe("POST /api/products", () => {
    it("should create a product", async () => {
      const res = await agent
        .post("/api/products")
        .send({
          name: "Test Frames",
          category: "frames",
          costingMethod: "fifo",
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.displayId).toMatch(/^PRD-/);
      expect(res.body.data.name).toBe("Test Frames");
      testProductId = res.body.data.id;
    });

    it("should reject invalid category", async () => {
      const res = await agent
        .post("/api/products")
        .send({ name: "Bad", category: "invalid" })
        .expect(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/products", () => {
    it("should list products with pagination", async () => {
      const res = await agent.get("/api/products?page=1&pageSize=10").expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
    });

    it("should filter by category", async () => {
      const res = await agent.get("/api/products?category=frames").expect(200);
      expect(res.body.data.every((p) => p.category === "frames")).toBe(true);
    });

    it("should search by name", async () => {
      const res = await agent.get("/api/products?search=Test").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return product by id", async () => {
      const res = await agent.get(`/api/products/${testProductId}`).expect(200);
      expect(res.body.data.id).toBe(testProductId);
    });

    it("should return 404 for non-existent", async () => {
      const res = await agent.get("/api/products/99999").expect(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update product", async () => {
      const res = await agent
        .put(`/api/products/${testProductId}`)
        .send({ description: "Updated" })
        .expect(200);
      expect(res.body.data.description).toBe("Updated");
    });
  });

  // ===== Variants =====

  describe("POST /api/products/:productId/variants", () => {
    it("should create a variant", async () => {
      const res = await agent
        .post(`/api/products/${testProductId}/variants`)
        .send({
          name: "Standard",
          sku: "TEST-SKU-001",
          barcode: "1234567890123",
          sellPrice: 100.0,
          minQuantity: 5,
          maxQuantity: 50,
        })
        .expect(201);

      expect(res.body.data.sku).toBe("TEST-SKU-001");
      expect(res.body.data.quantity).toBe(0);
      testVariantId = res.body.data.id;
    });

    it("should reject duplicate SKU", async () => {
      const res = await agent
        .post(`/api/products/${testProductId}/variants`)
        .send({ name: "Dup", sku: "TEST-SKU-001", sellPrice: 50.0 })
        .expect(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/products/:productId/variants", () => {
    it("should list variants for a product", async () => {
      const res = await agent.get(`/api/products/${testProductId}/variants`).expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/products/barcode/:barcode", () => {
    it("should find variant by barcode", async () => {
      const res = await agent.get("/api/products/barcode/1234567890123").expect(200);
      expect(res.body.data.variant.barcode).toBe("1234567890123");
    });

    it("should return 404 for unknown barcode", async () => {
      await agent.get("/api/products/barcode/UNKNOWN").expect(404);
    });
  });

  // ===== Stock operations =====

  describe("POST /api/stock/opening-stock", () => {
    it("should record opening stock", async () => {
      const res = await agent
        .post("/api/stock/opening-stock")
        .send({
          productVariantId: testVariantId,
          quantity: 20,
          unitCost: 50.0,
          batchNumber: "BATCH-001",
          expiryDate: "2027-12-31",
        })
        .expect(201);

      expect(res.body.data.batch).toBeDefined();
      expect(res.body.data.batch.quantity).toBe(20);
      expect(res.body.data.movement).toBeDefined();
      testBatchId = res.body.data.batch.id;
    });
  });

  describe("GET /api/stock/stats", () => {
    it("should return inventory stats", async () => {
      const res = await agent.get("/api/stock/stats").expect(200);
      expect(res.body.data).toHaveProperty("totalValue");
      expect(res.body.data).toHaveProperty("lowStockCount");
    });
  });

  describe("GET /api/stock/valuation", () => {
    it("should return inventory valuation", async () => {
      const res = await agent.get("/api/stock/valuation").expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/stock/movements", () => {
    it("should list movements", async () => {
      const res = await agent.get("/api/stock/movements").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter by productVariantId", async () => {
      const res = await agent.get(`/api/stock/movements?productVariantId=${testVariantId}`).expect(200);
      expect(res.body.data.every((m) => m.productVariantId === testVariantId)).toBe(true);
    });
  });

  describe("POST /api/stock/adjust", () => {
    it("should adjust stock", async () => {
      const res = await agent
        .post("/api/stock/adjust")
        .send({
          productVariantId: testVariantId,
          batchId: testBatchId,
          newQuantity: 25,
          note: "Found 5 extra",
        })
        .expect(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe("POST /api/stock/damage", () => {
    it("should record damage", async () => {
      const res = await agent
        .post("/api/stock/damage")
        .send({
          batchId: testBatchId,
          quantity: 2,
          note: "Broken",
        })
        .expect(201);
      expect(res.body.data.reason).toBe("damage");
    });
  });

  describe("GET /api/stock/profit-loss", () => {
    it("should return profit/loss report", async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await agent
        .get(`/api/stock/profit-loss?startDate=${today}&endDate=${today}`)
        .expect(200);
      expect(res.body.data).toHaveProperty("revenue");
      expect(res.body.data).toHaveProperty("cogs");
    });

    it("should reject missing dates", async () => {
      await agent.get("/api/stock/profit-loss").expect(400);
    });
  });

  describe("GET /api/stock/variants/:variantId/movements", () => {
    it("should return movements for a variant", async () => {
      const res = await agent.get(`/api/stock/variants/${testVariantId}/movements`).expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ===== RBAC =====

  describe("RBAC", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/products").expect(401);
    });
  });
});

const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Inventory Reports + Dashboard Integration", () => {
  let agent;
  let testProductId;
  let testVariantId;
  let testSupplierId;
  let testPurchaseOrderId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    // Create a product with a variant
    const productRes = await agent
      .post("/api/products")
      .send({ name: "Report Test Product", category: "drops", costingMethod: "fifo" })
      .expect(201);
    testProductId = productRes.body.data.id;

    const variantRes = await agent
      .post(`/api/products/${testProductId}/variants`)
      .send({ name: "Report Variant", sku: "RPT-V1", sellPrice: 50.0, minQuantity: 10, maxQuantity: 200 })
      .expect(201);
    testVariantId = variantRes.body.data.id;

    // Add opening stock
    await agent
      .post("/api/stock/opening-stock")
      .send({ productVariantId: testVariantId, quantity: 100, unitCost: 10, batchNumber: "RPT-B1", expiryDate: "2028-12-31" })
      .expect(201);

    // Create a supplier
    const supplierRes = await agent
      .post("/api/suppliers")
      .send({ name: "Report Supplier", phone: "555-0100", openingBalance: 1000 })
      .expect(201);
    testSupplierId = supplierRes.body.data.id;

    // Create + receive a purchase order
    const poRes = await agent
      .post("/api/purchase-orders")
      .send({
        supplierId: testSupplierId,
        orderDate: new Date().toISOString().split("T")[0],
        items: [{ productVariantId: testVariantId, quantity: 50, unitCost: 12, batchNumber: "RPT-PO-B1", expiryDate: "2028-06-30" }],
      })
      .expect(201);
    testPurchaseOrderId = poRes.body.data.id;

    // Get the PO item id for receiving
    const poDetails = await agent.get(`/api/purchase-orders/${testPurchaseOrderId}`).expect(200);
    const poItemId = poDetails.body.data.items[0].id;

    await agent
      .post(`/api/purchase-orders/${testPurchaseOrderId}/receive`)
      .send({
        items: [{ id: poItemId, receivedQuantity: 50, batchNumber: "RPT-PO-B1", expiryDate: "2028-06-30" }],
      })
      .expect(200);

    // Pay supplier
    await agent
      .post(`/api/suppliers/${testSupplierId}/payments`)
      .send({ amount: 500, paymentMethod: "cash", paymentDate: new Date().toISOString().split("T")[0] })
      .expect(201);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ===== Dashboard with inventory stats =====

  describe("GET /api/dashboard/stats", () => {
    it("should return dashboard stats with inventory section", async () => {
      const res = await agent.get("/api/dashboard/stats").expect(200);
      expect(res.body.data).toHaveProperty("inventory");
      expect(res.body.data.inventory).toHaveProperty("totalValue");
      expect(res.body.data.inventory).toHaveProperty("lowStockCount");
      expect(res.body.data.inventory).toHaveProperty("outOfStockCount");
      expect(res.body.data.inventory).toHaveProperty("expiringCount");
      expect(res.body.data.inventory).toHaveProperty("expiredCount");
      expect(typeof res.body.data.inventory.totalValue).toBe("number");
    });
  });

  // ===== Inventory CSV export =====

  describe("GET /api/reports/inventory", () => {
    it("should export inventory as CSV", async () => {
      const res = await agent.get("/api/reports/inventory").expect(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("DisplayID");
      expect(res.text).toContain("Report Variant");
    });
  });

  // ===== Stock movements CSV export =====

  describe("GET /api/reports/stock-movements", () => {
    it("should export stock movements as CSV", async () => {
      const res = await agent.get("/api/reports/stock-movements").expect(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("DisplayID");
      expect(res.text).toContain("opening_stock");
    });

    it("should filter by type", async () => {
      const res = await agent.get("/api/reports/stock-movements?type=in").expect(200);
      expect(res.text).toContain("in");
    });
  });

  // ===== Suppliers CSV export =====

  describe("GET /api/reports/suppliers", () => {
    it("should export suppliers as CSV with balances", async () => {
      const res = await agent.get("/api/reports/suppliers").expect(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Report Supplier");
      expect(res.text).toContain("Balance");
    });
  });

  // ===== Purchase orders CSV export =====

  describe("GET /api/reports/purchase-orders", () => {
    it("should export purchase orders as CSV", async () => {
      const res = await agent.get("/api/reports/purchase-orders").expect(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("received");
    });
  });

  // ===== Supplier statement CSV export =====

  describe("GET /api/reports/supplier-statement/:supplierId", () => {
    it("should export supplier statement as CSV", async () => {
      const res = await agent.get(`/api/reports/supplier-statement/${testSupplierId}`).expect(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Opening Balance");
      expect(res.text).toContain("Purchase Order");
      expect(res.text).toContain("Payment");
    });

    it("should return 404 for non-existent supplier", async () => {
      await agent.get("/api/reports/supplier-statement/99999").expect(404);
    });
  });

  // ===== Inventory valuation JSON report =====

  describe("GET /api/reports/inventory-valuation", () => {
    it("should return inventory valuation report", async () => {
      const res = await agent.get("/api/reports/inventory-valuation").expect(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("summary");
      expect(res.body.data.summary).toHaveProperty("totalCostValue");
      expect(res.body.data.summary).toHaveProperty("totalSellValue");
      expect(res.body.data.summary).toHaveProperty("potentialProfit");
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0]).toHaveProperty("avgCost");
      expect(res.body.data.items[0]).toHaveProperty("totalCost");
    });
  });

  // ===== Profit/Loss JSON report =====

  describe("GET /api/reports/profit-loss", () => {
    it("should return profit/loss report for date range", async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await agent
        .get(`/api/reports/profit-loss?startDate=${today}&endDate=${today}`)
        .expect(200);
      expect(res.body.data).toHaveProperty("revenue");
      expect(res.body.data).toHaveProperty("cogs");
      expect(res.body.data).toHaveProperty("grossProfit");
      expect(res.body.data).toHaveProperty("grossMargin");
      expect(res.body.data).toHaveProperty("items");
    });

    it("should reject missing startDate", async () => {
      await agent.get("/api/reports/profit-loss?endDate=2026-01-01").expect(400);
    });
  });

  // ===== Low stock JSON report =====

  describe("GET /api/reports/low-stock", () => {
    it("should return low stock report", async () => {
      const res = await agent.get("/api/reports/low-stock").expect(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("count");
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  // ===== Expiry JSON report =====

  describe("GET /api/reports/expiry", () => {
    it("should return expiry report with default 30 days", async () => {
      const res = await agent.get("/api/reports/expiry").expect(200);
      expect(res.body.data).toHaveProperty("expiringSoon");
      expect(res.body.data).toHaveProperty("expired");
      expect(Array.isArray(res.body.data.expiringSoon)).toBe(true);
      expect(Array.isArray(res.body.data.expired)).toBe(true);
    });

    it("should accept custom days parameter", async () => {
      const res = await agent.get("/api/reports/expiry?days=365").expect(200);
      expect(res.body.data).toHaveProperty("expiringSoon");
    });
  });

  // ===== Dead stock JSON report =====

  describe("GET /api/reports/dead-stock", () => {
    it("should return dead stock report", async () => {
      const res = await agent.get("/api/reports/dead-stock?months=1").expect(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("count");
      expect(res.body.data).toHaveProperty("totalValue");
    });
  });

  // ===== RBAC =====

  describe("RBAC", () => {
    it("should require authentication for reports", async () => {
      await request(app).get("/api/reports/inventory").expect(401);
    });
  });
});

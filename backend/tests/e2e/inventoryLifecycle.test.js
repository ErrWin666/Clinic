const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("E2E: Inventory Lifecycle Flow", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Happy Path: Full inventory lifecycle", () => {
    let productId, variantId, supplierId, poId, batchId, stocktakingId;

    it("should create a product", async () => {
      const res = await agent.post("/api/products").send({
        name: "E2E Test Frames",
        category: "frames",
        costingMethod: "fifo",
        description: "Test product for E2E",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      productId = res.body.data.id;
    });

    it("should create a product variant", async () => {
      const res = await agent.post(`/api/products/${productId}/variants`).send({
        name: "Standard Frame",
        sku: "E2E-SKU-001",
        barcode: "E2EBC001",
        sellPrice: 150.0,
        minQuantity: 5,
        maxQuantity: 100,
      });
      expect(res.status).toBe(201);
      variantId = res.body.data.id;
    });

    it("should retrieve the variant by id", async () => {
      const res = await agent.get(`/api/products/${productId}/variants/${variantId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.sku).toBe("E2E-SKU-001");
    });

    it("should create a supplier", async () => {
      const res = await agent.post("/api/suppliers").send({
        name: "E2E Medical Supplies",
        phone: "5559998888",
        contactPerson: "John Doe",
        openingBalance: 0,
      });
      expect(res.status).toBe(201);
      supplierId = res.body.data.id;
    });

    it("should create a purchase order", async () => {
      const res = await agent.post("/api/purchase-orders").send({
        supplierId,
        orderDate: "2026-01-15",
        items: [
          {
            productVariantId: variantId,
            quantity: 50,
            unitCost: 75.0,
            batchNumber: "E2E-BATCH-001",
            expiryDate: "2028-06-30",
          },
        ],
      });
      expect(res.status).toBe(201);
      poId = res.body.data.id;
      expect(res.body.data.status).toBe("draft");
      expect(res.body.data.totalAmount).toBe(3750);
    });

    it("should receive the purchase order", async () => {
      const poRes = await agent.get(`/api/purchase-orders/${poId}`);
      const itemId = poRes.body.data.items[0].id;

      const res = await agent.post(`/api/purchase-orders/${poId}/receive`).send({
        items: [
          {
            id: itemId,
            receivedQuantity: 50,
            batchNumber: "E2E-BATCH-001",
            expiryDate: "2028-06-30",
          },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("received");
    });

    it("should verify variant quantity increased after PO receive", async () => {
      const res = await agent.get(`/api/products/${productId}/variants/${variantId}`);
      expect(res.status).toBe(200);
      expect(Number(res.body.data.quantity)).toBe(50);
    });

    it("should list stock movements", async () => {
      const res = await agent.get("/api/stock/movements");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should get inventory stats", async () => {
      const res = await agent.get("/api/stock/stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should check stock alerts", async () => {
      const res = await agent.get("/api/stock/alerts");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should get inventory valuation", async () => {
      const res = await agent.get("/api/stock/valuation");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should lookup variant by barcode", async () => {
      const res = await agent.get("/api/products/barcode/E2EBC001");
      expect(res.status).toBe(200);
      expect(res.body.data.variant).toBeDefined();
      expect(res.body.data.variant.barcode).toBe("E2EBC001");
    });

    it("should start a stocktaking session", async () => {
      const res = await agent.post("/api/stocktaking").send({
        note: "E2E stock count",
      });
      expect(res.status).toBe(201);
      stocktakingId = res.body.data.id;
      expect(res.body.data.status).toBe("in_progress");
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it("should update stocktaking counts", async () => {
      const stkRes = await agent.get(`/api/stocktaking/${stocktakingId}`);
      const itemId = stkRes.body.data.items[0].id;
      const systemQty = stkRes.body.data.items[0].systemQuantity;

      const res = await agent.put(`/api/stocktaking/${stocktakingId}/counts`).send({
        items: [{ id: itemId, countedQuantity: systemQty - 5 }],
      });
      expect(res.status).toBe(200);
      const item = res.body.data.items.find((i) => i.id === itemId);
      expect(item.difference).toBe(-5);
    });

    it("should complete the stocktaking", async () => {
      const res = await agent.post(`/api/stocktaking/${stocktakingId}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("completed");
    });

    it("should verify variant quantity decreased after stocktaking adjustment", async () => {
      const res = await agent.get(`/api/products/${productId}/variants/${variantId}`);
      expect(res.status).toBe(200);
      expect(Number(res.body.data.quantity)).toBe(45);
    });

    it("should record damage for a batch", async () => {
      // Get variant movements to find the batch
      const mvRes = await agent.get(`/api/stock/variants/${variantId}/movements`);
      const inMovement = mvRes.body.data.find((m) => m.type === "in");
      expect(inMovement).toBeDefined();
      batchId = inMovement.batchId;

      const res = await agent.post("/api/stock/damage").send({
        batchId,
        quantity: 3,
        note: "Damaged in E2E test",
      });
      expect(res.status).toBe(201);
    });

    it("should verify variant quantity decreased after damage", async () => {
      const res = await agent.get(`/api/products/${productId}/variants/${variantId}`);
      expect(res.status).toBe(200);
      expect(Number(res.body.data.quantity)).toBe(42);
    });

    it("should get supplier statement", async () => {
      const res = await agent.get(`/api/suppliers/${supplierId}/statement`);
      expect(res.status).toBe(200);
      expect(res.body.data.supplier).toBeDefined();
      expect(res.body.data.transactions).toBeDefined();
    });

    it("should create a supplier payment", async () => {
      const res = await agent.post(`/api/suppliers/${supplierId}/payments`).send({
        amount: 1000,
        paymentDate: "2026-02-01",
        paymentMethod: "cash",
      });
      expect(res.status).toBe(201);
    });

    it("should list supplier payments", async () => {
      const res = await agent.get(`/api/suppliers/${supplierId}/payments`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("Flow with out-of-stock scenario", () => {
    let productId, variantId;

    it("should create product with low min quantity", async () => {
      const prodRes = await agent.post("/api/products").send({
        name: "Low Stock Product",
        category: "drops",
        costingMethod: "fifo",
      });
      productId = prodRes.body.data.id;

      const varRes = await agent.post(`/api/products/${productId}/variants`).send({
        name: "Low Stock Variant",
        sku: "LOWSTOCK-001",
        sellPrice: 30.0,
        minQuantity: 10,
      });
      variantId = varRes.body.data.id;
    });

    it("should show alerts for low/out of stock", async () => {
      const res = await agent.get("/api/stock/alerts");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Flow with PO cancellation", () => {
    let supplierId, poId;

    it("should create supplier, PO, then cancel PO", async () => {
      const supRes = await agent.post("/api/suppliers").send({
        name: "Cancel PO Supplier",
      });
      supplierId = supRes.body.data.id;

      const poRes = await agent.post("/api/purchase-orders").send({
        supplierId,
        orderDate: "2026-03-01",
        items: [{ productVariantId: 1, quantity: 5, unitCost: 10 }],
      });
      poId = poRes.body.data.id;

      const cancelRes = await agent.post(`/api/purchase-orders/${poId}/cancel`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe("cancelled");
    });
  });

  describe("Flow with invalid data", () => {
    it("should reject product with invalid category", async () => {
      const res = await agent.post("/api/products").send({
        name: "Bad Category",
        category: "invalid_category",
        costingMethod: "fifo",
      });
      expect(res.status).toBe(400);
    });

    it("should reject variant with duplicate SKU", async () => {
      const prodRes = await agent.post("/api/products").send({
        name: "Dup SKU Product",
        category: "supplies",
        costingMethod: "fifo",
      });
      const productId = prodRes.body.data.id;

      await agent.post(`/api/products/${productId}/variants`).send({
        name: "V1",
        sku: "DUP-E2E-SKU",
        sellPrice: 50,
      });

      const res = await agent.post(`/api/products/${productId}/variants`).send({
        name: "V2",
        sku: "DUP-E2E-SKU",
        sellPrice: 60,
      });
      expect(res.status).toBe(400);
    });

    it("should reject PO for non-existent supplier", async () => {
      const res = await agent.post("/api/purchase-orders").send({
        supplierId: 99999,
        orderDate: "2026-01-01",
        items: [{ productVariantId: 1, quantity: 1, unitCost: 10 }],
      });
      expect(res.status).toBe(404);
    });

    it("should reject receiving already received PO", async () => {
      const supRes = await agent.post("/api/suppliers").send({ name: "Double Recv Supplier" });
      const poRes = await agent.post("/api/purchase-orders").send({
        supplierId: supRes.body.data.id,
        orderDate: "2026-04-01",
        items: [{ productVariantId: 1, quantity: 5, unitCost: 10 }],
      });
      const itemId = poRes.body.data.items[0].id;

      await agent.post(`/api/purchase-orders/${poRes.body.data.id}/receive`).send({
        items: [{ id: itemId, receivedQuantity: 5 }],
      });

      const res = await agent.post(`/api/purchase-orders/${poRes.body.data.id}/receive`).send({
        items: [{ id: itemId, receivedQuantity: 5 }],
      });
      expect(res.status).toBe(400);
    });
  });
});

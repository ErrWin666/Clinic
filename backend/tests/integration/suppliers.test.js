const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Suppliers & Purchase Orders API Integration", () => {
  let agent;
  let testSupplierId;
  let testProductId;
  let testVariantId;
  let testPOId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    // Create a product + variant for PO items
    const productRes = await agent
      .post("/api/products")
      .send({ name: "Test Product", category: "drops", costingMethod: "fifo" })
      .expect(201);
    testProductId = productRes.body.data.id;

    const variantRes = await agent
      .post(`/api/products/${testProductId}/variants`)
      .send({
        name: "Eye Drops 5ml",
        sku: "ED-001",
        sellPrice: 30.0,
        minQuantity: 5,
      })
      .expect(201);
    testVariantId = variantRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ===== Suppliers =====

  describe("POST /api/suppliers", () => {
    it("should create a supplier", async () => {
      const res = await agent
        .post("/api/suppliers")
        .send({
          name: "Medical Supplies Co.",
          phone: "555-1234",
          email: "contact@medsup.com",
          address: "123 Industrial St",
          contactPerson: "John Doe",
          openingBalance: 1000,
        })
        .expect(201);

      expect(res.body.data.displayId).toMatch(/^SUP-/);
      expect(res.body.data.name).toBe("Medical Supplies Co.");
      expect(Number(res.body.data.openingBalance)).toBe(1000);
      testSupplierId = res.body.data.id;
    });
  });

  describe("GET /api/suppliers", () => {
    it("should list suppliers with balance", async () => {
      const res = await agent.get("/api/suppliers").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("balance");
      expect(Number(res.body.data[0].balance)).toBe(1000); // opening balance
    });

    it("should search suppliers", async () => {
      const res = await agent.get("/api/suppliers?search=Medical").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/suppliers/:id", () => {
    it("should return supplier with balance", async () => {
      const res = await agent.get(`/api/suppliers/${testSupplierId}`).expect(200);
      expect(res.body.data.id).toBe(testSupplierId);
      expect(Number(res.body.data.balance)).toBe(1000);
    });

    it("should return 404 for non-existent", async () => {
      await agent.get("/api/suppliers/99999").expect(404);
    });
  });

  describe("PUT /api/suppliers/:id", () => {
    it("should update supplier", async () => {
      const res = await agent
        .put(`/api/suppliers/${testSupplierId}`)
        .send({ phone: "555-9999" })
        .expect(200);
      expect(res.body.data.phone).toBe("555-9999");
    });
  });

  // ===== Purchase Orders =====

  describe("POST /api/purchase-orders", () => {
    it("should create a purchase order", async () => {
      const res = await agent
        .post("/api/purchase-orders")
        .send({
          supplierId: testSupplierId,
          orderDate: "2026-08-01",
          items: [
            {
              productVariantId: testVariantId,
              quantity: 50,
              unitCost: 15.0,
              batchNumber: "PO-BATCH-001",
              expiryDate: "2027-08-01",
            },
          ],
        })
        .expect(201);

      expect(res.body.data.displayId).toMatch(/^PO-/);
      expect(res.body.data.status).toBe("draft");
      expect(Number(res.body.data.totalAmount)).toBe(750); // 50 * 15
      expect(res.body.data.items.length).toBe(1);
      testPOId = res.body.data.id;
    });

    it("should reject non-existent supplier", async () => {
      await agent
        .post("/api/purchase-orders")
        .send({
          supplierId: 99999,
          orderDate: "2026-08-01",
          items: [{ productVariantId: testVariantId, quantity: 1, unitCost: 10 }],
        })
        .expect(404);
    });
  });

  describe("GET /api/purchase-orders", () => {
    it("should list purchase orders", async () => {
      const res = await agent.get("/api/purchase-orders").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter by supplier", async () => {
      const res = await agent.get(`/api/purchase-orders?supplierId=${testSupplierId}`).expect(200);
      expect(res.body.data.every((po) => po.supplierId === testSupplierId)).toBe(true);
    });
  });

  describe("GET /api/purchase-orders/:id", () => {
    it("should return PO with items", async () => {
      const res = await agent.get(`/api/purchase-orders/${testPOId}`).expect(200);
      expect(res.body.data.id).toBe(testPOId);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBe(1);
    });
  });

  describe("PUT /api/purchase-orders/:id", () => {
    it("should update draft PO", async () => {
      const res = await agent
        .put(`/api/purchase-orders/${testPOId}`)
        .send({ note: "Updated note" })
        .expect(200);
      expect(res.body.data.note).toBe("Updated note");
    });
  });

  describe("POST /api/purchase-orders/:id/receive", () => {
    it("should receive PO and create batches + stock", async () => {
      const po = await agent.get(`/api/purchase-orders/${testPOId}`).expect(200);
      const itemId = po.body.data.items[0].id;

      const res = await agent
        .post(`/api/purchase-orders/${testPOId}/receive`)
        .send({
          items: [
            {
              id: itemId,
              receivedQuantity: 50,
              batchNumber: "RECEIVED-BATCH-001",
              expiryDate: "2027-08-01",
            },
          ],
        })
        .expect(200);

      expect(res.body.data.status).toBe("received");
      expect(res.body.data.receivedDate).toBeDefined();

      // Check variant quantity increased
      const variantRes = await agent.get(`/api/products/${testProductId}`).expect(200);
      const variant = variantRes.body.data.variants.find((v) => v.id === testVariantId);
      expect(variant.quantity).toBe(50);
    });

    it("should reject receiving already-received PO", async () => {
      const po = await agent.get(`/api/purchase-orders/${testPOId}`).expect(200);
      const itemId = po.body.data.items[0].id;

      await agent
        .post(`/api/purchase-orders/${testPOId}/receive`)
        .send({
          items: [{ id: itemId, receivedQuantity: 10 }],
        })
        .expect(400);
    });
  });

  describe("Supplier balance after PO receive", () => {
    it("should reflect PO total in supplier balance", async () => {
      const res = await agent.get(`/api/suppliers/${testSupplierId}`).expect(200);
      // openingBalance (1000) + received PO (750) - payments (0) = 1750
      expect(Number(res.body.data.balance)).toBe(1750);
    });
  });

  // ===== Supplier Payments =====

  describe("POST /api/suppliers/:supplierId/payments", () => {
    it("should create a supplier payment", async () => {
      const res = await agent
        .post(`/api/suppliers/${testSupplierId}/payments`)
        .send({
          amount: 500,
          paymentDate: "2026-08-02",
          paymentMethod: "cash",
          note: "Partial payment",
        })
        .expect(201);

      expect(res.body.data.displayId).toMatch(/^SPM-/);
      expect(Number(res.body.data.amount)).toBe(500);
    });

    it("should reject negative amount", async () => {
      await agent
        .post(`/api/suppliers/${testSupplierId}/payments`)
        .send({ amount: -100, paymentDate: "2026-08-02", paymentMethod: "cash" })
        .expect(400);
    });
  });

  describe("GET /api/suppliers/:supplierId/payments", () => {
    it("should list payments for a supplier", async () => {
      const res = await agent.get(`/api/suppliers/${testSupplierId}/payments`).expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("Supplier balance after payment", () => {
    it("should reflect payment in balance", async () => {
      const res = await agent.get(`/api/suppliers/${testSupplierId}`).expect(200);
      // 1000 + 750 - 500 = 1250
      expect(Number(res.body.data.balance)).toBe(1250);
    });
  });

  // ===== Supplier Statement =====

  describe("GET /api/suppliers/:id/statement", () => {
    it("should return supplier statement with running balance", async () => {
      const res = await agent.get(`/api/suppliers/${testSupplierId}/statement`).expect(200);
      expect(res.body.data.supplier).toBeDefined();
      expect(res.body.data.transactions).toBeDefined();
      expect(res.body.data.transactions.length).toBeGreaterThan(0);
      expect(res.body.data.currentBalance).toBeDefined();
      // Each transaction has a running balance
      expect(res.body.data.transactions[0]).toHaveProperty("balance");
    });
  });

  // ===== Cancel PO =====

  describe("POST /api/purchase-orders/:id/cancel", () => {
    it("should cancel a draft PO", async () => {
      // Create another PO
      const createRes = await agent
        .post("/api/purchase-orders")
        .send({
          supplierId: testSupplierId,
          orderDate: "2026-08-01",
          items: [{ productVariantId: testVariantId, quantity: 10, unitCost: 20 }],
        })
        .expect(201);

      const res = await agent
        .post(`/api/purchase-orders/${createRes.body.data.id}/cancel`)
        .expect(200);
      expect(res.body.data.status).toBe("cancelled");
    });

    it("should reject cancelling received PO", async () => {
      await agent.post(`/api/purchase-orders/${testPOId}/cancel`).expect(400);
    });
  });

  // ===== Delete supplier =====

  describe("DELETE /api/suppliers/:id", () => {
    it("should reject delete when supplier has balance", async () => {
      await agent.delete(`/api/suppliers/${testSupplierId}`).expect(400);
    });

    it("should delete supplier with zero balance", async () => {
      // Create supplier with no balance
      const createRes = await agent
        .post("/api/suppliers")
        .send({ name: "Zero Balance Supplier" })
        .expect(201);

      await agent.delete(`/api/suppliers/${createRes.body.data.id}`).expect(200);
    });
  });
});

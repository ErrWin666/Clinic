const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("E2E: Supplier Lifecycle Flow", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Happy Path: Full supplier lifecycle", () => {
    let supplierId, poId, paymentId;

    it("should create a supplier", async () => {
      const res = await agent.post("/api/suppliers").send({
        name: "E2E Supplier",
        contactPerson: "John Doe",
        phoneNumber: "555-1000",
        email: "supplier@test.com",
        address: "123 Test St",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      supplierId = res.body.data.id;
    });

    it("should get supplier by id", async () => {
      const res = await agent.get(`/api/suppliers/${supplierId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("E2E Supplier");
    });

    it("should update supplier", async () => {
      const res = await agent.put(`/api/suppliers/${supplierId}`).send({
        name: "Updated Supplier",
        contactPerson: "Jane Doe",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Supplier");
    });

    it("should create a purchase order for the supplier", async () => {
      const productRes = await agent.post("/api/products").send({
        name: "PO Test Product",
        category: "frames",
        costingMethod: "fifo",
      });
      const variantRes = await agent.post(`/api/products/${productRes.body.data.id}/variants`).send({
        name: "Default",
        sku: "PO-VAR-001",
        sellPrice: 100,
      });
      const res = await agent.post("/api/purchase-orders").send({
        supplierId,
        orderDate: "2026-06-01",
        note: "E2E test PO",
        items: [
          { productVariantId: variantRes.body.data.id, quantity: 10, unitCost: 50 },
        ],
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      poId = res.body.data.id;
    });

    it("should get PO by id", async () => {
      const res = await agent.get(`/api/purchase-orders/${poId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(poId);
    });

    it("should list POs for the supplier", async () => {
      const res = await agent.get("/api/purchase-orders").query({ supplierId });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should cancel the purchase order", async () => {
      const res = await agent.post(`/api/purchase-orders/${poId}/cancel`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("cancelled");
    });

    it("should create a payment for the supplier", async () => {
      const res = await agent.post(`/api/suppliers/${supplierId}/payments`).send({
        amount: 500,
        paymentDate: "2026-06-15",
        paymentMethod: "bank_transfer",
        note: "Advance payment",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      paymentId = res.body.data.id;
    });

    it("should list payments for the supplier", async () => {
      const res = await agent.get(`/api/suppliers/${supplierId}/payments`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should get supplier statement", async () => {
      const res = await agent.get(`/api/suppliers/${supplierId}/statement`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should export suppliers as CSV", async () => {
      const res = await agent.get("/api/reports/suppliers").query({ search: "Updated" });
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });

    it("should export supplier statement as CSV", async () => {
      const res = await agent.get(`/api/reports/supplier-statement/${supplierId}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });

    it("should soft-delete the supplier (without outstanding balance)", async () => {
      // Create a fresh supplier with no payments for deletion test
      const freshRes = await agent.post("/api/suppliers").send({
        name: "Delete Test Supplier",
        contactPerson: "Delete",
        phoneNumber: "555-9999",
      });
      const freshId = freshRes.body.data.id;
      const res = await agent.delete(`/api/suppliers/${freshId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should not return deleted supplier in list", async () => {
      const res = await agent.get("/api/suppliers");
      expect(res.status).toBe(200);
      const found = res.body.data.find((s) => s.name === "Delete Test Supplier");
      expect(found).toBeUndefined();
    });
  });

  describe("Error cases", () => {
    it("should reject supplier creation without name", async () => {
      const res = await agent.post("/api/suppliers").send({
        contactPerson: "No Name",
      });
      expect(res.status).toBe(400);
    });

    it("should reject payment with negative amount", async () => {
      const res = await agent.post("/api/suppliers/1/payments").send({
        amount: -100,
        paymentMethod: "cash",
      });
      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent supplier", async () => {
      const res = await agent.get("/api/suppliers/99999");
      expect(res.status).toBe(404);
    });

    it("should return 404 for non-existent PO", async () => {
      const res = await agent.get("/api/purchase-orders/99999");
      expect(res.status).toBe(404);
    });
  });
});

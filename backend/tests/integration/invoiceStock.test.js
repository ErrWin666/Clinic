const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { ProductVariant } = require("../../src/models");

describe("Invoice + Stock Integration", () => {
  let agent;
  let testPatientId;
  let testProductId;
  let testVariantId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    // Create patient
    const patientRes = await agent
      .post("/api/patients")
      .send({
        fullName: "Stock Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "1112223333",
      })
      .expect(201);
    testPatientId = patientRes.body.data.id;

    // Create product + variant
    const productRes = await agent
      .post("/api/products")
      .send({ name: "Test Frames", category: "frames", costingMethod: "fifo" })
      .expect(201);
    testProductId = productRes.body.data.id;

    const variantRes = await agent
      .post(`/api/products/${testProductId}/variants`)
      .send({
        name: "Standard Frame",
        sku: "STOCK-TEST-001",
        sellPrice: 100.0,
        minQuantity: 5,
      })
      .expect(201);
    testVariantId = variantRes.body.data.id;

    // Add opening stock (20 units at 50 cost)
    await agent
      .post("/api/stock/opening-stock")
      .send({
        productVariantId: testVariantId,
        quantity: 20,
        unitCost: 50.0,
        batchNumber: "INV-BATCH-001",
        expiryDate: "2028-12-31",
      })
      .expect(201);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Invoice with product variant — stock deduction on paid", () => {
    let invoiceId;

    it("should create invoice with productVariantId in items", async () => {
      const res = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-08-02",
          items: [
            {
              description: "Eye exam",
              quantity: 1,
              unitPrice: 50.0,
            },
            {
              description: "Standard Frame",
              quantity: 3,
              unitPrice: 100.0,
              productVariantId: testVariantId,
            },
          ],
        })
        .expect(201);

      invoiceId = res.body.data.id;
      expect(res.body.data.totalAmount).toBe(350); // 50 + 300
    });

    it("should NOT deduct stock when invoice is unpaid", async () => {
      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(20); // still 20
    });

    it("should deduct stock when invoice is marked as paid", async () => {
      await agent
        .patch(`/api/invoices/${invoiceId}/status`)
        .send({ status: "paid" })
        .expect(200);

      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(17); // 20 - 3
    });

    it("should return stock when paid invoice is cancelled", async () => {
      await agent
        .patch(`/api/invoices/${invoiceId}/status`)
        .send({ status: "cancelled" })
        .expect(200);

      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(20); // back to 20
    });
  });

  describe("Invoice created as paid — immediate stock deduction", () => {
    let invoiceId;

    it("should create invoice as paid and deduct stock immediately", async () => {
      const res = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-08-02",
          invoiceStatus: "paid",
          items: [
            {
              description: "Standard Frame",
              quantity: 5,
              unitPrice: 100.0,
              productVariantId: testVariantId,
            },
          ],
        })
        .expect(201);

      invoiceId = res.body.data.id;
      expect(res.body.data.invoiceStatus).toBe("paid");

      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(15); // 20 - 5
    });

    it("should return stock when cancelling the paid invoice", async () => {
      await agent
        .patch(`/api/invoices/${invoiceId}/status`)
        .send({ status: "cancelled" })
        .expect(200);

      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(20); // back to 20
    });
  });

  describe("Invoice with service only — no stock deduction", () => {
    it("should not affect stock when invoice has no productVariantId items", async () => {
      const before = await ProductVariant.findByPk(testVariantId);

      const res = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-08-02",
          invoiceStatus: "paid",
          items: [
            { description: "Consultation", quantity: 1, unitPrice: 200.0 },
          ],
        })
        .expect(201);

      const after = await ProductVariant.findByPk(testVariantId);
      expect(after.quantity).toBe(before.quantity); // unchanged
    });
  });

  describe("Stock movements linked to invoice", () => {
    it("should create stock movements with referenceType=Invoice", async () => {
      // Create + pay an invoice with a product
      const res = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-08-02",
          items: [
            {
              description: "Standard Frame",
              quantity: 2,
              unitPrice: 100.0,
              productVariantId: testVariantId,
            },
          ],
        })
        .expect(201);

      await agent
        .patch(`/api/invoices/${res.body.data.id}/status`)
        .send({ status: "paid" })
        .expect(200);

      // Check movements
      const movementsRes = await agent
        .get(`/api/stock/movements?referenceType=Invoice&referenceId=${res.body.data.id}`)
        .expect(200);

      expect(movementsRes.body.data.length).toBeGreaterThan(0);
      expect(movementsRes.body.data[0].referenceType).toBe("Invoice");
      expect(movementsRes.body.data[0].reason).toBe("sale");
    });
  });
});

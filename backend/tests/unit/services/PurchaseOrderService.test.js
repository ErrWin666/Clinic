const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestSupplier,
} = require("../../helpers/factories");
const PurchaseOrderService = require("../../../src/services/PurchaseOrderService");
const CustomError = require("../../../src/utils/CustomError");
const { PurchaseOrder, PurchaseOrderItem, User } = require("../../../src/models");

async function setStatus(poId, status) {
  const po = await PurchaseOrder.findByPk(poId);
  return po.update({ status });
}

describe("PurchaseOrderService", () => {
  let service;
  let testSupplier;
  let testVariant;
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
    testUser = await createTestAdmin();
    service = new PurchaseOrderService();
    testSupplier = await createTestSupplier({ name: "PO Supplier" });
    const product = await createTestProduct();
    testVariant = await createTestProductVariant(product.id);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a draft purchase order with items", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-01-15",
        items: [
          { productVariantId: testVariant.id, quantity: 10, unitCost: 25.0 },
          { productVariantId: testVariant.id, quantity: 5, unitCost: 30.0 },
        ],
      });
      expect(po).toBeDefined();
      expect(po.displayId).toMatch(/^PO-/);
      expect(po.status).toBe("draft");
      expect(po.totalAmount).toBe(400);
      expect(po.items.length).toBe(2);
    });

    it("should reject non-existent supplier", async () => {
      await expect(
        service.create({
          supplierId: 99999,
          orderDate: "2026-01-15",
          items: [{ productVariantId: testVariant.id, quantity: 1, unitCost: 10 }],
        })
      ).rejects.toThrow();
    });

    it("should create with note and userId", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-01-20",
        note: "Urgent order",
        items: [{ productVariantId: testVariant.id, quantity: 2, unitCost: 15 }],
      }, testUser.id);
      expect(po.note).toBe("Urgent order");
      expect(po.userId).toBe(testUser.id);
    });
  });

  describe("getById", () => {
    it("should return PO by id with items", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-02-01",
        items: [{ productVariantId: testVariant.id, quantity: 3, unitCost: 15.0 }],
      });
      const found = await service.getById(po.id);
      expect(found.id).toBe(po.id);
      expect(found.items).toBeDefined();
    });

    it("should throw 404 for non-existent PO", async () => {
      await expect(service.getById(99999)).rejects.toThrow();
      try {
        await service.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should list POs with pagination", async () => {
      const result = await service.list({ page: 1, pageSize: 10 });
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });

    it("should filter by supplierId", async () => {
      const result = await service.list({ supplierId: testSupplier.id });
      expect(result.rows.every((po) => po.supplierId === testSupplier.id)).toBe(true);
    });

    it("should filter by status", async () => {
      const result = await service.list({ status: "draft" });
      expect(result.rows.every((po) => po.status === "draft")).toBe(true);
    });

    it("should filter by date range", async () => {
      const result = await service.list({ startDate: "2026-01-01", endDate: "2026-12-31" });
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe("update", () => {
    it("should update draft PO", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-03-01",
        items: [{ productVariantId: testVariant.id, quantity: 5, unitCost: 10 }],
      });
      const updated = await service.update(po.id, { note: "Updated note" });
      expect(updated.note).toBe("Updated note");
    });

    it("should replace items when provided", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-03-02",
        items: [{ productVariantId: testVariant.id, quantity: 5, unitCost: 10 }],
      });
      const updated = await service.update(po.id, {
        items: [{ productVariantId: testVariant.id, quantity: 20, unitCost: 15 }],
      });
      expect(updated.items.length).toBe(1);
      expect(updated.items[0].quantity).toBe(20);
      expect(updated.totalAmount).toBe(300);
    });

    it("should reject update on non-draft PO", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-03-03",
        items: [{ productVariantId: testVariant.id, quantity: 1, unitCost: 10 }],
      });
      await setStatus(po.id, "ordered");
      await expect(service.update(po.id, { note: "test" })).rejects.toThrow();
    });

    it("should throw 404 for non-existent PO on update", async () => {
      await expect(service.update(99999, { note: "test" })).rejects.toThrow();
    });

    it("should update orderDate", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-03-04",
        items: [{ productVariantId: testVariant.id, quantity: 1, unitCost: 10 }],
      });
      const updated = await service.update(po.id, { orderDate: "2026-03-15" });
      expect(updated.orderDate).toBe("2026-03-15");
    });
  });

  describe("cancel", () => {
    it("should cancel a draft/ordered PO", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-04-01",
        items: [{ productVariantId: testVariant.id, quantity: 1, unitCost: 10 }],
      });
      const cancelled = await service.cancel(po.id);
      expect(cancelled.status).toBe("cancelled");
    });

    it("should reject cancelling a received PO", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-04-02",
        items: [{ productVariantId: testVariant.id, quantity: 1, unitCost: 10 }],
      });
      await setStatus(po.id, "received");
      await expect(service.cancel(po.id)).rejects.toThrow();
    });

    it("should throw 404 for non-existent PO", async () => {
      await expect(service.cancel(99999)).rejects.toThrow();
    });
  });

  describe("receive", () => {
    it("should receive a PO and create stock", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-05-01",
        items: [
          {
            productVariantId: testVariant.id,
            quantity: 10,
            unitCost: 20.0,
            batchNumber: "RECV-001",
            expiryDate: "2028-06-30",
          },
        ],
      });
      const received = await service.receive(po.id, [
        {
          id: po.items[0].id,
          receivedQuantity: 10,
          batchNumber: "RECV-001",
          expiryDate: "2028-06-30",
        },
      ]);
      expect(received.status).toBe("received");
      expect(received.receivedDate).toBeDefined();
    });

    it("should reject receiving an already received PO", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-05-02",
        items: [{ productVariantId: testVariant.id, quantity: 5, unitCost: 10 }],
      });
      await service.receive(po.id, [
        { id: po.items[0].id, receivedQuantity: 5 },
      ]);
      await expect(
        service.receive(po.id, [{ id: po.items[0].id, receivedQuantity: 5 }])
      ).rejects.toThrow();
    });

    it("should reject receiving a cancelled PO", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-05-03",
        items: [{ productVariantId: testVariant.id, quantity: 5, unitCost: 10 }],
      });
      await service.cancel(po.id);
      await expect(
        service.receive(po.id, [{ id: po.items[0].id, receivedQuantity: 5 }])
      ).rejects.toThrow();
    });

    it("should throw 404 for non-existent PO on receive", async () => {
      await expect(
        service.receive(99999, [{ id: 1, receivedQuantity: 5 }])
      ).rejects.toThrow();
    });

    it("should reject receiving with invalid item id", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-05-04",
        items: [{ productVariantId: testVariant.id, quantity: 5, unitCost: 10 }],
      });
      await expect(
        service.receive(po.id, [{ id: 99999, receivedQuantity: 5 }])
      ).rejects.toThrow();
    });

    it("should receive with receivedQuantity=0 (skip stock creation)", async () => {
      const po = await service.create({
        supplierId: testSupplier.id,
        orderDate: "2026-05-05",
        items: [{ productVariantId: testVariant.id, quantity: 5, unitCost: 10 }],
      });
      const received = await service.receive(po.id, [
        { id: po.items[0].id, receivedQuantity: 0 },
      ]);
      expect(received.status).toBe("received");
    });
  });
});

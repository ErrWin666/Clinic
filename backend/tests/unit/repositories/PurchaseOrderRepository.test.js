const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestSupplier,
  createTestProduct,
  createTestProductVariant,
} = require("../../helpers/factories");
const PurchaseOrderRepository = require("../../../src/repositories/PurchaseOrderRepository");
const { PurchaseOrder, PurchaseOrderItem } = require("../../../src/models");
const { generateDisplayId } = require("../../../src/utils/displayId");

describe("PurchaseOrderRepository", () => {
  let repo;
  let testSupplier;
  let testVariant;

  beforeAll(async () => {
    await setupTestDB();
    repo = new PurchaseOrderRepository();
    testSupplier = await createTestSupplier({ name: "Repo Supplier" });
    const product = await createTestProduct();
    testVariant = await createTestProductVariant(product.id);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it("should find by id with items", async () => {
    const displayId = await generateDisplayId(PurchaseOrder, "PO");
    const po = await PurchaseOrder.create({
      displayId,
      supplierId: testSupplier.id,
      orderDate: "2026-01-01",
      totalAmount: 100,
      status: "draft",
    });
    await PurchaseOrderItem.create({
      purchaseOrderId: po.id,
      productVariantId: testVariant.id,
      quantity: 5,
      unitCost: 10,
    });

    const found = await repo.findByIdWithItems(po.id);
    expect(found).toBeDefined();
    expect(found.items).toBeDefined();
    expect(found.items.length).toBe(1);
  });

  it("should find by id with supplier", async () => {
    const displayId = await generateDisplayId(PurchaseOrder, "PO");
    const po = await PurchaseOrder.create({
      displayId,
      supplierId: testSupplier.id,
      orderDate: "2026-01-02",
      totalAmount: 200,
      status: "draft",
    });

    const found = await repo.findByIdWithSupplier(po.id);
    expect(found).toBeDefined();
    expect(found.supplier).toBeDefined();
  });

  it("should find by id with all associations", async () => {
    const displayId = await generateDisplayId(PurchaseOrder, "PO");
    const po = await PurchaseOrder.create({
      displayId,
      supplierId: testSupplier.id,
      orderDate: "2026-01-03",
      totalAmount: 300,
      status: "draft",
    });
    await PurchaseOrderItem.create({
      purchaseOrderId: po.id,
      productVariantId: testVariant.id,
      quantity: 3,
      unitCost: 100,
    });

    const found = await repo.findByIdWithAll(po.id);
    expect(found).toBeDefined();
    expect(found.supplier).toBeDefined();
    expect(found.items).toBeDefined();
    expect(found.items.length).toBe(1);
  });

  it("should search with filters", async () => {
    const displayId = await generateDisplayId(PurchaseOrder, "PO");
    await PurchaseOrder.create({
      displayId,
      supplierId: testSupplier.id,
      orderDate: "2026-01-04",
      totalAmount: 400,
      status: "draft",
    });

    const { rows, count } = await repo.searchWithFilters({
      where: {},
      offset: 0,
      limit: 10,
      order: [["orderDate", "DESC"]],
    });
    expect(rows).toBeDefined();
    expect(count).toBeGreaterThan(0);
  });

  it("should search with default order when order not provided", async () => {
    const { rows, count } = await repo.searchWithFilters({
      where: {},
      offset: 0,
      limit: 10,
    });
    expect(rows).toBeDefined();
    expect(count).toBeGreaterThan(0);
  });

  it("should find oldest received PO by supplier", async () => {
    const displayId = await generateDisplayId(PurchaseOrder, "PO");
    const po = await PurchaseOrder.create({
      displayId,
      supplierId: testSupplier.id,
      orderDate: "2026-01-05",
      totalAmount: 500,
      status: "received",
      receivedDate: "2026-01-10",
    });

    const found = await repo.findOldestReceivedPOBySupplier(testSupplier.id);
    expect(found).toBeDefined();
    expect(found.supplierId).toBe(testSupplier.id);
    expect(found.status).toBe("received");
  });

  it("should return null for oldest received PO when none exists", async () => {
    const found = await repo.findOldestReceivedPOBySupplier(99999);
    expect(found).toBeNull();
  });
});

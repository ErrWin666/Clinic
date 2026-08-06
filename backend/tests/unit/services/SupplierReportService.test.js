const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestSupplier } = require("../../helpers/factories");
const SupplierReportService = require("../../../src/services/reports/SupplierReportService");
const { PurchaseOrder, SupplierPayment } = require("../../../src/models");
const { generateDisplayId } = require("../../../src/utils/displayId");

describe("SupplierReportService", () => {
  let service;

  beforeAll(async () => {
    await setupTestDB();
    service = new SupplierReportService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("exportSuppliers", () => {
    it("should return empty export when no suppliers", async () => {
      const result = await service.exportSuppliers({});
      expect(result.headers).toBeDefined();
      expect(result.rows).toEqual([]);
    });

    it("should export suppliers with correct headers", async () => {
      await createTestSupplier({ name: "Export Supplier 1" });

      const result = await service.exportSuppliers({});
      expect(result.headers).toContain("DisplayID");
      expect(result.headers).toContain("Name");
      expect(result.headers).toContain("Balance");
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should calculate balance from PO totals and payments", async () => {
      const supplier = await createTestSupplier({ name: "Balance Supplier", openingBalance: 100 });

      // Create a received PO
      const poDisplayId = await generateDisplayId(PurchaseOrder, "PO");
      const po = await PurchaseOrder.create({
        displayId: poDisplayId,
        supplierId: supplier.id,
        orderDate: "2026-01-01",
        status: "received",
        totalAmount: 500,
      });

      // Create a payment
      const payDisplayId = await generateDisplayId(SupplierPayment, "PAY");
      await SupplierPayment.create({
        displayId: payDisplayId,
        supplierId: supplier.id,
        amount: 300,
        paymentDate: "2026-02-01",
        paymentMethod: "cash",
      });

      const result = await service.exportSuppliers({});
      const row = result.rows.find((r) => r[1] === "Balance Supplier");
      expect(row).toBeDefined();
      // Balance = openingBalance(100) + PO total(500) - payments(300) = 300
      expect(row[6]).toBe(300);
    });

    it("should filter by search term", async () => {
      await createTestSupplier({ name: "Searchable Supplier", phone: "5550001111" });

      const result = await service.exportSuppliers({ search: "Searchable" });
      expect(result.rows.length).toBe(1);
      expect(result.rows[0][1]).toContain("Searchable");
    });

    it("should exclude inactive suppliers", async () => {
      const supplier = await createTestSupplier({ name: "Inactive Supplier" });
      await supplier.update({ isActive: false });

      const result = await service.exportSuppliers({});
      expect(result.rows.find((r) => r[1] === "Inactive Supplier")).toBeUndefined();
    });
  });

  describe("exportPurchaseOrders", () => {
    it("should return valid structure when no POs", async () => {
      const result = await service.exportPurchaseOrders({});
      expect(result.headers).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it("should export POs with correct headers", async () => {
      const supplier = await createTestSupplier({ name: "PO Export Supplier" });
      const displayId = await generateDisplayId(PurchaseOrder, "PO");
      await PurchaseOrder.create({
        displayId,
        supplierId: supplier.id,
        orderDate: "2026-03-01",
        status: "draft",
        totalAmount: 250,
      });

      const result = await service.exportPurchaseOrders({});
      expect(result.headers).toContain("DisplayID");
      expect(result.headers).toContain("Supplier");
      expect(result.headers).toContain("Status");
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});

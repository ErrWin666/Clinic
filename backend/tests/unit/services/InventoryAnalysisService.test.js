const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestSupplier,
  createTestBatch,
  createTestStockMovement,
} = require("../../helpers/factories");
const InventoryAnalysisService = require("../../../src/services/reports/InventoryAnalysisService");
const { Invoice, InvoiceItem, ProductVariant, Batch, StockMovement } = require("../../../src/models");
const { generateDisplayId } = require("../../../src/utils/displayId");

describe("InventoryAnalysisService", () => {
  let service;

  beforeAll(async () => {
    await setupTestDB();
    service = new InventoryAnalysisService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("getInventoryValuationReport", () => {
    it("should return empty report when no variants", async () => {
      const report = await service.getInventoryValuationReport();
      expect(report.items).toEqual([]);
      expect(report.summary.totalVariants).toBe(0);
      expect(report.summary.totalCostValue).toBe(0);
    });

    it("should calculate valuation for variants with stock", async () => {
      const product = await createTestProduct({ name: "Valuation Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Valuation Variant",
        sku: "VAL-001",
        sellPrice: 100,
        quantity: 0,
      });
      const supplier = await createTestSupplier();
      await createTestBatch(variant.id, {
        supplierId: supplier.id,
        quantity: 20,
        unitCost: 50,
        initialQuantity: 20,
      });
      await variant.update({ quantity: 20 });

      const report = await service.getInventoryValuationReport();
      const item = report.items.find((i) => i.sku === "VAL-001");
      expect(item).toBeDefined();
      expect(item.quantity).toBe(20);
      expect(item.avgCost).toBe(50);
      expect(item.totalCost).toBe(1000);
      expect(item.sellPrice).toBe(100);
      expect(item.potentialProfit).toBe(1000);
    });

    it("should exclude inactive variants", async () => {
      const product = await createTestProduct({ name: "Inactive Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Inactive Variant",
        sku: "INACT-VAL-001",
        sellPrice: 50,
        quantity: 10,
      });
      await variant.update({ isActive: false });

      const report = await service.getInventoryValuationReport();
      expect(report.items.find((i) => i.sku === "INACT-VAL-001")).toBeUndefined();
    });

    it("should exclude variants with zero quantity", async () => {
      const product = await createTestProduct({ name: "Zero Qty Product" });
      await createTestProductVariant(product.id, {
        name: "Zero Qty Variant",
        sku: "ZERO-VAL-001",
        sellPrice: 50,
        quantity: 0,
      });

      const report = await service.getInventoryValuationReport();
      expect(report.items.find((i) => i.sku === "ZERO-VAL-001")).toBeUndefined();
    });
  });

  describe("getLowStockReport", () => {
    it("should return empty report when no low stock", async () => {
      const report = await service.getLowStockReport();
      expect(report.items).toEqual([]);
      expect(report.count).toBe(0);
    });

    it("should identify variants at or below min quantity", async () => {
      const product = await createTestProduct({ name: "Low Stock Product" });
      await createTestProductVariant(product.id, {
        name: "Low Stock Variant",
        sku: "LOW-001",
        sellPrice: 30,
        quantity: 3,
        minQuantity: 10,
      });

      const report = await service.getLowStockReport();
      const item = report.items.find((i) => i.sku === "LOW-001");
      expect(item).toBeDefined();
      expect(item.quantity).toBe(3);
      expect(item.minQuantity).toBe(10);
      expect(item.shortfall).toBe(7);
    });
  });

  describe("getExpiryReport", () => {
    it("should return empty report when no batches", async () => {
      const report = await service.getExpiryReport(30);
      expect(report.expiringSoon).toEqual([]);
      expect(report.expired).toEqual([]);
    });

    it("should identify expired batches", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const supplier = await createTestSupplier();
      await createTestBatch(variant.id, {
        supplierId: supplier.id,
        batchNumber: "EXPIRED-001",
        expiryDate: "2020-01-01",
        quantity: 5,
        initialQuantity: 5,
      });

      const report = await service.getExpiryReport(30);
      expect(report.expired.length).toBeGreaterThan(0);
      const expired = report.expired.find((b) => b.batchNumber === "EXPIRED-001");
      expect(expired).toBeDefined();
    });

    it("should identify expiring soon batches", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const supplier = await createTestSupplier();
      const nearExpiry = new Date();
      nearExpiry.setDate(nearExpiry.getDate() + 15);
      const expiryStr = nearExpiry.toISOString().split("T")[0];

      await createTestBatch(variant.id, {
        supplierId: supplier.id,
        batchNumber: "EXPIRING-001",
        expiryDate: expiryStr,
        quantity: 5,
        initialQuantity: 5,
      });

      const report = await service.getExpiryReport(30);
      const expiring = report.expiringSoon.find((b) => b.batchNumber === "EXPIRING-001");
      expect(expiring).toBeDefined();
    });
  });

  describe("getDeadStockReport", () => {
    it("should return valid report structure when no dead stock", async () => {
      const report = await service.getDeadStockReport(3);
      expect(report).toBeDefined();
      expect(Array.isArray(report.items)).toBe(true);
      expect(typeof report.count).toBe("number");
      expect(typeof report.totalValue).toBe("number");
    });

    it("should identify variants with no recent out movements", async () => {
      const product = await createTestProduct({ name: "Dead Stock Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "Dead Stock Variant",
        sku: "DEAD-001",
        sellPrice: 50,
        quantity: 10,
      });
      const supplier = await createTestSupplier();
      await createTestBatch(variant.id, {
        supplierId: supplier.id,
        quantity: 10,
        unitCost: 20,
        initialQuantity: 10,
      });
      await variant.update({ quantity: 10 });

      const report = await service.getDeadStockReport(3);
      const item = report.items.find((i) => i.sku === "DEAD-001");
      expect(item).toBeDefined();
      expect(item.quantity).toBe(10);
      expect(item.totalCost).toBe(200);
    });
  });

  describe("getProfitLossReport", () => {
    it("should return empty report when no paid invoices", async () => {
      const report = await service.getProfitLossReport("2026-01-01", "2026-12-31");
      expect(report.revenue).toBe(0);
      expect(report.cogs).toBe(0);
      expect(report.grossProfit).toBe(0);
      expect(report.items).toEqual([]);
    });

    it("should calculate profit/loss from paid invoices", async () => {
      const { Patient } = require("../../../src/models");
      const patient = await Patient.create({
        displayId: "PAT-PL-001",
        fullName: "PL Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000001",
      });

      // Create a product variant so we can link the invoice item to it
      const product = await createTestProduct({ name: "PL Product" });
      const variant = await createTestProductVariant(product.id, {
        name: "PL Variant",
        sku: "PL-001",
        sellPrice: 100,
        quantity: 10,
      });

      const invDisplayId = await generateDisplayId(Invoice, "INV");
      const invoice = await Invoice.create({
        displayId: invDisplayId,
        patientId: patient.id,
        invoiceDate: "2026-06-01",
        invoiceStatus: "paid",
        totalAmount: 200,
        paidAmount: 200,
      });
      await InvoiceItem.create({
        invoiceId: invoice.id,
        description: "Consultation",
        quantity: 2,
        unitPrice: 100,
        total: 200,
        costAmount: 60,
        productVariantId: variant.id,
      });

      const report = await service.getProfitLossReport("2026-01-01", "2026-12-31");
      expect(report.revenue).toBe(200);
      expect(report.cogs).toBe(60);
      expect(report.grossProfit).toBe(140);
      expect(report.grossMargin).toBe(70);
    });

    it("should handle items without productVariantId (no cogs)", async () => {
      const { Patient } = require("../../../src/models");
      const patient = await Patient.create({
        displayId: "PAT-PL-002",
        fullName: "PL No Variant Patient",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550000002",
      });

      const invDisplayId = await generateDisplayId(Invoice, "INV");
      const invoice = await Invoice.create({
        displayId: invDisplayId,
        patientId: patient.id,
        invoiceDate: "2026-06-01",
        invoiceStatus: "paid",
        totalAmount: 150,
        paidAmount: 150,
      });
      await InvoiceItem.create({
        invoiceId: invoice.id,
        description: "Service only",
        quantity: 1,
        unitPrice: 150,
        total: 150,
        costAmount: 0,
        productVariantId: null,
      });

      const report = await service.getProfitLossReport("2026-01-01", "2026-12-31");
      const item = report.items.find((i) => i.description === "Service only");
      expect(item).toBeDefined();
      expect(item.costAmount).toBe(0);
      // Item without productVariantId should not contribute to cogs
      expect(item.profit).toBe(150);
    });
  });

  describe("getMovementsSummaryReport", () => {
    it("should return empty summary when no movements", async () => {
      const report = await service.getMovementsSummaryReport("2026-01-01", "2026-12-31");
      expect(report.items).toEqual([]);
    });

    it("should summarize movements by variant", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id, {
        name: "Movement Summary Variant",
        sku: "MVTSUM-001",
      });
      const supplier = await createTestSupplier();
      const batch = await createTestBatch(variant.id, {
        supplierId: supplier.id,
        quantity: 50,
        initialQuantity: 50,
      });
      await variant.update({ quantity: 50 });

      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "in",
        quantity: 50,
        reason: "purchase",
        unitCost: 10,
      });

      const report = await service.getMovementsSummaryReport(null, null);
      const item = report.items.find((i) => i.variantId === variant.id);
      expect(item).toBeDefined();
      expect(item.inQuantity).toBe(50);
    });

    it("should handle adjust type movements", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const batch = await createTestBatch(variant.id);
      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "adjust",
        quantity: 5,
        reason: "stocktaking",
        unitCost: 10,
      });

      const report = await service.getMovementsSummaryReport(null, null);
      const item = report.items.find((i) => i.variantId === variant.id);
      expect(item).toBeDefined();
      expect(item.adjustments).toBe(5);
    });

    it("should handle out type movements", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const batch = await createTestBatch(variant.id);
      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "in",
        quantity: 100,
        reason: "purchase",
        unitCost: 10,
      });
      await createTestStockMovement({
        productVariantId: variant.id,
        batchId: batch.id,
        type: "out",
        quantity: 30,
        reason: "sale",
        unitCost: 10,
      });

      const report = await service.getMovementsSummaryReport(null, null);
      const item = report.items.find((i) => i.variantId === variant.id);
      expect(item).toBeDefined();
      expect(item.outQuantity).toBe(30);
      expect(item.outValue).toBe(300);
    });
  });

  describe("getStockAgingReport", () => {
    it("should return report with summary structure", async () => {
      const report = await service.getStockAgingReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.length).toBe(4);
    });

    it("should return aging report with batches in 0-30 bucket", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const batch = await createTestBatch(variant.id, {
        quantity: 10,
        unitCost: 50,
        receivedDate: new Date().toISOString().split("T")[0],
      });

      const report = await service.getStockAgingReport();
      const item = report.items.find((i) => i.batchId === batch.id);
      expect(item).toBeDefined();
      expect(item.bucket).toBe("0-30");
    });

    it("should categorize batches in 31-60 bucket", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const date = new Date();
      date.setDate(date.getDate() - 35);
      const batch = await createTestBatch(variant.id, {
        quantity: 10,
        unitCost: 50,
        receivedDate: date.toISOString().split("T")[0],
      });

      const report = await service.getStockAgingReport();
      const item = report.items.find((i) => i.batchId === batch.id);
      expect(item).toBeDefined();
      expect(item.bucket).toBe("31-60");
    });

    it("should categorize batches in 61-90 bucket", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const date = new Date();
      date.setDate(date.getDate() - 65);
      const batch = await createTestBatch(variant.id, {
        quantity: 10,
        unitCost: 50,
        receivedDate: date.toISOString().split("T")[0],
      });

      const report = await service.getStockAgingReport();
      const item = report.items.find((i) => i.batchId === batch.id);
      expect(item).toBeDefined();
      expect(item.bucket).toBe("61-90");
    });

    it("should categorize batches in 90+ bucket", async () => {
      const product = await createTestProduct();
      const variant = await createTestProductVariant(product.id);
      const date = new Date();
      date.setDate(date.getDate() - 100);
      const batch = await createTestBatch(variant.id, {
        quantity: 10,
        unitCost: 50,
        receivedDate: date.toISOString().split("T")[0],
      });

      const report = await service.getStockAgingReport();
      const item = report.items.find((i) => i.batchId === batch.id);
      expect(item).toBeDefined();
      expect(item.bucket).toBe("90+");
    });
  });
});

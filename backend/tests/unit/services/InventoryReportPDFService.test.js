jest.mock("../../../src/utils/pdfReportGenerator", () => ({
  generateReportPDF: jest.fn().mockReturnValue({ output: jest.fn().mockReturnValue(new ArrayBuffer(10)) }),
}));

jest.mock("../../../src/services/StocktakingService", () => {
  return jest.fn().mockImplementation(() => ({
    getById: jest.fn(),
  }));
});

const InventoryReportPDFService = require("../../../src/services/reports/InventoryReportPDFService");
const { generateReportPDF } = require("../../../src/utils/pdfReportGenerator");
const StocktakingService = require("../../../src/services/StocktakingService");

describe("InventoryReportPDFService", () => {
  let service, mockReportService, mockSettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReportService = {
      getInventoryValuationReport: jest.fn(),
      getLowStockReport: jest.fn(),
      getExpiryReport: jest.fn(),
      getDeadStockReport: jest.fn(),
      getStockAgingReport: jest.fn(),
      getMovementsSummaryReport: jest.fn(),
      getProfitLossReport: jest.fn(),
    };
    mockSettingsService = {
      getClinicSettings: jest.fn().mockResolvedValue({ lang: "en", clinicName: "Test Clinic" }),
    };
    service = new InventoryReportPDFService(mockReportService, mockSettingsService);
  });

  describe("generateInventoryValuationPDF", () => {
    it("should generate PDF with valuation data", async () => {
      mockReportService.getInventoryValuationReport.mockResolvedValue({
        items: [{ productName: "Test", variantName: "V1", sku: "SKU1", quantity: 10, avgCost: 50, totalCost: 500, sellPrice: 100, potentialProfit: 500 }],
        summary: { totalVariants: 1, totalCostValue: 500, totalSellValue: 1000, potentialProfit: 500 },
      });
      const doc = await service.generateInventoryValuationPDF();
      expect(mockReportService.getInventoryValuationReport).toHaveBeenCalled();
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Inventory Valuation", rows: expect.any(Array) })
      );
      expect(doc).toBeDefined();
    });

    it("should use Arabic title when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getInventoryValuationReport.mockResolvedValue({
        items: [],
        summary: { totalVariants: 0, totalCostValue: 0, totalSellValue: 0, potentialProfit: 0 },
      });
      await service.generateInventoryValuationPDF();
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "تقييم المخزون" })
      );
    });
  });

  describe("generateLowStockPDF", () => {
    it("should generate PDF with low stock data", async () => {
      mockReportService.getLowStockReport.mockResolvedValue({
        items: [{ productName: "Test", variantName: "V1", sku: "SKU1", quantity: 2, minQuantity: 10, shortfall: 8 }],
        count: 1,
      });
      await service.generateLowStockPDF();
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Low Stock Report" })
      );
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getLowStockReport.mockResolvedValue({ items: [], count: 0 });
      await service.generateLowStockPDF();
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "تقرير النواقص" })
      );
    });
  });

  describe("generateExpiryPDF", () => {
    it("should generate PDF with expiry data", async () => {
      mockReportService.getExpiryReport.mockResolvedValue({
        expiringSoon: [{ productName: "Test", batchNumber: "B1", expiryDate: "2026-08-01" }],
        expired: [{ productName: "Old", batchNumber: "B2", expiryDate: "2025-01-01" }],
      });
      await service.generateExpiryPDF(30);
      expect(mockReportService.getExpiryReport).toHaveBeenCalledWith(30);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Expiry Report" })
      );
    });

    it("should use default 30 days", async () => {
      mockReportService.getExpiryReport.mockResolvedValue({ expiringSoon: [], expired: [] });
      await service.generateExpiryPDF();
      expect(mockReportService.getExpiryReport).toHaveBeenCalledWith(30);
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getExpiryReport.mockResolvedValue({
        expiringSoon: [{ productName: "T", batchNumber: "B1" }],
        expired: [{ productName: "O", batchNumber: "B2" }],
      });
      await service.generateExpiryPDF(60);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "تقرير الانتهاءات", subtitle: "خلال 60 يوم" })
      );
    });
  });

  describe("generateDeadStockPDF", () => {
    it("should generate PDF with dead stock data", async () => {
      mockReportService.getDeadStockReport.mockResolvedValue({
        items: [{ productName: "Old", variantName: "V1", sku: "SKU1", quantity: 5, totalCost: 250 }],
        count: 1,
        totalValue: 250,
      });
      await service.generateDeadStockPDF(3);
      expect(mockReportService.getDeadStockReport).toHaveBeenCalledWith(3);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Dead Stock Report" })
      );
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getDeadStockReport.mockResolvedValue({ items: [], count: 0, totalValue: 0 });
      await service.generateDeadStockPDF(6);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "تقرير البضاعة الراكدة", subtitle: "بدون حركة منذ 6 أشهر" })
      );
    });
  });

  describe("generateStockAgingPDF", () => {
    it("should generate PDF with stock aging data", async () => {
      mockReportService.getStockAgingReport.mockResolvedValue({
        items: [{ productName: "Test", batchNumber: "B1", quantity: 10, ageDays: 30, bucket: "0-30", totalValue: 500 }],
        summary: [{ bucket: "0-30", totalValue: 500 }],
        totalValue: 500,
      });
      await service.generateStockAgingPDF();
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Stock Aging Report" })
      );
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getStockAgingReport.mockResolvedValue({
        items: [],
        summary: [],
        totalValue: 0,
      });
      await service.generateStockAgingPDF();
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "تقرير تقادم المخزون" })
      );
    });
  });

  describe("generateMovementsSummaryPDF", () => {
    it("should generate PDF with movements summary data", async () => {
      mockReportService.getMovementsSummaryReport.mockResolvedValue({
        items: [{ productName: "Test", inQuantity: 50, outQuantity: 20, netQuantity: 30 }],
        totalInValue: 2500,
        totalOutValue: 1000,
        count: 1,
      });
      await service.generateMovementsSummaryPDF("2026-01-01", "2026-12-31");
      expect(mockReportService.getMovementsSummaryReport).toHaveBeenCalledWith("2026-01-01", "2026-12-31");
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Movements Summary" })
      );
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getMovementsSummaryReport.mockResolvedValue({
        items: [], totalInValue: 0, totalOutValue: 0, count: 0,
      });
      await service.generateMovementsSummaryPDF("2026-01-01", "2026-12-31");
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "ملخص الحركات" })
      );
    });

    it("should handle null dates with dash fallback", async () => {
      mockReportService.getMovementsSummaryReport.mockResolvedValue({
        items: [], totalInValue: 0, totalOutValue: 0, count: 0,
      });
      await service.generateMovementsSummaryPDF(null, null);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ subtitle: "From - to -" })
      );
    });
  });

  describe("generateProfitLossPDF", () => {
    it("should generate PDF with profit/loss data", async () => {
      mockReportService.getProfitLossReport.mockResolvedValue({
        items: [{ invoiceDisplayId: "INV-001", description: "Consultation", quantity: 1, unitPrice: 100, lineTotal: 100, costAmount: 40, profit: 60 }],
        revenue: 100,
        cogs: 40,
        grossProfit: 60,
        grossMargin: 60,
      });
      await service.generateProfitLossPDF("2026-01-01", "2026-12-31");
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Profit & Loss" })
      );
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      mockReportService.getProfitLossReport.mockResolvedValue({
        items: [], revenue: 0, cogs: 0, grossProfit: 0, grossMargin: 0,
      });
      await service.generateProfitLossPDF("2026-01-01", "2026-12-31");
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "الأرباح والخسائر" })
      );
    });

    it("should handle null dates with dash fallback", async () => {
      mockReportService.getProfitLossReport.mockResolvedValue({
        items: [], revenue: 0, cogs: 0, grossProfit: 0, grossMargin: 0,
      });
      await service.generateProfitLossPDF(null, null);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ subtitle: "From - to -" })
      );
    });
  });

  describe("generateStocktakingPDF", () => {
    it("should generate PDF with stocktaking data", async () => {
      const mockStocktakingService = {
        getById: jest.fn().mockResolvedValue({
          displayId: "ST-001",
          status: "completed",
          items: [{ productName: "Test", variantName: "V1", batchNumber: "B1", systemQuantity: 10, countedQuantity: 8, difference: -2 }],
        }),
      };
      StocktakingService.mockImplementation(() => mockStocktakingService);

      await service.generateStocktakingPDF(1);
      expect(mockStocktakingService.getById).toHaveBeenCalledWith(1);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Stocktaking Result" })
      );
    });

    it("should handle stocktaking with no items", async () => {
      const mockStocktakingService = {
        getById: jest.fn().mockResolvedValue({
          displayId: "ST-002",
          status: "draft",
          items: null,
        }),
      };
      StocktakingService.mockImplementation(() => mockStocktakingService);

      await service.generateStocktakingPDF(2);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ rows: [] })
      );
    });

    it("should use Arabic labels when lang is ar", async () => {
      mockSettingsService.getClinicSettings.mockResolvedValue({ lang: "ar", clinicName: "عيادة" });
      const mockStocktakingService = {
        getById: jest.fn().mockResolvedValue({
          displayId: "ST-003",
          status: "completed",
          items: [{ productName: "T", variantName: "V", batchNumber: "B", systemQuantity: 5, countedQuantity: 5, difference: 0 }],
        }),
      };
      StocktakingService.mockImplementation(() => mockStocktakingService);

      await service.generateStocktakingPDF(3);
      expect(generateReportPDF).toHaveBeenCalledWith(
        expect.objectContaining({ title: "نتيجة الجرد" })
      );
    });
  });
});

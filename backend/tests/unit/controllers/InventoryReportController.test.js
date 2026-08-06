const InventoryReportController = require("../../../src/controllers/reports/InventoryReportController");

describe("InventoryReportController", () => {
  let controller, req, res, next;
  let mockReportService, mockSettingsService;

  beforeEach(() => {
    mockReportService = {
      exportInventory: jest.fn(),
      exportStockMovements: jest.fn(),
      getInventoryValuationReport: jest.fn(),
      getProfitLossReport: jest.fn(),
      getLowStockReport: jest.fn(),
      getExpiryReport: jest.fn(),
      getDeadStockReport: jest.fn(),
      getMovementsSummaryReport: jest.fn(),
      getStockAgingReport: jest.fn(),
    };
    mockSettingsService = {};
    controller = new InventoryReportController(mockReportService, mockSettingsService);
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("exportInventory", () => {
    it("should export inventory as CSV", async () => {
      mockReportService.exportInventory.mockResolvedValue({
        headers: ["DisplayID", "Product"],
        rows: [["P-001", "Test Product"]],
      });
      await controller.exportInventory(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      mockReportService.exportInventory.mockRejectedValue(new Error("DB error"));
      await controller.exportInventory(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("exportStockMovements", () => {
    it("should export stock movements as CSV", async () => {
      mockReportService.exportStockMovements.mockResolvedValue({
        headers: ["Date", "Type"],
        rows: [["2026-01-01", "in"]],
      });
      await controller.exportStockMovements(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      mockReportService.exportStockMovements.mockRejectedValue(new Error("DB error"));
      await controller.exportStockMovements(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getInventoryValuation", () => {
    it("should return valuation report", async () => {
      mockReportService.getInventoryValuationReport.mockResolvedValue({
        items: [], summary: { totalVariants: 0, totalCostValue: 0, totalSellValue: 0, potentialProfit: 0 },
      });
      await controller.getInventoryValuation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Object) })
      );
    });

    it("should call next on error", async () => {
      mockReportService.getInventoryValuationReport.mockRejectedValue(new Error("DB error"));
      await controller.getInventoryValuation(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getProfitLoss", () => {
    it("should return profit/loss report", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      mockReportService.getProfitLossReport.mockResolvedValue({
        revenue: 1000, cogs: 600, grossProfit: 400, grossMargin: 40, items: [],
      });
      await controller.getProfitLoss(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      mockReportService.getProfitLossReport.mockRejectedValue(new Error("DB error"));
      await controller.getProfitLoss(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getLowStock", () => {
    it("should return low stock report", async () => {
      mockReportService.getLowStockReport.mockResolvedValue({ items: [], count: 0 });
      await controller.getLowStock(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      mockReportService.getLowStockReport.mockRejectedValue(new Error("DB error"));
      await controller.getLowStock(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getExpiryReport", () => {
    it("should return expiry report with default days", async () => {
      mockReportService.getExpiryReport.mockResolvedValue({ expiringSoon: [], expired: [] });
      await controller.getExpiryReport(req, res, next);
      expect(mockReportService.getExpiryReport).toHaveBeenCalledWith(30);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return expiry report with custom days", async () => {
      req.query = { days: "60" };
      mockReportService.getExpiryReport.mockResolvedValue({ expiringSoon: [], expired: [] });
      await controller.getExpiryReport(req, res, next);
      expect(mockReportService.getExpiryReport).toHaveBeenCalledWith(60);
    });

    it("should call next on error", async () => {
      mockReportService.getExpiryReport.mockRejectedValue(new Error("DB error"));
      await controller.getExpiryReport(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getDeadStock", () => {
    it("should return dead stock report with default months", async () => {
      mockReportService.getDeadStockReport.mockResolvedValue({ items: [], count: 0, totalValue: 0 });
      await controller.getDeadStock(req, res, next);
      expect(mockReportService.getDeadStockReport).toHaveBeenCalledWith(3);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return dead stock report with custom months", async () => {
      req.query = { months: "6" };
      mockReportService.getDeadStockReport.mockResolvedValue({ items: [], count: 0, totalValue: 0 });
      await controller.getDeadStock(req, res, next);
      expect(mockReportService.getDeadStockReport).toHaveBeenCalledWith(6);
    });
  });

  describe("getMovementsSummary", () => {
    it("should return movements summary report", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      mockReportService.getMovementsSummaryReport.mockResolvedValue({ items: [] });
      await controller.getMovementsSummary(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      mockReportService.getMovementsSummaryReport.mockRejectedValue(new Error("DB error"));
      await controller.getMovementsSummary(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getStockAging", () => {
    it("should return stock aging report", async () => {
      mockReportService.getStockAgingReport.mockResolvedValue({ items: [] });
      await controller.getStockAging(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      mockReportService.getStockAgingReport.mockRejectedValue(new Error("DB error"));
      await controller.getStockAging(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("PDF reports", () => {
    beforeEach(() => {
      controller.pdfService = {
        generateInventoryValuationPDF: jest.fn(),
        generateLowStockPDF: jest.fn(),
        generateExpiryPDF: jest.fn(),
        generateDeadStockPDF: jest.fn(),
        generateStockAgingPDF: jest.fn(),
        generateMovementsSummaryPDF: jest.fn(),
        generateProfitLossPDF: jest.fn(),
        generateStocktakingPDF: jest.fn(),
      };
    });

    it("should download inventory valuation PDF", async () => {
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateInventoryValuationPDF.mockResolvedValue(mockDoc);
      await controller.downloadInventoryValuationPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.send).toHaveBeenCalled();
    });

    it("should download low stock PDF", async () => {
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateLowStockPDF.mockResolvedValue(mockDoc);
      await controller.downloadLowStockPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    });

    it("should download expiry PDF with custom days", async () => {
      req.query = { days: "60" };
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateExpiryPDF.mockResolvedValue(mockDoc);
      await controller.downloadExpiryPDF(req, res, next);
      expect(controller.pdfService.generateExpiryPDF).toHaveBeenCalledWith(60);
    });

    it("should download dead stock PDF with custom months", async () => {
      req.query = { months: "6" };
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateDeadStockPDF.mockResolvedValue(mockDoc);
      await controller.downloadDeadStockPDF(req, res, next);
      expect(controller.pdfService.generateDeadStockPDF).toHaveBeenCalledWith(6);
    });

    it("should download stocktaking PDF with valid id", async () => {
      req.params.id = "1";
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateStocktakingPDF.mockResolvedValue(mockDoc);
      await controller.downloadStocktakingPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=stocktaking-1.pdf");
    });

    it("should call next for invalid stocktaking id", async () => {
      req.params.id = "invalid";
      await controller.downloadStocktakingPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on PDF generation error", async () => {
      controller.pdfService.generateInventoryValuationPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadInventoryValuationPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should download stock aging PDF", async () => {
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateStockAgingPDF.mockResolvedValue(mockDoc);
      await controller.downloadStockAgingPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    });

    it("should call next on stock aging PDF error", async () => {
      controller.pdfService.generateStockAgingPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadStockAgingPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should download movements summary PDF", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateMovementsSummaryPDF.mockResolvedValue(mockDoc);
      await controller.downloadMovementsSummaryPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    });

    it("should call next on movements summary PDF error", async () => {
      controller.pdfService.generateMovementsSummaryPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadMovementsSummaryPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should download profit/loss PDF", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(10)) };
      controller.pdfService.generateProfitLossPDF.mockResolvedValue(mockDoc);
      await controller.downloadProfitLossPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    });

    it("should call next on profit/loss PDF error", async () => {
      controller.pdfService.generateProfitLossPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadProfitLossPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on low stock PDF error", async () => {
      controller.pdfService.generateLowStockPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadLowStockPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on expiry PDF error", async () => {
      controller.pdfService.generateExpiryPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadExpiryPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on dead stock PDF error", async () => {
      controller.pdfService.generateDeadStockPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadDeadStockPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on stocktaking PDF error", async () => {
      req.params.id = "1";
      controller.pdfService.generateStocktakingPDF.mockRejectedValue(new Error("PDF error"));
      await controller.downloadStocktakingPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getDeadStock error", () => {
    it("should call next on error", async () => {
      mockReportService.getDeadStockReport.mockRejectedValue(new Error("DB error"));
      await controller.getDeadStock(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

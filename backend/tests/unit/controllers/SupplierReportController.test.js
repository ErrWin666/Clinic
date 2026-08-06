const SupplierReportController = require("../../../src/controllers/reports/SupplierReportController");

describe("SupplierReportController", () => {
  let controller, req, res, next;
  let mockReportService;

  beforeEach(() => {
    mockReportService = {
      exportSuppliers: jest.fn(),
      exportPurchaseOrders: jest.fn(),
      exportSupplierStatement: jest.fn(),
    };
    controller = new SupplierReportController(mockReportService);
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("exportSuppliers", () => {
    it("should export suppliers as CSV", async () => {
      req.query = { search: "Test" };
      mockReportService.exportSuppliers.mockResolvedValue({
        headers: ["ID", "Name", "Balance"],
        rows: [[1, "Test Supplier", "500"]],
      });
      await controller.exportSuppliers(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(res.send).toHaveBeenCalled();
      const sent = res.send.mock.calls[0][0];
      expect(sent).toContain("Test Supplier");
    });

    it("should call next on error", async () => {
      mockReportService.exportSuppliers.mockRejectedValue(new Error("DB error"));
      await controller.exportSuppliers(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("exportPurchaseOrders", () => {
    it("should export purchase orders as CSV", async () => {
      req.query = { status: "received" };
      mockReportService.exportPurchaseOrders.mockResolvedValue({
        headers: ["DisplayID", "Supplier", "Status"],
        rows: [["PO-001", "Test Supplier", "received"]],
      });
      await controller.exportPurchaseOrders(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=purchase-orders-report.csv");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      mockReportService.exportPurchaseOrders.mockRejectedValue(new Error("DB error"));
      await controller.exportPurchaseOrders(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("exportSupplierStatement", () => {
    it("should export supplier statement as CSV", async () => {
      req.params.supplierId = "1";
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      mockReportService.exportSupplierStatement.mockResolvedValue({
        headers: ["Date", "Description", "Debit", "Credit", "Balance"],
        rows: [["2026-01-01", "Opening Balance", "0", "0", "500"]],
      });
      await controller.exportSupplierStatement(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=supplier-statement-1.csv");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next for invalid supplier id", async () => {
      req.params.supplierId = "invalid";
      await controller.exportSupplierStatement(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.supplierId = "1";
      mockReportService.exportSupplierStatement.mockRejectedValue(new Error("DB error"));
      await controller.exportSupplierStatement(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

const BaseController = require("../BaseController");
const ReportService = require("../../services/reports");
const { buildCSV, sendCSV } = require("../../utils/csvExport");

class SupplierReportController extends BaseController {
  constructor(reportService) {
    super();
    this.reportService = reportService || new ReportService();
  }

  async exportSuppliers(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportSuppliers(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "suppliers-report.csv");
    } catch (error) {
      next(error);
    }
  }

  async exportPurchaseOrders(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportPurchaseOrders(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "purchase-orders-report.csv");
    } catch (error) {
      next(error);
    }
  }

  async exportSupplierStatement(req, res, next) {
    try {
      const supplierId = this.validateId(req.params.supplierId);
      const { headers, rows } = await this.reportService.exportSupplierStatement(supplierId, req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, `supplier-statement-${supplierId}.csv`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SupplierReportController;

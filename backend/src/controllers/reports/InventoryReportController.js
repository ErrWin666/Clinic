const BaseController = require("../BaseController");
const ReportService = require("../../services/reports");
const SettingsService = require("../../services/SettingsService");
const InventoryReportPDFService = require("../../services/reports/InventoryReportPDFService");
const { buildCSV, sendCSV } = require("../../utils/csvExport");
const MESSAGES = require("../../constants/messages");

class InventoryReportController extends BaseController {
  constructor(reportService, settingsService) {
    super();
    this.reportService = reportService || new ReportService();
    this.settingsService = settingsService || new SettingsService();
    this.pdfService = new InventoryReportPDFService(this.reportService, this.settingsService);
  }

  _sendPDF(res, doc, filename) {
    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    return res.send(Buffer.from(pdfBuffer));
  }

  async exportInventory(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportInventory(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "inventory-report.csv");
    } catch (error) {
      next(error);
    }
  }

  async exportStockMovements(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportStockMovements(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "stock-movements-report.csv");
    } catch (error) {
      next(error);
    }
  }

  // === Inventory JSON reports ===

  async getInventoryValuation(req, res, next) {
    try {
      const report = await this.reportService.getInventoryValuationReport();
      return this.sendSuccess(res, report, MESSAGES.REPORT.INVENTORY_VALUATION_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getProfitLoss(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.reportService.getProfitLossReport(startDate, endDate);
      return this.sendSuccess(res, report, MESSAGES.REPORT.PROFIT_LOSS_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const report = await this.reportService.getLowStockReport();
      return this.sendSuccess(res, report, MESSAGES.REPORT.LOW_STOCK_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getExpiryReport(req, res, next) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const report = await this.reportService.getExpiryReport(days);
      return this.sendSuccess(res, report, MESSAGES.REPORT.EXPIRY_REPORT_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getDeadStock(req, res, next) {
    try {
      const months = req.query.months ? Number(req.query.months) : 3;
      const report = await this.reportService.getDeadStockReport(months);
      return this.sendSuccess(res, report, MESSAGES.REPORT.DEAD_STOCK_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getMovementsSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.reportService.getMovementsSummaryReport(startDate, endDate);
      return this.sendSuccess(res, report, MESSAGES.REPORT.STOCK_MOVEMENTS_EXPORTED);
    } catch (error) {
      next(error);
    }
  }

  async getStockAging(req, res, next) {
    try {
      const report = await this.reportService.getStockAgingReport();
      return this.sendSuccess(res, report, MESSAGES.REPORT.INVENTORY_VALUATION_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  // === PDF Reports ===

  async downloadInventoryValuationPDF(req, res, next) {
    try {
      const doc = await this.pdfService.generateInventoryValuationPDF();
      return this._sendPDF(res, doc, "inventory-valuation.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadLowStockPDF(req, res, next) {
    try {
      const doc = await this.pdfService.generateLowStockPDF();
      return this._sendPDF(res, doc, "low-stock.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadExpiryPDF(req, res, next) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const doc = await this.pdfService.generateExpiryPDF(days);
      return this._sendPDF(res, doc, "expiry-report.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadDeadStockPDF(req, res, next) {
    try {
      const months = req.query.months ? Number(req.query.months) : 3;
      const doc = await this.pdfService.generateDeadStockPDF(months);
      return this._sendPDF(res, doc, "dead-stock.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadStockAgingPDF(req, res, next) {
    try {
      const doc = await this.pdfService.generateStockAgingPDF();
      return this._sendPDF(res, doc, "stock-aging.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadMovementsSummaryPDF(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const doc = await this.pdfService.generateMovementsSummaryPDF(startDate, endDate);
      return this._sendPDF(res, doc, "movements-summary.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadProfitLossPDF(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const doc = await this.pdfService.generateProfitLossPDF(startDate, endDate);
      return this._sendPDF(res, doc, "profit-loss.pdf");
    } catch (error) {
      next(error);
    }
  }

  async downloadStocktakingPDF(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const doc = await this.pdfService.generateStocktakingPDF(id);
      return this._sendPDF(res, doc, `stocktaking-${id}.pdf`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventoryReportController;

const BaseController = require("../BaseController");
const ReportService = require("../../services/reports");
const { buildCSV, sendCSV } = require("../../utils/csvExport");

class PatientReportController extends BaseController {
  constructor(reportService) {
    super();
    this.reportService = reportService || new ReportService();
  }

  async exportPatients(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportPatients(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "patients-report.csv");
    } catch (error) {
      next(error);
    }
  }

  async exportInvoices(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportInvoices(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "invoices-report.csv");
    } catch (error) {
      next(error);
    }
  }

  async exportAppointments(req, res, next) {
    try {
      const { headers, rows } = await this.reportService.exportAppointments(req.query);
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "appointments-report.csv");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientReportController;

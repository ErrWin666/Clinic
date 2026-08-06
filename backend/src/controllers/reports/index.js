const ReportService = require("../../services/reports");
const SettingsService = require("../../services/SettingsService");
const { buildCSV } = require("../../utils/csvExport");
const PatientReportController = require("./PatientReportController");
const InventoryReportController = require("./InventoryReportController");
const SupplierReportController = require("./SupplierReportController");

const patientMethods = Object.getOwnPropertyNames(PatientReportController.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const inventoryMethods = Object.getOwnPropertyNames(InventoryReportController.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const supplierMethods = Object.getOwnPropertyNames(SupplierReportController.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));

// Compose a single controller that delegates to all three sub-controllers
class ReportController {
  constructor() {
    const reportService = new ReportService();
    const settingsService = new SettingsService();
    this.reportService = reportService;
    this.buildCSV = buildCSV;
    this._patientReport = new PatientReportController(reportService);
    this._inventoryReport = new InventoryReportController(reportService, settingsService);
    this._supplierReport = new SupplierReportController(reportService);
  }
}

// Assign _sendPDF from InventoryReportController
ReportController.prototype._sendPDF = InventoryReportController.prototype._sendPDF;

// Assign all methods to the composed class, delegating to the correct sub-controller
for (const m of patientMethods) {
  ReportController.prototype[m] = function (...args) {
    return this._patientReport[m](...args);
  };
}
for (const m of inventoryMethods) {
  ReportController.prototype[m] = function (...args) {
    return this._inventoryReport[m](...args);
  };
}
for (const m of supplierMethods) {
  ReportController.prototype[m] = function (...args) {
    return this._supplierReport[m](...args);
  };
}

module.exports = ReportController;

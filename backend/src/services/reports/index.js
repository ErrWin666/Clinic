const PatientReportService = require("./PatientReportService");
const InventoryExportService = require("./InventoryExportService");
const InventoryAnalysisService = require("./InventoryAnalysisService");
const SupplierReportService = require("./SupplierReportService");

const patientMethods = Object.getOwnPropertyNames(PatientReportService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const inventoryExportMethods = Object.getOwnPropertyNames(InventoryExportService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const inventoryAnalysisMethods = Object.getOwnPropertyNames(InventoryAnalysisService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));
const supplierMethods = Object.getOwnPropertyNames(SupplierReportService.prototype)
  .filter((m) => m !== "constructor" && !m.startsWith("_"));

// Compose a single class that delegates to all sub-services
class ReportService {
  constructor() {
    this._patientReport = new PatientReportService();
    this._inventoryExport = new InventoryExportService();
    this._inventoryAnalysis = new InventoryAnalysisService();
    this._supplierReport = new SupplierReportService();
  }
}

// Assign all methods to the composed class, delegating to the correct sub-service
for (const m of patientMethods) {
  ReportService.prototype[m] = function (...args) {
    return this._patientReport[m](...args);
  };
}
for (const m of inventoryExportMethods) {
  ReportService.prototype[m] = function (...args) {
    return this._inventoryExport[m](...args);
  };
}
for (const m of inventoryAnalysisMethods) {
  ReportService.prototype[m] = function (...args) {
    return this._inventoryAnalysis[m](...args);
  };
}
for (const m of supplierMethods) {
  ReportService.prototype[m] = function (...args) {
    return this._supplierReport[m](...args);
  };
}

module.exports = ReportService;

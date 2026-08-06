const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/reports");
const auth = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { requirePermission } = require("../middlewares/rbac");
const { reportQuerySchema, emptyQuerySchema, idParamSchema } = require("../schemas/commonSchema");
const Joi = require("joi");

const reportController = new ReportController();

router.use(auth);

// === Existing CSV exports ===
router.get("/patients", requirePermission("reports:read"), validate(reportQuerySchema), (req, res, next) => reportController.exportPatients(req, res, next));
router.get("/invoices", requirePermission("reports:read"), validate(reportQuerySchema), (req, res, next) => reportController.exportInvoices(req, res, next));
router.get("/appointments", requirePermission("reports:read"), validate(reportQuerySchema), (req, res, next) => reportController.exportAppointments(req, res, next));

// === Inventory CSV exports ===
router.get("/inventory", requirePermission("reports:read"), validate(emptyQuerySchema), (req, res, next) => reportController.exportInventory(req, res, next));

const stockMovementReportSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    type: Joi.string().valid("in", "out", "adjust"),
    reason: Joi.string().valid("purchase", "sale", "return", "damage", "expiry", "adjustment", "dispensing", "opening_stock", "recall"),
    productVariantId: Joi.number().integer().positive(),
  }),
  params: Joi.object({}),
});
router.get("/stock-movements", requirePermission("reports:read"), validate(stockMovementReportSchema), (req, res, next) => reportController.exportStockMovements(req, res, next));

const supplierReportSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    search: Joi.string().allow(""),
  }),
  params: Joi.object({}),
});
router.get("/suppliers", requirePermission("reports:read"), validate(supplierReportSchema), (req, res, next) => reportController.exportSuppliers(req, res, next));

const poReportSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    supplierId: Joi.number().integer().positive(),
    status: Joi.string().valid("draft", "ordered", "received", "cancelled"),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({}),
});
router.get("/purchase-orders", requirePermission("reports:read"), validate(poReportSchema), (req, res, next) => reportController.exportPurchaseOrders(req, res, next));

const supplierStatementReportSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({ supplierId: Joi.number().integer().positive().required() }),
});
router.get("/supplier-statement/:supplierId", requirePermission("reports:read"), validate(supplierStatementReportSchema), (req, res, next) => reportController.exportSupplierStatement(req, res, next));

// === Inventory JSON reports ===
router.get("/inventory-valuation", requirePermission("reports:read"), validate(emptyQuerySchema), (req, res, next) => reportController.getInventoryValuation(req, res, next));

const profitLossReportSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
  params: Joi.object({}),
});
router.get("/profit-loss", requirePermission("reports:read"), validate(profitLossReportSchema), (req, res, next) => reportController.getProfitLoss(req, res, next));

router.get("/low-stock", requirePermission("reports:read"), validate(emptyQuerySchema), (req, res, next) => reportController.getLowStock(req, res, next));

const expiryReportSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(30),
  }),
  params: Joi.object({}),
});
router.get("/expiry", requirePermission("reports:read"), validate(expiryReportSchema), (req, res, next) => reportController.getExpiryReport(req, res, next));

const deadStockSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    months: Joi.number().integer().min(1).max(24).default(3),
  }),
  params: Joi.object({}),
});
router.get("/dead-stock", requirePermission("reports:read"), validate(deadStockSchema), (req, res, next) => reportController.getDeadStock(req, res, next));

const movementsSummarySchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({}),
});
router.get("/movements-summary", requirePermission("reports:read"), validate(movementsSummarySchema), (req, res, next) => reportController.getMovementsSummary(req, res, next));

router.get("/stock-aging", requirePermission("reports:read"), validate(emptyQuerySchema), (req, res, next) => reportController.getStockAging(req, res, next));

// === PDF Reports ===
// PDF language is determined by the clinic.language setting — no lang query param
const pdfEmptySchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({}),
});

const pdfDateRangeSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({}),
});

const pdfProfitLossSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
  params: Joi.object({}),
});

const pdfExpirySchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    days: Joi.number().integer().min(1).max(365).default(30),
  }),
  params: Joi.object({}),
});

const pdfDeadStockSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    months: Joi.number().integer().min(1).max(24).default(3),
  }),
  params: Joi.object({}),
});

const pdfStocktakingSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

router.get("/inventory-valuation/pdf", requirePermission("reports:read"), validate(pdfEmptySchema), (req, res, next) => reportController.downloadInventoryValuationPDF(req, res, next));
router.get("/low-stock/pdf", requirePermission("reports:read"), validate(pdfEmptySchema), (req, res, next) => reportController.downloadLowStockPDF(req, res, next));
router.get("/expiry/pdf", requirePermission("reports:read"), validate(pdfExpirySchema), (req, res, next) => reportController.downloadExpiryPDF(req, res, next));
router.get("/dead-stock/pdf", requirePermission("reports:read"), validate(pdfDeadStockSchema), (req, res, next) => reportController.downloadDeadStockPDF(req, res, next));
router.get("/stock-aging/pdf", requirePermission("reports:read"), validate(pdfEmptySchema), (req, res, next) => reportController.downloadStockAgingPDF(req, res, next));
router.get("/movements-summary/pdf", requirePermission("reports:read"), validate(pdfDateRangeSchema), (req, res, next) => reportController.downloadMovementsSummaryPDF(req, res, next));
router.get("/profit-loss/pdf", requirePermission("reports:read"), validate(pdfProfitLossSchema), (req, res, next) => reportController.downloadProfitLossPDF(req, res, next));
router.get("/stocktaking/:id/pdf", requirePermission("reports:read"), validate(pdfStocktakingSchema), (req, res, next) => reportController.downloadStocktakingPDF(req, res, next));

module.exports = router;

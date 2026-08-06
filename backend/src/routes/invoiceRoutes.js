const express = require("express");
const router = express.Router();
const InvoiceController = require("../controllers/InvoiceController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceStatusSchema,
  listInvoiceSchema,
} = require("../schemas/invoiceSchema");
const { idParamSchema, exportInvoiceSchema } = require("../schemas/commonSchema");

const invoiceController = new InvoiceController();

router.use(auth);

router.get("/", requirePermission("invoices:read"), validate(listInvoiceSchema), (req, res, next) => invoiceController.list(req, res, next));
router.get("/export", requirePermission("invoices:read"), validate(exportInvoiceSchema), (req, res, next) => invoiceController.export(req, res, next));
router.get("/stats", requirePermission("invoices:read"), validate(exportInvoiceSchema), (req, res, next) => invoiceController.getStats(req, res, next));
router.get("/:id", requirePermission("invoices:read"), validate(idParamSchema), (req, res, next) => invoiceController.getById(req, res, next));
router.post("/", requirePermission("invoices:write"), validate(createInvoiceSchema), audit("CREATE"), (req, res, next) => invoiceController.create(req, res, next));
router.put("/:id", requirePermission("invoices:write"), validate(updateInvoiceSchema), audit("UPDATE"), (req, res, next) => invoiceController.update(req, res, next));
router.patch("/:id/status", requirePermission("invoices:write"), validate(invoiceStatusSchema), audit("UPDATE"), (req, res, next) => invoiceController.changeStatus(req, res, next));
router.delete("/:id", requirePermission("invoices:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => invoiceController.delete(req, res, next));
router.get("/:id/pdf", requirePermission("invoices:read"), validate(idParamSchema), (req, res, next) => invoiceController.getPDF(req, res, next));

module.exports = router;

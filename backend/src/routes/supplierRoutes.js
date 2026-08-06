const express = require("express");
const router = express.Router();
const SupplierController = require("../controllers/SupplierController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createSupplierSchema,
  updateSupplierSchema,
  listSupplierSchema,
  supplierStatementSchema,
  createPaymentSchema,
  listPaymentSchema,
} = require("../schemas/supplierSchema");
const { idParamSchema } = require("../schemas/commonSchema");

const supplierController = new SupplierController();

router.use(auth);

// === Suppliers ===
router.get("/", requirePermission("inventory:read"), validate(listSupplierSchema), (req, res, next) => supplierController.list(req, res, next));
router.get("/:id", requirePermission("inventory:read"), validate(idParamSchema), (req, res, next) => supplierController.getById(req, res, next));
router.get("/:id/statement", requirePermission("inventory:read"), validate(supplierStatementSchema), (req, res, next) => supplierController.getStatement(req, res, next));
router.post("/", requirePermission("inventory:write"), validate(createSupplierSchema), audit("CREATE"), (req, res, next) => supplierController.create(req, res, next));
router.put("/:id", requirePermission("inventory:write"), validate(updateSupplierSchema), audit("UPDATE"), (req, res, next) => supplierController.update(req, res, next));
router.delete("/:id", requirePermission("inventory:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => supplierController.delete(req, res, next));

// === Payments (nested under supplier) ===
router.get("/:supplierId/payments", requirePermission("inventory:read"), validate(listPaymentSchema), (req, res, next) => supplierController.listPayments(req, res, next));
router.post("/:supplierId/payments", requirePermission("inventory:finance"), validate(createPaymentSchema), audit("CREATE"), (req, res, next) => supplierController.createPayment(req, res, next));

module.exports = router;

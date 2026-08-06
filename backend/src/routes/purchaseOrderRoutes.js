const express = require("express");
const router = express.Router();
const PurchaseOrderController = require("../controllers/PurchaseOrderController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrderSchema,
  receivePurchaseOrderSchema,
} = require("../schemas/purchaseOrderSchema");
const { idParamSchema } = require("../schemas/commonSchema");

const purchaseOrderController = new PurchaseOrderController();

router.use(auth);

router.get("/", requirePermission("inventory:read"), validate(listPurchaseOrderSchema), (req, res, next) => purchaseOrderController.list(req, res, next));
router.get("/:id", requirePermission("inventory:read"), validate(idParamSchema), (req, res, next) => purchaseOrderController.getById(req, res, next));
router.post("/", requirePermission("inventory:purchase"), validate(createPurchaseOrderSchema), audit("CREATE"), (req, res, next) => purchaseOrderController.create(req, res, next));
router.put("/:id", requirePermission("inventory:purchase"), validate(updatePurchaseOrderSchema), audit("UPDATE"), (req, res, next) => purchaseOrderController.update(req, res, next));
router.post("/:id/receive", requirePermission("inventory:purchase"), validate(receivePurchaseOrderSchema), audit("UPDATE"), (req, res, next) => purchaseOrderController.receive(req, res, next));
router.post("/:id/cancel", requirePermission("inventory:purchase"), validate(idParamSchema), audit("UPDATE"), (req, res, next) => purchaseOrderController.cancel(req, res, next));

module.exports = router;

const express = require("express");
const router = express.Router();
const ProductBundleController = require("../controllers/ProductBundleController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createBundleSchema,
  updateBundleSchema,
  listBundleSchema,
  expandBundleSchema,
} = require("../schemas/productBundleSchema");
const { idParamSchema } = require("../schemas/commonSchema");

const controller = new ProductBundleController();

router.use(auth);

router.get("/", requirePermission("inventory:read"), validate(listBundleSchema), (req, res, next) => controller.list(req, res, next));
router.get("/:id", requirePermission("inventory:read"), validate(idParamSchema), (req, res, next) => controller.getById(req, res, next));
router.post("/", requirePermission("inventory:write"), validate(createBundleSchema), audit("CREATE"), (req, res, next) => controller.create(req, res, next));
router.put("/:id", requirePermission("inventory:write"), validate(updateBundleSchema), audit("UPDATE"), (req, res, next) => controller.update(req, res, next));
router.delete("/:id", requirePermission("inventory:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => controller.delete(req, res, next));
router.post("/:id/expand", requirePermission("inventory:read"), validate(expandBundleSchema), (req, res, next) => controller.expand(req, res, next));

module.exports = router;

const express = require("express");
const router = express.Router();
const PackagingUnitController = require("../controllers/PackagingUnitController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  variantIdParamSchema,
  createPackagingUnitSchema,
  updatePackagingUnitSchema,
  packagingUnitIdParamSchema,
} = require("../schemas/packagingUnitSchema");

const packagingController = new PackagingUnitController();

router.use(auth);

// Packaging units are nested under variants (variantId in URL)
router.get(
  "/variant/:variantId",
  requirePermission("inventory:read"),
  validate(variantIdParamSchema),
  (req, res, next) => packagingController.listByVariant(req, res, next)
);
router.post(
  "/variant/:variantId",
  requirePermission("inventory:write"),
  validate(createPackagingUnitSchema),
  audit("CREATE"),
  (req, res, next) => packagingController.create(req, res, next)
);
router.put(
  "/:id",
  requirePermission("inventory:write"),
  validate(updatePackagingUnitSchema),
  audit("UPDATE"),
  (req, res, next) => packagingController.update(req, res, next)
);
router.delete(
  "/:id",
  requirePermission("inventory:write"),
  validate(packagingUnitIdParamSchema),
  audit("DELETE"),
  (req, res, next) => packagingController.delete(req, res, next)
);

module.exports = router;

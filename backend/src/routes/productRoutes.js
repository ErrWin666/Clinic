const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/ProductController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createProductSchema,
  updateProductSchema,
  listProductSchema,
  productIdParamSchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdParamSchema,
  listVariantSchema,
} = require("../schemas/productSchema");
const { idParamSchema } = require("../schemas/commonSchema");
const { barcodeParamSchema } = require("../schemas/stockSchema");

const productController = new ProductController();

router.use(auth);

// === Products ===
router.get("/", requirePermission("inventory:read"), validate(listProductSchema), (req, res, next) => productController.list(req, res, next));
router.get("/:id", requirePermission("inventory:read"), validate(idParamSchema), (req, res, next) => productController.getById(req, res, next));
router.post("/", requirePermission("inventory:write"), validate(createProductSchema), audit("CREATE"), (req, res, next) => productController.create(req, res, next));
router.put("/:id", requirePermission("inventory:write"), validate(updateProductSchema), audit("UPDATE"), (req, res, next) => productController.update(req, res, next));
router.delete("/:id", requirePermission("inventory:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => productController.delete(req, res, next));

// === Variants (nested under product) ===
router.get("/:productId/variants", requirePermission("inventory:read"), validate(listVariantSchema), (req, res, next) => productController.listVariants(req, res, next));
router.get("/:productId/variants/:variantId", requirePermission("inventory:read"), validate(variantIdParamSchema), (req, res, next) => productController.getVariantById(req, res, next));
router.post("/:productId/variants", requirePermission("inventory:write"), validate(createVariantSchema), audit("CREATE"), (req, res, next) => productController.createVariant(req, res, next));
router.put("/:productId/variants/:variantId", requirePermission("inventory:write"), validate(updateVariantSchema), audit("UPDATE"), (req, res, next) => productController.updateVariant(req, res, next));
router.delete("/:productId/variants/:variantId", requirePermission("inventory:write"), validate(variantIdParamSchema), audit("DELETE"), (req, res, next) => productController.deleteVariant(req, res, next));

// === Barcode lookup (top-level convenience) ===
router.get("/barcode/:barcode", requirePermission("inventory:read"), validate(barcodeParamSchema), (req, res, next) => productController.getByBarcode(req, res, next));

module.exports = router;

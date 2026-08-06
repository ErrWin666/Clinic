const express = require("express");
const router = express.Router();
const StockController = require("../controllers/StockController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  listMovementSchema,
  createMovementSchema,
  adjustStockSchema,
  damageSchema,
  expirySchema,
  openingStockSchema,
  profitLossSchema,
  variantMovementsSchema,
  batchMovementsSchema,
} = require("../schemas/stockSchema");
const { emptyQuerySchema } = require("../schemas/commonSchema");

const stockController = new StockController();

router.use(auth);

// === Movements ===
router.get("/movements", requirePermission("inventory:read"), validate(listMovementSchema), (req, res, next) => stockController.listMovements(req, res, next));
router.post("/movements", requirePermission("inventory:write"), validate(createMovementSchema), audit("CREATE"), (req, res, next) => stockController.createMovement(req, res, next));

// === Manual operations ===
router.post("/adjust", requirePermission("inventory:adjust"), validate(adjustStockSchema), audit("UPDATE"), (req, res, next) => stockController.adjustStock(req, res, next));
router.post("/damage", requirePermission("inventory:adjust"), validate(damageSchema), audit("CREATE"), (req, res, next) => stockController.recordDamage(req, res, next));
router.post("/expiry", requirePermission("inventory:adjust"), validate(expirySchema), audit("CREATE"), (req, res, next) => stockController.recordExpiry(req, res, next));
router.post("/opening-stock", requirePermission("inventory:write"), validate(openingStockSchema), audit("CREATE"), (req, res, next) => stockController.recordOpeningStock(req, res, next));

// === Stats & reports ===
router.get("/stats", requirePermission("inventory:read"), validate(emptyQuerySchema), (req, res, next) => stockController.getStats(req, res, next));
router.get("/alerts", requirePermission("inventory:read"), validate(emptyQuerySchema), (req, res, next) => stockController.checkAlerts(req, res, next));
router.get("/valuation", requirePermission("inventory:read"), validate(emptyQuerySchema), (req, res, next) => stockController.getValuation(req, res, next));
router.get("/profit-loss", requirePermission("reports:read"), validate(profitLossSchema), (req, res, next) => stockController.getProfitLoss(req, res, next));

// === Per-entity movements ===
router.get("/variants/:variantId/movements", requirePermission("inventory:read"), validate(variantMovementsSchema), (req, res, next) => stockController.getVariantMovements(req, res, next));
router.get("/batches/:batchId/movements", requirePermission("inventory:read"), validate(batchMovementsSchema), (req, res, next) => stockController.getBatchMovements(req, res, next));

module.exports = router;

const express = require("express");
const router = express.Router();
const StocktakingController = require("../controllers/StocktakingController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const { idParamSchema } = require("../schemas/commonSchema");
const {
  startStocktakingSchema,
  updateCountsSchema,
  listStocktakingSchema,
} = require("../schemas/stocktakingSchema");

const stocktakingController = new StocktakingController();

router.use(auth);

router.get(
  "/",
  requirePermission("inventory:read"),
  validate(listStocktakingSchema),
  (req, res, next) => stocktakingController.list(req, res, next)
);
router.get(
  "/:id",
  requirePermission("inventory:read"),
  validate(idParamSchema),
  (req, res, next) => stocktakingController.getById(req, res, next)
);
router.post(
  "/",
  requirePermission("inventory:write"),
  validate(startStocktakingSchema),
  audit("CREATE"),
  (req, res, next) => stocktakingController.start(req, res, next)
);
router.put(
  "/:id/counts",
  requirePermission("inventory:write"),
  validate(updateCountsSchema),
  (req, res, next) => stocktakingController.updateCounts(req, res, next)
);
router.post(
  "/:id/complete",
  requirePermission("inventory:write"),
  validate(idParamSchema),
  audit("UPDATE"),
  (req, res, next) => stocktakingController.complete(req, res, next)
);
router.post(
  "/:id/cancel",
  requirePermission("inventory:write"),
  validate(idParamSchema),
  (req, res, next) => stocktakingController.cancel(req, res, next)
);

module.exports = router;

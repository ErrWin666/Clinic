const express = require("express");
const router = express.Router();
const ExamConsumableRuleController = require("../controllers/ExamConsumableRuleController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createRuleSchema,
  updateRuleSchema,
  listRuleSchema,
} = require("../schemas/examConsumableSchema");
const { idParamSchema } = require("../schemas/commonSchema");

const controller = new ExamConsumableRuleController();

router.use(auth);

router.get("/", requirePermission("inventory:read"), validate(listRuleSchema), (req, res, next) => controller.list(req, res, next));
router.get("/:id", requirePermission("inventory:read"), validate(idParamSchema), (req, res, next) => controller.getById(req, res, next));
router.post("/", requirePermission("inventory:write"), validate(createRuleSchema), audit("CREATE"), (req, res, next) => controller.create(req, res, next));
router.put("/:id", requirePermission("inventory:write"), validate(updateRuleSchema), audit("UPDATE"), (req, res, next) => controller.update(req, res, next));
router.delete("/:id", requirePermission("inventory:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => controller.delete(req, res, next));

module.exports = router;

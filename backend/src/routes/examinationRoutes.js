const express = require("express");
const router = express.Router();
const EyeExaminationController = require("../controllers/EyeExaminationController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const audit = require("../middlewares/audit");
const {
  updateExaminationSchema,
} = require("../schemas/examinationSchema");
const { idParamSchema, followUpSchema } = require("../schemas/commonSchema");

const examController = new EyeExaminationController();

router.use(auth);

router.get("/:id", requirePermission("examinations:read"), validate(idParamSchema), (req, res, next) => examController.getById(req, res, next));
router.put("/:id", requirePermission("examinations:write"), validate(updateExaminationSchema), audit("UPDATE"), (req, res, next) => examController.update(req, res, next));
router.post("/:id/follow-up", requirePermission("examinations:write"), validate(followUpSchema), audit("CREATE"), (req, res, next) => examController.createFollowUp(req, res, next));
router.get("/:id/pdf", requirePermission("examinations:read"), validate(idParamSchema), (req, res, next) => examController.getPDF(req, res, next));
router.get("/:id/prescription", requirePermission("examinations:read"), validate(idParamSchema), (req, res, next) => examController.getPrescriptionPDF(req, res, next));
router.delete("/:id", requirePermission("examinations:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => examController.delete(req, res, next));

module.exports = router;

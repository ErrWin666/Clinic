const express = require("express");
const router = express.Router();
const EyeExaminationController = require("../controllers/EyeExaminationController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const {
  createExaminationSchema,
  updateExaminationSchema,
} = require("../schemas/examinationSchema");
const { idParamSchema, followUpSchema } = require("../schemas/commonSchema");

const examController = new EyeExaminationController();

router.use(auth);

// Exam-specific routes (mounted at /examinations)
router.get("/:id", validate(idParamSchema), (req, res, next) => examController.getById(req, res, next));
router.put("/:id", validate(updateExaminationSchema), audit("UPDATE"), (req, res, next) => examController.update(req, res, next));
router.post("/:id/follow-up", validate(followUpSchema), audit("CREATE"), (req, res, next) => examController.createFollowUp(req, res, next));
router.get("/:id/pdf", validate(idParamSchema), (req, res, next) => examController.getPDF(req, res, next));
router.get("/:id/prescription", validate(idParamSchema), (req, res, next) => examController.getPrescriptionPDF(req, res, next));
router.delete("/:id", validate(idParamSchema), audit("DELETE"), (req, res, next) => examController.delete(req, res, next));

module.exports = router;

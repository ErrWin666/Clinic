const express = require("express");
const router = express.Router({ mergeParams: true });
const EyeExaminationController = require("../controllers/EyeExaminationController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { createExaminationSchema, listExaminationSchema } = require("../schemas/examinationSchema");

const examController = new EyeExaminationController();

router.use(auth);

router.get("/", validate(listExaminationSchema), (req, res, next) => examController.listByPatient(req, res, next));
router.get("/simple", (req, res, next) => examController.listSimpleByPatient(req, res, next));
router.post("/", validate(createExaminationSchema), audit("CREATE"), (req, res, next) => examController.create(req, res, next));

module.exports = router;

const express = require("express");
const router = express.Router();
const PatientController = require("../controllers/PatientController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { uploadImage } = require("../utils/fileUpload");
const {
  createPatientSchema,
  updatePatientSchema,
  listPatientSchema,
  autocompleteSchema,
} = require("../schemas/patientSchema");
const { idParamSchema, exportPatientSchema } = require("../schemas/commonSchema");

const patientController = new PatientController();

router.use(auth);

router.get("/", validate(listPatientSchema), (req, res, next) => patientController.list(req, res, next));
router.get("/autocomplete", validate(autocompleteSchema), (req, res, next) => patientController.autocomplete(req, res, next));
router.get("/export", validate(exportPatientSchema), (req, res, next) => patientController.export(req, res, next));
router.get("/:id", validate(idParamSchema), (req, res, next) => patientController.getById(req, res, next));
router.post("/", validate(createPatientSchema), audit("CREATE"), (req, res, next) => patientController.create(req, res, next));
router.put("/:id", validate(updatePatientSchema), audit("UPDATE"), (req, res, next) => patientController.update(req, res, next));
router.delete("/:id", validate(idParamSchema), audit("DELETE"), (req, res, next) => patientController.delete(req, res, next));
router.post("/:id/profile-image", validate(idParamSchema), uploadImage.single("image"), (req, res, next) => patientController.uploadProfileImage(req, res, next));
router.delete("/:id/profile-image", validate(idParamSchema), (req, res, next) => patientController.deleteProfileImage(req, res, next));
router.get("/:id/summary-pdf", validate(idParamSchema), (req, res, next) => patientController.getSummaryPDF(req, res, next));

module.exports = router;

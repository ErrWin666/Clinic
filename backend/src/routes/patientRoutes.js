const express = require("express");
const router = express.Router();
const PatientController = require("../controllers/PatientController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
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

router.get("/", requirePermission("patients:read"), validate(listPatientSchema), (req, res, next) => patientController.list(req, res, next));
router.get("/autocomplete", requirePermission("patients:read"), validate(autocompleteSchema), (req, res, next) => patientController.autocomplete(req, res, next));
router.get("/export", requirePermission("patients:read"), validate(exportPatientSchema), (req, res, next) => patientController.export(req, res, next));
router.get("/:id", requirePermission("patients:read"), validate(idParamSchema), (req, res, next) => patientController.getById(req, res, next));
router.post("/", requirePermission("patients:write"), validate(createPatientSchema), audit("CREATE"), (req, res, next) => patientController.create(req, res, next));
router.put("/:id", requirePermission("patients:write"), validate(updatePatientSchema), audit("UPDATE"), (req, res, next) => patientController.update(req, res, next));
router.delete("/:id", requirePermission("patients:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => patientController.delete(req, res, next));
router.post("/:id/profile-image", requirePermission("patients:write"), validate(idParamSchema), uploadImage.single("image"), (req, res, next) => patientController.uploadProfileImage(req, res, next));
router.delete("/:id/profile-image", requirePermission("patients:write"), validate(idParamSchema), (req, res, next) => patientController.deleteProfileImage(req, res, next));
router.get("/:id/summary-pdf", requirePermission("patients:read"), validate(idParamSchema), (req, res, next) => patientController.getSummaryPDF(req, res, next));

module.exports = router;

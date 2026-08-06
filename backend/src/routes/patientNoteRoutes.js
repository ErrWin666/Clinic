const express = require("express");
const router = express.Router({ mergeParams: true });
const PatientNoteController = require("../controllers/PatientNoteController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { upload, verifyMagicBytes } = require("../utils/fileUpload");
const { requirePermission } = require("../middlewares/rbac");
const {
  listPatientNotesSchema,
  patientNoteIdParamSchema,
  patientNoteAttachmentParamSchema,
  createPatientNoteSchema,
  updatePatientNoteSchema,
} = require("../schemas/patientNoteSchema");

const controller = new PatientNoteController();

router.use(auth);

router.get("/", requirePermission("notes:read"), validate(listPatientNotesSchema), (req, res, next) => controller.list(req, res, next));
router.get("/:id", requirePermission("notes:read"), validate(patientNoteIdParamSchema), (req, res, next) => controller.getById(req, res, next));
router.post("/", requirePermission("notes:write"), validate(createPatientNoteSchema), audit("CREATE"), (req, res, next) => controller.create(req, res, next));
router.put("/:id", requirePermission("notes:write"), validate(updatePatientNoteSchema), audit("UPDATE"), (req, res, next) => controller.update(req, res, next));
router.delete("/:id", requirePermission("notes:write"), validate(patientNoteIdParamSchema), audit("DELETE"), (req, res, next) => controller.delete(req, res, next));

router.post("/:id/attachments", requirePermission("notes:write"), validate(patientNoteIdParamSchema), upload.array("files", 10), verifyMagicBytes, audit("CREATE"), (req, res, next) => controller.uploadAttachment(req, res, next));
router.get("/:id/attachments/:fileId", requirePermission("notes:read"), validate(patientNoteAttachmentParamSchema), (req, res, next) => controller.downloadAttachment(req, res, next));
router.get("/:id/attachments/:fileId/preview", requirePermission("notes:read"), validate(patientNoteAttachmentParamSchema), (req, res, next) => controller.previewAttachment(req, res, next));
router.delete("/:id/attachments/:fileId", requirePermission("notes:write"), validate(patientNoteAttachmentParamSchema), audit("DELETE"), (req, res, next) => controller.deleteAttachment(req, res, next));

module.exports = router;

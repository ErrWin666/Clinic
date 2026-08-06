const express = require("express");
const router = express.Router();
const ClinicNoteController = require("../controllers/ClinicNoteController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { upload, verifyMagicBytes } = require("../utils/fileUpload");
const { requirePermission } = require("../middlewares/rbac");
const {
  listClinicNotesSchema,
  clinicNoteIdParamSchema,
  clinicNoteAttachmentParamSchema,
  createClinicNoteSchema,
  updateClinicNoteSchema,
} = require("../schemas/clinicNoteSchema");

const controller = new ClinicNoteController();

router.use(auth);

router.get("/", requirePermission("notes:read"), validate(listClinicNotesSchema), (req, res, next) => controller.list(req, res, next));
router.get("/:id", requirePermission("notes:read"), validate(clinicNoteIdParamSchema), (req, res, next) => controller.getById(req, res, next));
router.post("/", requirePermission("notes:write"), validate(createClinicNoteSchema), audit("CREATE"), (req, res, next) => controller.create(req, res, next));
router.put("/:id", requirePermission("notes:write"), validate(updateClinicNoteSchema), audit("UPDATE"), (req, res, next) => controller.update(req, res, next));
router.delete("/:id", requirePermission("notes:write"), validate(clinicNoteIdParamSchema), audit("DELETE"), (req, res, next) => controller.delete(req, res, next));

router.post("/:id/attachments", requirePermission("notes:write"), validate(clinicNoteIdParamSchema), upload.array("files", 10), verifyMagicBytes, audit("CREATE"), (req, res, next) => controller.uploadAttachment(req, res, next));
router.get("/:id/attachments/:fileId", requirePermission("notes:read"), validate(clinicNoteAttachmentParamSchema), (req, res, next) => controller.downloadAttachment(req, res, next));
router.get("/:id/attachments/:fileId/preview", requirePermission("notes:read"), validate(clinicNoteAttachmentParamSchema), (req, res, next) => controller.previewAttachment(req, res, next));
router.delete("/:id/attachments/:fileId", requirePermission("notes:write"), validate(clinicNoteAttachmentParamSchema), audit("DELETE"), (req, res, next) => controller.deleteAttachment(req, res, next));

module.exports = router;

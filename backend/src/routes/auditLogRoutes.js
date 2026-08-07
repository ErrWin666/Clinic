const express = require("express");
const router = express.Router();
const AuditLogController = require("../controllers/AuditLogController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const { listAuditLogSchema } = require("../schemas/commonSchema");

const auditLogController = new AuditLogController();

router.use(auth);

router.get("/", requirePermission("audit:read"), validate(listAuditLogSchema), (req, res, next) => auditLogController.list(req, res, next));

module.exports = router;

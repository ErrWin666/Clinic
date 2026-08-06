const express = require("express");
const router = express.Router();
const AuditLogController = require("../controllers/AuditLogController");
const auth = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { listAuditLogSchema } = require("../schemas/commonSchema");

const auditLogController = new AuditLogController();

router.use(auth);

router.get("/", validate(listAuditLogSchema), (req, res, next) => auditLogController.list(req, res, next));

module.exports = router;

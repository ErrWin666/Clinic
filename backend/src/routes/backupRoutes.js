const express = require("express");
const router = express.Router();
const BackupController = require("../controllers/BackupController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const audit = require("../middlewares/audit");
const { validate } = require("../middlewares/validate");
const { restoreBackupSchema, downloadBackupSchema } = require("../schemas/commonSchema");
const { updateBackupScheduleSchema } = require("../schemas/backupSchema");

const backupController = new BackupController();

router.use(auth);

router.get("/schedule", requirePermission("backup:read"), (req, res, next) => backupController.getSchedule(req, res, next));
router.put("/schedule", requirePermission("backup:write"), validate(updateBackupScheduleSchema), audit("UPDATE"), (req, res, next) => backupController.updateSchedule(req, res, next));
router.post("/create", requirePermission("backup:write"), audit("CREATE"), (req, res, next) => backupController.create(req, res, next));
router.post("/restore", requirePermission("backup:write"), validate(restoreBackupSchema), audit("UPDATE"), (req, res, next) => backupController.restore(req, res, next));
router.get("/history", requirePermission("backup:read"), (req, res, next) => backupController.history(req, res, next));
router.get("/download/:filename", requirePermission("backup:read"), validate(downloadBackupSchema), (req, res, next) => backupController.download(req, res, next));

module.exports = router;

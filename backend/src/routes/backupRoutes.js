const express = require("express");
const router = express.Router();
const BackupController = require("../controllers/BackupController");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { validate } = require("../middlewares/validate");
const { restoreBackupSchema, downloadBackupSchema } = require("../schemas/commonSchema");
const { updateBackupScheduleSchema } = require("../schemas/backupSchema");

const backupController = new BackupController();

router.use(auth);

router.get("/schedule", (req, res, next) => backupController.getSchedule(req, res, next));
router.put("/schedule", validate(updateBackupScheduleSchema), audit("UPDATE"), (req, res, next) => backupController.updateSchedule(req, res, next));
router.post("/create", audit("CREATE"), (req, res, next) => backupController.create(req, res, next));
router.post("/restore", validate(restoreBackupSchema), audit("UPDATE"), (req, res, next) => backupController.restore(req, res, next));
router.get("/history", (req, res, next) => backupController.history(req, res, next));
router.get("/download/:filename", validate(downloadBackupSchema), (req, res, next) => backupController.download(req, res, next));

module.exports = router;

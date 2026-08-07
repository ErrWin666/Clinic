const express = require("express");
const router = express.Router();
const SystemController = require("../controllers/SystemController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const { emptyQuerySchema } = require("../schemas/commonSchema");

const systemController = new SystemController();

router.use(auth);

router.get("/disk-space", requirePermission("system:read"), validate(emptyQuerySchema), (req, res, next) => systemController.getDiskSpace(req, res, next));

module.exports = router;

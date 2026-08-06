const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/DashboardController");
const auth = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { emptyQuerySchema } = require("../schemas/commonSchema");

const dashboardController = new DashboardController();

router.use(auth);

router.get("/stats", validate(emptyQuerySchema), (req, res, next) => dashboardController.getStats(req, res, next));

module.exports = router;

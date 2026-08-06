const express = require("express");
const router = express.Router();
const SetupController = require("../controllers/SetupController");
const { validate } = require("../middlewares/validate");
const { createAdminSchema } = require("../schemas/authSchema");

const setupController = new SetupController();

router.get("/check-admin", (req, res, next) => setupController.checkAdmin(req, res, next));
router.post("/create-admin", validate(createAdminSchema), (req, res, next) => setupController.createAdmin(req, res, next));

module.exports = router;

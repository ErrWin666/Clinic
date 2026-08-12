const express = require("express");
const router = express.Router();
const SetupController = require("../controllers/SetupController");
const { validate } = require("../middlewares/validate");
const { createAdminSchema } = require("../schemas/authSchema");

const setupController = new SetupController();

function localhostOnly(req, res, next) {
  const isElectron = process.env.ELECTRON_APP === "true";
  if (isElectron) return next();
  if (process.env.NODE_ENV === "test") return next();
  const ip = req.ip || req.socket?.remoteAddress || "";
  const normalized = ip.replace(/^::ffff:/, "");
  if (normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost") {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: { code: "LOCALHOST_ONLY", message: "This endpoint is only accessible from localhost" },
  });
}

router.get("/check-admin", (req, res, next) => setupController.checkAdmin(req, res, next));
router.post("/create-admin", localhostOnly, validate(createAdminSchema), (req, res, next) => setupController.createAdmin(req, res, next));

module.exports = router;

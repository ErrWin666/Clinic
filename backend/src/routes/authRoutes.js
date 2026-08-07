const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { validate } = require("../middlewares/validate");
const { loginSchema, recoverSchema, recoverViaFileSchema } = require("../schemas/authSchema");
const { loginLimiter, refreshTokenLimiter, recoverLimiter } = require("../middlewares/rateLimit");
const auth = require("../middlewares/auth");

const authController = new AuthController();

router.post("/login", loginLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post("/refresh-token", refreshTokenLimiter, (req, res, next) => authController.refreshToken(req, res, next));
router.get("/session-status", auth, (req, res, next) => authController.sessionStatus(req, res, next));
router.post("/logout", auth, (req, res, next) => authController.logout(req, res, next));
router.post("/recover", recoverLimiter, validate(recoverSchema), (req, res, next) => authController.recover(req, res, next));
router.post("/recover-via-file", recoverLimiter, validate(recoverViaFileSchema), (req, res, next) => authController.recoverViaFile(req, res, next));
router.post("/regenerate-recovery-code", auth, (req, res, next) => authController.regenerateRecoveryCode(req, res, next));

module.exports = router;

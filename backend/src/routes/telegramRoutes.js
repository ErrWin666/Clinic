const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const TelegramController = require("../controllers/TelegramController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const audit = require("../middlewares/audit");
const Joi = require("joi");
const config = require("../config");

const controller = new TelegramController();

const updateSettingsSchema = Joi.object({
  body: Joi.object({
    enabled: Joi.boolean(),
    botUsername: Joi.string().allow(""),
    botToken: Joi.string().allow(""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const testSchema = Joi.object({
  body: Joi.object({
    chatId: Joi.string().required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const webhookSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({}),
  params: Joi.object({}),
});

const patientIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    patientId: Joi.number().integer().positive().required(),
  }),
});

function webhookSecretCheck(req, res, next) {
  const secret = config.telegram.webhookSecret;
  if (!secret) {
    return res.status(503).json({
      success: false,
      error: { code: "WEBHOOK_NOT_CONFIGURED", message: "Webhook secret not set" },
    });
  }
  const received = Buffer.from(req.headers["x-telegram-bot-api-secret-token"] || "");
  const expected = Buffer.from(secret);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(403).json({
      success: false,
      error: { code: "WEBHOOK_FORBIDDEN", message: "Invalid webhook secret" },
    });
  }
  next();
}

// Webhook is public (Telegram sends updates to it) but protected by secret token
router.post("/webhook", webhookSecretCheck, validate(webhookSchema), (req, res, next) => controller.handleWebhook(req, res, next));

// All other routes require auth
router.use(auth);

router.get("/settings", requirePermission("settings:read"), (req, res, next) => controller.getSettings(req, res, next));
router.put("/settings", requirePermission("settings:write"), validate(updateSettingsSchema), audit("UPDATE"), (req, res, next) => controller.updateSettings(req, res, next));
router.post("/test", requirePermission("settings:write"), validate(testSchema), (req, res, next) => controller.testConnection(req, res, next));
router.post("/invite/:patientId", requirePermission("patients:write"), validate(patientIdParamSchema), (req, res, next) => controller.sendInviteLink(req, res, next));

module.exports = router;

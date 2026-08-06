const express = require("express");
const router = express.Router();
const WhatsAppController = require("../controllers/WhatsAppController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const audit = require("../middlewares/audit");
const Joi = require("joi");

const controller = new WhatsAppController();

const updateSettingsSchema = Joi.object({
  body: Joi.object({
    enabled: Joi.boolean(),
    accountSid: Joi.string().allow(""),
    authToken: Joi.string().allow(""),
    fromNumber: Joi.string().allow(""),
    appointmentTemplate: Joi.string().allow(""),
    invoiceTemplate: Joi.string().allow(""),
    followUpTemplate: Joi.string().allow(""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const cloudSettingsSchema = Joi.object({
  body: Joi.object({
    enabled: Joi.boolean(),
    phoneNumberId: Joi.string().allow(""),
    accessToken: Joi.string().allow(""),
    apiVersion: Joi.string().allow(""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const smsMobileSettingsSchema = Joi.object({
  body: Joi.object({
    enabled: Joi.boolean(),
    url: Joi.string().allow(""),
    apiKey: Joi.string().allow(""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const testMessageSchema = Joi.object({
  body: Joi.object({
    to: Joi.string().required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const idParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
});

const patientIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    patientId: Joi.number().integer().positive().required(),
  }),
});

router.use(auth);

router.get("/settings", requirePermission("settings:read"), (req, res, next) => controller.getSettings(req, res, next));
router.put("/settings", requirePermission("settings:write"), validate(updateSettingsSchema), audit("UPDATE"), (req, res, next) => controller.updateSettings(req, res, next));
router.post("/test", requirePermission("settings:write"), validate(testMessageSchema), (req, res, next) => controller.testMessage(req, res, next));
router.post("/appointment/:id", requirePermission("appointments:write"), validate(idParamSchema), (req, res, next) => controller.sendAppointmentReminder(req, res, next));
router.post("/invoice/:id", requirePermission("invoices:write"), validate(idParamSchema), (req, res, next) => controller.sendInvoiceNotification(req, res, next));
router.post("/follow-up/:patientId", requirePermission("patients:write"), validate(patientIdParamSchema), (req, res, next) => controller.sendFollowUpReminder(req, res, next));

// WhatsApp Cloud API settings (Layer 1)
router.get("/cloud-settings", requirePermission("settings:read"), (req, res, next) => controller.getCloudSettings(req, res, next));
router.put("/cloud-settings", requirePermission("settings:write"), validate(cloudSettingsSchema), audit("UPDATE"), (req, res, next) => controller.updateCloudSettings(req, res, next));

// SMSMobileAPI settings (Layer 3)
router.get("/sms-mobile-settings", requirePermission("settings:read"), (req, res, next) => controller.getSmsMobileSettings(req, res, next));
router.put("/sms-mobile-settings", requirePermission("settings:write"), validate(smsMobileSettingsSchema), audit("UPDATE"), (req, res, next) => controller.updateSmsMobileSettings(req, res, next));
router.post("/sms-mobile-test", requirePermission("settings:write"), (req, res, next) => controller.testSmsMobileConnection(req, res, next));

module.exports = router;

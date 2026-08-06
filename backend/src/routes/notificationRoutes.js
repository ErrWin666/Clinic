const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const audit = require("../middlewares/audit");
const Joi = require("joi");
const { listNotificationSchema } = require("../schemas/notificationSchema");
const { idParamSchema } = require("../schemas/commonSchema");

const notificationController = new NotificationController();

const reminderSettingsSchema = Joi.object({
  body: Joi.object({
    appointmentReminderDays: Joi.number().integer().min(0).max(30),
    invoiceReminderDays: Joi.number().integer().min(0).max(30),
    followUpDays: Joi.number().integer().min(1).max(365),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const templateTypeParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    type: Joi.string().required(),
  }),
});

const updateTemplateSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().allow(""),
    html: Joi.string().allow(""),
  }),
  query: Joi.object({}),
  params: Joi.object({
    type: Joi.string().required(),
  }),
});

router.use(auth);

router.get("/", validate(listNotificationSchema), (req, res, next) => notificationController.list(req, res, next));
router.get("/stream", (req, res, next) => notificationController.stream(req, res, next));
router.patch("/read-all", (req, res, next) => notificationController.markAllRead(req, res, next));
router.patch("/:id/read", validate(idParamSchema), (req, res, next) => notificationController.markRead(req, res, next));
router.delete("/:id", validate(idParamSchema), (req, res, next) => notificationController.delete(req, res, next));

// Reminder settings
router.get("/reminder-settings", requirePermission("settings:read"), (req, res, next) => notificationController.getReminderSettings(req, res, next));
router.put("/reminder-settings", requirePermission("settings:write"), validate(reminderSettingsSchema), audit("UPDATE"), (req, res, next) => notificationController.updateReminderSettings(req, res, next));

// Message templates
router.get("/templates", requirePermission("settings:read"), (req, res, next) => notificationController.getTemplates(req, res, next));
router.put("/templates/:type", requirePermission("settings:write"), validate(updateTemplateSchema), audit("UPDATE"), (req, res, next) => notificationController.updateTemplate(req, res, next));
router.delete("/templates/:type", requirePermission("settings:write"), validate(templateTypeParamSchema), audit("DELETE"), (req, res, next) => notificationController.resetTemplate(req, res, next));

module.exports = router;

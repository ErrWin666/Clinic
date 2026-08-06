const express = require("express");
const router = express.Router();
const MessageDispatcherController = require("../controllers/MessageDispatcherController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const Joi = require("joi");

const controller = new MessageDispatcherController();

const idParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    notificationId: Joi.number().integer().positive().required(),
  }),
});

router.use(auth);

router.post("/dispatch/:notificationId", requirePermission("notifications:write"), validate(idParamSchema), (req, res, next) =>
  controller.dispatchNotification(req, res, next)
);
router.get("/status/:notificationId", requirePermission("notifications:read"), validate(idParamSchema), (req, res, next) =>
  controller.getDispatchStatus(req, res, next)
);
router.get("/stats", requirePermission("notifications:read"), (req, res, next) =>
  controller.getDispatchStats(req, res, next)
);

module.exports = router;

const Joi = require("joi");
const ENUMS = require("../constants/enums");

const listNotificationSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    isRead: Joi.boolean(),
    type: Joi.string().valid(...ENUMS.NOTIFICATION_TYPE),
  }),
  params: Joi.object({}),
});

module.exports = { listNotificationSchema };

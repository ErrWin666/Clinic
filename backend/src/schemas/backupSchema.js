const Joi = require("joi");

const updateBackupScheduleSchema = Joi.object({
  body: Joi.object({
    enabled: Joi.boolean().required(),
    hour: Joi.number().integer().min(0).max(23).required(),
    minute: Joi.number().integer().min(0).max(59).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

module.exports = { updateBackupScheduleSchema };

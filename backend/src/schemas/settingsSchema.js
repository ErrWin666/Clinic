const Joi = require("joi");
const ENUMS = require("../constants/enums");

const updateSettingsSchema = Joi.object({
  body: Joi.object({
    settings: Joi.array().items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().required(),
        category: Joi.string().valid(...ENUMS.SETTINGS_CATEGORY).required(),
      })
    ).min(1).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateAdminSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50),
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100),
  }).min(2),
  query: Joi.object({}),
  params: Joi.object({}),
});

module.exports = { updateSettingsSchema, updateAdminSchema };

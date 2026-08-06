const Joi = require("joi");

const createRuleSchema = Joi.object({
  body: Joi.object({
    examType: Joi.string().min(1).max(100).required(),
    productVariantId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).default(1),
    isActive: Joi.boolean().default(true),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateRuleSchema = Joi.object({
  body: Joi.object({
    examType: Joi.string().min(1).max(100),
    productVariantId: Joi.number().integer().positive(),
    quantity: Joi.number().integer().min(1),
    isActive: Joi.boolean(),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listRuleSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    examType: Joi.string().allow(""),
    productVariantId: Joi.number().integer().positive(),
    isActive: Joi.string().valid("true", "false"),
  }),
  params: Joi.object({}),
});

module.exports = {
  createRuleSchema,
  updateRuleSchema,
  listRuleSchema,
};

const Joi = require("joi");

const bundleItemSchema = Joi.object({
  productVariantId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const createBundleSchema = Joi.object({
  body: Joi.object({
    productId: Joi.number().integer().positive().required(),
    description: Joi.string().allow(null, ""),
    items: Joi.array().items(bundleItemSchema).min(1).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateBundleSchema = Joi.object({
  body: Joi.object({
    description: Joi.string().allow(null, ""),
    items: Joi.array().items(bundleItemSchema).min(1),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listBundleSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    productId: Joi.number().integer().positive(),
    search: Joi.string().allow(""),
  }),
  params: Joi.object({}),
});

const expandBundleSchema = Joi.object({
  body: Joi.object({
    quantity: Joi.number().integer().min(1).default(1),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

module.exports = {
  createBundleSchema,
  updateBundleSchema,
  listBundleSchema,
  expandBundleSchema,
};

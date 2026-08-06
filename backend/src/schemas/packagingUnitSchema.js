const Joi = require("joi");

const variantIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ variantId: Joi.number().integer().positive().required() }),
});

const createPackagingUnitSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    shortName: Joi.string().min(1).max(20).required(),
    factor: Joi.number().integer().min(1).default(1),
    isBaseUnit: Joi.boolean().default(false),
    barcode: Joi.string().max(100).allow(null, ""),
    sellPrice: Joi.number().positive().precision(2).allow(null),
    isActive: Joi.boolean().default(true),
  }),
  query: Joi.object({}),
  params: Joi.object({ variantId: Joi.number().integer().positive().required() }),
});

const updatePackagingUnitSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(50),
    shortName: Joi.string().min(1).max(20),
    factor: Joi.number().integer().min(1),
    isBaseUnit: Joi.boolean(),
    barcode: Joi.string().max(100).allow(null, ""),
    sellPrice: Joi.number().positive().precision(2).allow(null),
    isActive: Joi.boolean(),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({
    variantId: Joi.number().integer().positive().required(),
    id: Joi.number().integer().positive().required(),
  }),
});

const packagingUnitIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

module.exports = {
  variantIdParamSchema,
  createPackagingUnitSchema,
  updatePackagingUnitSchema,
  packagingUnitIdParamSchema,
};

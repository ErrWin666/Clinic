const Joi = require("joi");
const ENUMS = require("../constants/enums");

// === Product schemas ===

const createProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    category: Joi.string().valid(...ENUMS.PRODUCT_CATEGORY).default("other"),
    costingMethod: Joi.string().valid(...ENUMS.COSTING_METHOD).default("fifo"),
    description: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateProductSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200),
    category: Joi.string().valid(...ENUMS.PRODUCT_CATEGORY),
    costingMethod: Joi.string().valid(...ENUMS.COSTING_METHOD),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean(),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listProductSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    category: Joi.string().valid(...ENUMS.PRODUCT_CATEGORY),
    search: Joi.string().allow(""),
  }),
  params: Joi.object({}),
});

// === Product Variant schemas ===

const productIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ productId: Joi.number().integer().positive().required() }),
});

const createVariantSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    sku: Joi.string().min(1).max(100).required(),
    barcode: Joi.string().max(100).allow(null, ""),
    sellPrice: Joi.number().positive().precision(2).required(),
    minQuantity: Joi.number().integer().min(0).default(0),
    maxQuantity: Joi.number().integer().min(0).default(0),
    location: Joi.string().max(200).allow(null, ""),
    serialNumber: Joi.string().max(100).allow(null, ""),
    discountPercentage: Joi.number().min(0).max(100).precision(2).default(0),
    discountValidUntil: Joi.date().iso().allow(null),
  }),
  query: Joi.object({}),
  params: Joi.object({ productId: Joi.number().integer().positive().required() }),
});

const updateVariantSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200),
    sku: Joi.string().min(1).max(100),
    barcode: Joi.string().max(100).allow(null, ""),
    sellPrice: Joi.number().positive().precision(2),
    minQuantity: Joi.number().integer().min(0),
    maxQuantity: Joi.number().integer().min(0),
    location: Joi.string().max(200).allow(null, ""),
    serialNumber: Joi.string().max(100).allow(null, ""),
    discountPercentage: Joi.number().min(0).max(100).precision(2),
    discountValidUntil: Joi.date().iso().allow(null),
    isActive: Joi.boolean(),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({
    productId: Joi.number().integer().positive().required(),
    variantId: Joi.number().integer().positive().required(),
  }),
});

const variantIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ variantId: Joi.number().integer().positive().required() }),
});

const listVariantSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    productId: Joi.number().integer().positive(),
    lowStock: Joi.string().valid("true", "false"),
    outOfStock: Joi.string().valid("true", "false"),
    search: Joi.string().allow(""),
  }),
  params: Joi.object({}),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductSchema,
  productIdParamSchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdParamSchema,
  listVariantSchema,
};

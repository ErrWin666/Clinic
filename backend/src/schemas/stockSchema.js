const Joi = require("joi");
const ENUMS = require("../constants/enums");

const listMovementSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid(...ENUMS.STOCK_MOVEMENT_TYPE),
    reason: Joi.string().valid(...ENUMS.STOCK_MOVEMENT_REASON),
    productVariantId: Joi.number().integer().positive(),
    batchId: Joi.number().integer().positive(),
    referenceType: Joi.string().valid(...ENUMS.STOCK_REFERENCE_TYPE),
    referenceId: Joi.number().integer().positive(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({}),
});

const createMovementSchema = Joi.object({
  body: Joi.object({
    productVariantId: Joi.number().integer().positive().required(),
    batchId: Joi.number().integer().positive().required(),
    type: Joi.string().valid(...ENUMS.STOCK_MOVEMENT_TYPE).required(),
    quantity: Joi.number().integer().required(),
    reason: Joi.string().valid(...ENUMS.STOCK_MOVEMENT_REASON).required(),
    unitCost: Joi.number().min(0).precision(2).default(0),
    note: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const adjustStockSchema = Joi.object({
  body: Joi.object({
    productVariantId: Joi.number().integer().positive().required(),
    batchId: Joi.number().integer().positive().required(),
    newQuantity: Joi.number().integer().min(0).required(),
    note: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const damageSchema = Joi.object({
  body: Joi.object({
    batchId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    note: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const expirySchema = Joi.object({
  body: Joi.object({
    batchId: Joi.number().integer().positive().required(),
    note: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const openingStockSchema = Joi.object({
  body: Joi.object({
    productVariantId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    unitCost: Joi.number().min(0).precision(2).required(),
    batchNumber: Joi.string().max(100).allow(null, ""),
    expiryDate: Joi.date().iso().allow(null),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const profitLossSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
  params: Joi.object({}),
});

const barcodeParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ barcode: Joi.string().min(1).max(100).required() }),
});

const variantMovementsSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
  params: Joi.object({ variantId: Joi.number().integer().positive().required() }),
});

const batchMovementsSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ batchId: Joi.number().integer().positive().required() }),
});

module.exports = {
  listMovementSchema,
  createMovementSchema,
  adjustStockSchema,
  damageSchema,
  expirySchema,
  openingStockSchema,
  profitLossSchema,
  barcodeParamSchema,
  variantMovementsSchema,
  batchMovementsSchema,
};

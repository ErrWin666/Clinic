const Joi = require("joi");
const ENUMS = require("../constants/enums");

const poItemSchema = Joi.object({
  productVariantId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitCost: Joi.number().min(0).precision(2).required(),
  batchNumber: Joi.string().max(100).allow(null, ""),
  expiryDate: Joi.date().iso().allow(null),
});

const createPurchaseOrderSchema = Joi.object({
  body: Joi.object({
    supplierId: Joi.number().integer().positive().required(),
    orderDate: Joi.date().iso().required(),
    note: Joi.string().allow(null, ""),
    items: Joi.array().items(poItemSchema).min(1).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updatePurchaseOrderSchema = Joi.object({
  body: Joi.object({
    orderDate: Joi.date().iso(),
    note: Joi.string().allow(null, ""),
    items: Joi.array().items(poItemSchema).min(1),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listPurchaseOrderSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    supplierId: Joi.number().integer().positive(),
    status: Joi.string().valid(...ENUMS.PURCHASE_ORDER_STATUS),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({}),
});

const receivePurchaseOrderSchema = Joi.object({
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
          receivedQuantity: Joi.number().integer().min(0).required(),
          receivedUnit: Joi.string().max(50).default("piece"),
          batchNumber: Joi.string().max(100).allow(null, ""),
          expiryDate: Joi.date().iso().allow(null),
        })
      )
      .min(1)
      .required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

module.exports = {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrderSchema,
  receivePurchaseOrderSchema,
};

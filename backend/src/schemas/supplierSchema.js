const Joi = require("joi");
const ENUMS = require("../constants/enums");

// === Supplier schemas ===

const createSupplierSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    phone: Joi.string().max(30).allow(null, ""),
    email: Joi.string().email().allow(null, ""),
    address: Joi.string().max(500).allow(null, ""),
    contactPerson: Joi.string().max(200).allow(null, ""),
    taxNumber: Joi.string().max(100).allow(null, ""),
    openingBalance: Joi.number().precision(2).default(0),
    notes: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateSupplierSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200),
    phone: Joi.string().max(30).allow(null, ""),
    email: Joi.string().email().allow(null, ""),
    address: Joi.string().max(500).allow(null, ""),
    contactPerson: Joi.string().max(200).allow(null, ""),
    taxNumber: Joi.string().max(100).allow(null, ""),
    notes: Joi.string().allow(null, ""),
    isActive: Joi.boolean(),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listSupplierSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(""),
  }),
  params: Joi.object({}),
});

const supplierStatementSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

// === Supplier Payment schemas ===

const createPaymentSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    paymentDate: Joi.date().iso().required(),
    paymentMethod: Joi.string().valid(...ENUMS.SUPPLIER_PAYMENT_METHOD).default("cash"),
    reference: Joi.string().max(200).allow(null, ""),
    purchaseOrderId: Joi.number().integer().positive().allow(null),
    note: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({ supplierId: Joi.number().integer().positive().required() }),
});

const listPaymentSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
  }),
  params: Joi.object({ supplierId: Joi.number().integer().positive().required() }),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  listSupplierSchema,
  supplierStatementSchema,
  createPaymentSchema,
  listPaymentSchema,
};

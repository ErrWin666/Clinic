const Joi = require("joi");
const ENUMS = require("../constants/enums");

const invoiceItemSchema = Joi.object({
  description: Joi.string().min(1).max(500).required(),
  quantity: Joi.number().integer().min(1).default(1),
  unitPrice: Joi.number().positive().precision(2).required(),
  productVariantId: Joi.number().integer().positive().allow(null),
  unit: Joi.string().max(50).default("piece"),
});

const createInvoiceSchema = Joi.object({
  body: Joi.object({
    patientId: Joi.number().integer().positive().allow(null),
    customerName: Joi.string().max(200).allow(null, ""),
    customerPhone: Joi.string().max(30).allow(null, ""),
    invoiceDate: Joi.date().iso().required(),
    dueDate: Joi.date().iso().allow(null),
    invoiceStatus: Joi.string().valid("unpaid", "paid").default("unpaid"),
    taxAmount: Joi.number().precision(2).default(0),
    discountAmount: Joi.number().precision(2).default(0),
    logo: Joi.string().allow(null, ""),
    noteMessage: Joi.string().allow(null, ""),
    noteContactLine: Joi.string().allow(null, ""),
    notePhone: Joi.string().allow(null, ""),
    noteEmail: Joi.string().email().allow(null, ""),
    items: Joi.array().items(invoiceItemSchema).min(1).required(),
  }).custom((value, helpers) => {
    if (!value.patientId && !value.customerName) {
      return helpers.error("any.invalid", { message: "Either patientId or customerName required" });
    }
    return value;
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateInvoiceSchema = Joi.object({
  body: Joi.object({
    patientId: Joi.number().integer().positive().allow(null),
    customerName: Joi.string().max(200).allow(null, ""),
    customerPhone: Joi.string().max(30).allow(null, ""),
    invoiceDate: Joi.date().iso(),
    dueDate: Joi.date().iso().allow(null),
    taxAmount: Joi.number().precision(2),
    discountAmount: Joi.number().precision(2),
    logo: Joi.string().allow(null, ""),
    noteMessage: Joi.string().allow(null, ""),
    noteContactLine: Joi.string().allow(null, ""),
    notePhone: Joi.string().allow(null, ""),
    noteEmail: Joi.string().email().allow(null, ""),
    items: Joi.array().items(invoiceItemSchema),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const invoiceStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid(...ENUMS.INVOICE_STATUS).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listInvoiceSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(...ENUMS.INVOICE_STATUS),
    patientId: Joi.number().integer().positive(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    search: Joi.string().allow(""),
    minAmount: Joi.number().min(0),
    maxAmount: Joi.number().min(0),
    invoiceType: Joi.string().valid("patient", "customer"),
  }),
  params: Joi.object({}),
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceStatusSchema,
  listInvoiceSchema,
};

const Joi = require("joi");
const ENUMS = require("../constants/enums");

const idParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({ lang: Joi.string().valid("en", "ar").optional() }),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const patientIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

const listAuditLogSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    action: Joi.string().valid(...ENUMS.AUDIT_ACTION),
    entity: Joi.string().max(50),
  }),
  params: Joi.object({}),
});

const restoreBackupSchema = Joi.object({
  body: Joi.object({
    filename: Joi.string().min(1).max(255).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const downloadBackupSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ filename: Joi.string().min(1).max(255).required() }),
});

const linkPatientSchema = Joi.object({
  body: Joi.object({
    patientId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const followUpSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const reportQuerySchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    status: Joi.string().valid(...ENUMS.INVOICE_STATUS, ...ENUMS.APPOINTMENT_STATUS),
    patientId: Joi.number().integer().positive(),
    patientType: Joi.string().valid(...ENUMS.PATIENT_TYPE),
    gender: Joi.string().valid(...ENUMS.GENDER),
    search: Joi.string().max(100),
  }),
  params: Joi.object({}),
});

const fileIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ fileId: Joi.number().integer().positive().required() }),
});

const folderIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ folderId: Joi.number().integer().positive().required() }),
});

const relationshipIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ relationshipId: Joi.number().integer().positive().required() }),
});

const exportPatientSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    patientType: Joi.string().valid(...ENUMS.PATIENT_TYPE),
    gender: Joi.string().valid(...ENUMS.GENDER),
    search: Joi.string().max(100),
  }),
  params: Joi.object({}),
});

const exportInvoiceSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
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

const emptyQuerySchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({}),
});

module.exports = {
  idParamSchema,
  patientIdParamSchema,
  listAuditLogSchema,
  restoreBackupSchema,
  downloadBackupSchema,
  linkPatientSchema,
  followUpSchema,
  reportQuerySchema,
  fileIdParamSchema,
  folderIdParamSchema,
  relationshipIdParamSchema,
  exportPatientSchema,
  exportInvoiceSchema,
  emptyQuerySchema,
};

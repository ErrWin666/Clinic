const Joi = require("joi");

const listPatientNotesSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(""),
  }),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

const patientNoteIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    patientId: Joi.number().integer().positive().required(),
    id: Joi.number().integer().positive().required(),
  }),
});

const patientNoteAttachmentParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    patientId: Joi.number().integer().positive().required(),
    id: Joi.number().integer().positive().required(),
    fileId: Joi.number().integer().positive().required(),
  }),
});

const createPatientNoteSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(255).allow("", null),
    content: Joi.string().required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

const updatePatientNoteSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(255).allow("", null),
    content: Joi.string(),
  }),
  query: Joi.object({}),
  params: Joi.object({
    patientId: Joi.number().integer().positive().required(),
    id: Joi.number().integer().positive().required(),
  }),
});

module.exports = {
  listPatientNotesSchema,
  patientNoteIdParamSchema,
  patientNoteAttachmentParamSchema,
  createPatientNoteSchema,
  updatePatientNoteSchema,
};

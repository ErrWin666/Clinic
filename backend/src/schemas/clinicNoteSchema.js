const Joi = require("joi");

const listClinicNotesSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(""),
  }),
  params: Joi.object({}),
});

const clinicNoteIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const clinicNoteAttachmentParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
    fileId: Joi.number().integer().positive().required(),
  }),
});

const createClinicNoteSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(255).allow("", null),
    content: Joi.string().required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateClinicNoteSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().max(255).allow("", null),
    content: Joi.string(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

module.exports = {
  listClinicNotesSchema,
  clinicNoteIdParamSchema,
  clinicNoteAttachmentParamSchema,
  createClinicNoteSchema,
  updateClinicNoteSchema,
};

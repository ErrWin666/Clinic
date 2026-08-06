const Joi = require("joi");

const listFoldersSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    parentFolderId: Joi.number().integer().positive().allow(null),
    search: Joi.string().allow(""),
    sortBy: Joi.string().valid("name", "createdAt").default("name"),
    sortOrder: Joi.string().valid("asc", "desc").default("asc"),
  }),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

const createFolderSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    parentFolderId: Joi.number().integer().positive().allow(null),
  }),
  query: Joi.object({}),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

const updateFolderSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(200),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ patientId: Joi.number().integer().positive().required(), folderId: Joi.number().integer().positive().required() }),
});

module.exports = { listFoldersSchema, createFolderSchema, updateFolderSchema };

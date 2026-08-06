const Joi = require("joi");

const listFilesSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    folderId: Joi.number().integer().positive().allow(null),
    examinationId: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().valid("null")
    ).allow(null),
    search: Joi.string().allow(""),
    type: Joi.string().allow(""),
    sortBy: Joi.string().valid("name", "createdAt", "size").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

module.exports = { listFilesSchema };

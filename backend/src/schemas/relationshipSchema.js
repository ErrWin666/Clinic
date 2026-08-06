const Joi = require("joi");
const ENUMS = require("../constants/enums");

const createRelationshipSchema = Joi.object({
  body: Joi.object({
    relatedPatientId: Joi.number().integer().positive().required(),
    relationType: Joi.string().valid(...ENUMS.RELATION_TYPE).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ patientId: Joi.number().integer().positive().required() }),
});

module.exports = { createRelationshipSchema };

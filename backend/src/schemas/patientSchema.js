const Joi = require("joi");
const ENUMS = require("../constants/enums");

const createPatientSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(200).required(),
    birthDate: Joi.date().iso().required(),
    gender: Joi.string().valid(...ENUMS.GENDER).required(),
    phoneNumber: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().allow(null, ""),
    address: Joi.string().max(500).allow(null, ""),
    patientType: Joi.string().valid(...ENUMS.PATIENT_TYPE).default("regular"),
    notes: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updatePatientSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(200),
    birthDate: Joi.date().iso(),
    gender: Joi.string().valid(...ENUMS.GENDER),
    phoneNumber: Joi.string().min(3).max(30),
    email: Joi.string().email().allow(null, ""),
    address: Joi.string().max(500).allow(null, ""),
    patientType: Joi.string().valid(...ENUMS.PATIENT_TYPE),
    notes: Joi.string().allow(null, ""),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listPatientSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(""),
    patientType: Joi.string().valid(...ENUMS.PATIENT_TYPE),
    gender: Joi.string().valid(...ENUMS.GENDER),
    sortBy: Joi.string().valid("fullName", "createdAt", "birthDate").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    minAge: Joi.number().integer().min(0).max(150),
    maxAge: Joi.number().integer().min(0).max(150),
  }),
  params: Joi.object({}),
});

const autocompleteSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    q: Joi.string().min(1).required(),
    limit: Joi.number().integer().min(1).max(20).default(10),
  }),
  params: Joi.object({}),
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  listPatientSchema,
  autocompleteSchema,
};

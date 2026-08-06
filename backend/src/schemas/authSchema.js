const Joi = require("joi");

const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[0-9]/, "number")
  .required();

const loginSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(100).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const createAdminSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    clinicName: Joi.string().min(2).max(100).required(),
    currency: Joi.string().default("USD"),
    language: Joi.string().valid("ar", "en").default("ar"),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const recoverSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    recoveryCode: Joi.string().min(20).max(30).required(),
    newPassword: passwordSchema,
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const recoverViaFileSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    newPassword: passwordSchema,
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

module.exports = { loginSchema, createAdminSchema, recoverSchema, recoverViaFileSchema };

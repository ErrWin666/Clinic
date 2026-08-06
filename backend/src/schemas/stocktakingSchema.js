const Joi = require("joi");

const startStocktakingSchema = Joi.object({
  body: Joi.object({
    note: Joi.string().allow(null, ""),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateCountsSchema = Joi.object({
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().required(),
          countedQuantity: Joi.number().integer().allow(null),
          note: Joi.string().allow(null, ""),
        })
      )
      .min(1)
      .required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const listStocktakingSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid("draft", "in_progress", "completed", "cancelled"),
  }),
  params: Joi.object({}),
});

module.exports = {
  startStocktakingSchema,
  updateCountsSchema,
  listStocktakingSchema,
};

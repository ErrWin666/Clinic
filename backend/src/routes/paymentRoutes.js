const express = require("express");
const router = express.Router({ mergeParams: true });
const PaymentController = require("../controllers/PaymentController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const audit = require("../middlewares/audit");
const Joi = require("joi");

const controller = new PaymentController();

const invoiceIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    invoiceId: Joi.number().integer().positive().required(),
  }),
});

const createPaymentSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().positive().required(),
    paymentDate: Joi.date().optional(),
    paymentMethod: Joi.string().valid("cash", "card", "transfer", "cheque", "other").optional(),
    note: Joi.string().allow("").max(500).optional(),
  }),
  query: Joi.object({}),
  params: Joi.object({
    invoiceId: Joi.number().integer().positive().required(),
  }),
});

const paymentIdParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    invoiceId: Joi.number().integer().positive().required(),
    id: Joi.number().integer().positive().required(),
  }),
});

router.use(auth);

router.get("/", requirePermission("invoices:read"), validate(invoiceIdParamSchema), (req, res, next) => controller.list(req, res, next));
router.post("/", requirePermission("invoices:write"), validate(createPaymentSchema), audit("CREATE"), (req, res, next) => controller.create(req, res, next));
router.delete("/:id", requirePermission("invoices:write"), validate(paymentIdParamSchema), audit("DELETE"), (req, res, next) => controller.delete(req, res, next));

module.exports = router;

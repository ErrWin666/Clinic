const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const { validate } = require("../middlewares/validate");
const audit = require("../middlewares/audit");
const Joi = require("joi");

const userController = new UserController();

const createUserSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(8).max(100).pattern(/[A-Z]/).pattern(/[a-z]/).pattern(/[0-9]/).required(),
    role: Joi.string().valid("admin", "doctor", "receptionist", "viewer").required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateUserSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(50),
    role: Joi.string().valid("admin", "doctor", "receptionist", "viewer"),
    password: Joi.string().min(8).max(100).pattern(/[A-Z]/).pattern(/[a-z]/).pattern(/[0-9]/),
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
});

const idParamSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({}),
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
});

router.use(auth);

router.get("/", requirePermission("users:read"), (req, res, next) => userController.list(req, res, next));
router.get("/:id", requirePermission("users:read"), validate(idParamSchema), (req, res, next) => userController.getById(req, res, next));
router.post("/", requirePermission("users:write"), validate(createUserSchema), audit("CREATE"), (req, res, next) => userController.create(req, res, next));
router.put("/:id", requirePermission("users:write"), validate(updateUserSchema), audit("UPDATE"), (req, res, next) => userController.update(req, res, next));
router.delete("/:id", requirePermission("users:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => userController.delete(req, res, next));

module.exports = router;

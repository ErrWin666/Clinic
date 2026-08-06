const BaseController = require("./BaseController");
const { User } = require("../models");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const ENUMS = require("../constants/enums");

class UserController extends BaseController {
  async list(req, res, next) {
    try {
      const users = await User.findAll({
        attributes: ["id", "username", "role", "isAdmin", "profileImage", "createdAt", "updatedAt"],
        order: [["createdAt", "ASC"]],
      });
      return this.sendSuccess(res, users, "Users retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const user = await User.findByPk(id, {
        attributes: ["id", "username", "role", "isAdmin", "profileImage", "createdAt", "updatedAt"],
      });
      if (!user) {
        throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
      }
      return this.sendSuccess(res, user, "User retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { username, password, role } = req.body;
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        throw new CustomError("Username already exists", "DUPLICATE_USERNAME", 409);
      }
      if (!ENUMS.USER_ROLE.includes(role)) {
        throw new CustomError("Invalid role", "VALIDATION_ERROR", 400);
      }
      const user = await User.create({ username, password, role, isAdmin: role === "admin" });
      return this.sendSuccess(
        res,
        { id: user.id, username: user.username, role: user.role, isAdmin: user.isAdmin },
        "User created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const { username, role, password } = req.body;
      const user = await User.findByPk(id);
      if (!user) {
        throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
      }
      if (username) user.username = username;
      if (role && ENUMS.USER_ROLE.includes(role)) {
        user.role = role;
        user.isAdmin = role === "admin";
      }
      if (password) user.password = password;
      await user.save();
      return this.sendSuccess(
        res,
        { id: user.id, username: user.username, role: user.role, isAdmin: user.isAdmin },
        "User updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      if (id === req.user.id) {
        throw new CustomError("Cannot delete your own account", "SELF_DELETE_FORBIDDEN", 400);
      }
      const user = await User.findByPk(id);
      if (!user) {
        throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
      }
      if (user.isAdmin) {
        const adminCount = await User.count({ where: { isAdmin: true } });
        if (adminCount <= 1) {
          throw new CustomError("Cannot delete the last admin account", "LAST_ADMIN_FORBIDDEN", 400);
        }
      }
      await user.destroy();
      return this.sendSuccess(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;

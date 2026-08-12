const BaseController = require("./BaseController");
const AuthService = require("../services/AuthService");
const authConfig = require("../config/auth");
const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");
const { Notification } = require("../models");

class AuthController extends BaseController {
  constructor() {
    super();
    this.authService = new AuthService();
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await this.authService.login(username, password);

      res.cookie("accessToken", result.accessToken, authConfig.cookieOptions);
      res.cookie("refreshToken", result.refreshToken, authConfig.cookieOptions);

      await Notification.findOrCreate({
        where: { type: "welcome", entityId: result.user.id, entityType: "User" },
        defaults: {
          type: "welcome",
          title: `Welcome back, ${result.user.username}`,
          message: `You have successfully logged in to the system.`,
          entityId: result.user.id,
          entityType: "User",
        },
      });

      return this.sendSuccess(res, { user: result.user }, MESSAGES.AUTH.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new CustomError(MESSAGES.AUTH.SESSION_EXPIRED, "SESSION_EXPIRED", 401);
      }

      const result = await this.authService.refreshToken(refreshToken);
      res.cookie("accessToken", result.accessToken, authConfig.cookieOptions);
      if (result.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, authConfig.cookieOptions);
      }

      return this.sendSuccess(res, { user: result.user }, MESSAGES.AUTH.TOKEN_REFRESHED);
    } catch (error) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      next(error);
    }
  }

  async sessionStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await this.authService.getSessionStatus(userId);
      return this.sendSuccess(res, { user }, MESSAGES.AUTH.SESSION_ACTIVE);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return this.sendSuccess(res, null, MESSAGES.AUTH.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async recover(req, res, next) {
    try {
      const { username, recoveryCode, newPassword } = req.body;
      const result = await this.authService.recoverPassword(username, recoveryCode, newPassword);
      return this.sendSuccess(res, result, MESSAGES.AUTH.RECOVERY_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async recoverViaFile(req, res, next) {
    try {
      // localhost-only guard
      const ip = req.ip || req.socket?.remoteAddress || "";
      const normalized = ip.replace(/^::ffff:/, "");
      if (normalized !== "127.0.0.1" && normalized !== "::1" && normalized !== "localhost") {
        return res.status(403).json({
          success: false,
          error: { code: "RECOVERY_FILE_UNAVAILABLE", message: MESSAGES.AUTH.RECOVERY_FILE_UNAVAILABLE },
        });
      }
      const { username, newPassword } = req.body;
      const result = await this.authService.recoverViaFile(username, newPassword);
      return this.sendSuccess(res, result, MESSAGES.AUTH.RECOVERY_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async regenerateRecoveryCode(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await this.authService.regenerateRecoveryCode(userId);
      return this.sendSuccess(res, result, MESSAGES.AUTH.RECOVERY_CODE_REGENERATED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;

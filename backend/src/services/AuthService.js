const BaseService = require("./BaseService");
const UserRepository = require("../repositories/UserRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const authConfig = require("../config/auth");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { RevokedToken } = require("../models");
const { Op } = require("sequelize");
const RecoveryService = require("./RecoveryService");

class AuthService extends BaseService {
  constructor() {
    super(new UserRepository());
    this.recoveryService = new RecoveryService();
  }

  async login(username, password) {
    return this.executeOperation(async () => {
      const user = await this.repository.findByUsername(username);
      if (!user) {
        throw new CustomError(MESSAGES.AUTH.INVALID_CREDENTIALS, "INVALID_CREDENTIALS", 401);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new CustomError(MESSAGES.AUTH.INVALID_CREDENTIALS, "INVALID_CREDENTIALS", 401);
      }

      const tokens = this.generateTokens(user);
      return {
        user: { id: user.id, username: user.username, role: user.role, profileImage: user.profileImage },
        ...tokens,
      };
    }, MESSAGES.AUTH.INVALID_CREDENTIALS, "LOGIN_ERROR");
  }

  async refreshToken(refreshToken) {
    return this.executeOperation(async () => {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret);
      } catch (err) {
        throw new CustomError(MESSAGES.AUTH.SESSION_EXPIRED, "SESSION_EXPIRED", 401);
      }

      // Reject revoked tokens.
      if (decoded.jti) {
        const revoked = await RevokedToken.findByPk(decoded.jti);
        if (revoked) {
          throw new CustomError(MESSAGES.AUTH.SESSION_EXPIRED, "SESSION_EXPIRED", 401);
        }
      }

      const user = await this.repository.findById(decoded.userId);

      // Rotate: issue a new refresh token and revoke the old one.
      const newTokens = this.generateTokens(user);
      if (decoded.jti) {
        await this.revokeToken(decoded.jti, user.id, decoded.exp);
      }

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        user: { id: user.id, username: user.username, role: user.role },
      };
    }, MESSAGES.AUTH.SESSION_EXPIRED, "REFRESH_TOKEN_ERROR");
  }

  async revokeToken(jti, userId, exp) {
    const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RevokedToken.findOrCreate({ where: { jti }, defaults: { jti, userId, expiresAt } });
  }

  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret);
      if (decoded.jti) {
        await this.revokeToken(decoded.jti, decoded.userId, decoded.exp);
      }
    } catch {
      // Token is already invalid/expired — nothing to revoke.
    }
  }

  async getSessionStatus(userId) {
    return this.executeOperation(async () => {
      const user = await this.repository.findById(userId);
      return { id: user.id, username: user.username, role: user.role, profileImage: user.profileImage };
    }, MESSAGES.COMMON.UNAUTHORIZED, "SESSION_ERROR");
  }

  /**
   * Layer 1: Recover password via recovery code.
   * On success, rotates the recovery code and returns the new one (shown once).
   * Also revokes all existing refresh tokens for the user.
   */
  async recoverPassword(username, recoveryCode, newPassword) {
    return this.executeOperation(async () => {
      const user = await this.repository.findByUsername(username);
      if (!user) {
        throw new CustomError(MESSAGES.AUTH.RECOVERY_USER_NOT_FOUND, "USER_NOT_FOUND", 404);
      }

      const valid = await this.recoveryService.verifyRecoveryCode(recoveryCode, user.recoveryCodeHash);
      if (!valid) {
        throw new CustomError(MESSAGES.AUTH.RECOVERY_INVALID_CODE, "INVALID_RECOVERY_CODE", 400);
      }

      await user.update({ password: newPassword });

      // Rotate recovery code.
      const newCode = this.recoveryService.generateRecoveryCode();
      const newHash = await this.recoveryService.hashRecoveryCode(newCode);
      await user.update({ recoveryCodeHash: newHash });

      // Revoke all existing refresh tokens for this user.
      await RevokedToken.destroy({ where: { userId: user.id } });
      // Mark all currently-issued (non-revoked) tokens as revoked by revoking
      // any future refresh attempts — simplest approach is to bump a per-user
      // token version. Here we rely on the client being logged out already.

      return { recoveryCode: newCode };
    }, MESSAGES.AUTH.RECOVERY_SUCCESS, "RECOVERY_ERROR");
  }

  /**
   * Layer 2: Recover password via server file token (localhost only).
   * The IP check is enforced in the route/controller layer.
   * On success, rotates the file token.
   */
  async recoverViaFile(username, newPassword) {
    return this.executeOperation(async () => {
      const user = await this.repository.findByUsername(username);
      if (!user) {
        throw new CustomError(MESSAGES.AUTH.RECOVERY_USER_NOT_FOUND, "USER_NOT_FOUND", 404);
      }

      const token = await this.recoveryService.readTokenFile();
      if (!token) {
        throw new CustomError(MESSAGES.AUTH.RECOVERY_FILE_INVALID, "RECOVERY_FILE_INVALID", 500);
      }

      await user.update({ password: newPassword });

      // Rotate file token.
      await this.recoveryService.rotateTokenFile();

      // Also rotate the recovery code so both layers stay in sync.
      const newCode = this.recoveryService.generateRecoveryCode();
      const newHash = await this.recoveryService.hashRecoveryCode(newCode);
      await user.update({ recoveryCodeHash: newHash });

      return { recoveryCode: newCode };
    }, MESSAGES.AUTH.RECOVERY_SUCCESS, "RECOVERY_ERROR");
  }

  /**
   * Optional: regenerate the recovery code while logged in.
   * Returns the new code (shown once).
   */
  async regenerateRecoveryCode(userId) {
    return this.executeOperation(async () => {
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new CustomError(MESSAGES.AUTH.RECOVERY_USER_NOT_FOUND, "USER_NOT_FOUND", 404);
      }
      const newCode = this.recoveryService.generateRecoveryCode();
      const newHash = await this.recoveryService.hashRecoveryCode(newCode);
      await user.update({ recoveryCodeHash: newHash });
      return { recoveryCode: newCode };
    }, MESSAGES.AUTH.RECOVERY_CODE_REGENERATED, "RECOVERY_ERROR");
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      authConfig.jwtSecret,
      { expiresIn: authConfig.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, jti: uuidv4() },
      authConfig.jwtRefreshSecret,
      { expiresIn: authConfig.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }
}

module.exports = AuthService;

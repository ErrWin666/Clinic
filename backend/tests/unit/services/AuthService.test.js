const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const AuthService = require("../../../src/services/AuthService");
const CustomError = require("../../../src/utils/CustomError");

describe("AuthService", () => {
  let authService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    authService = new AuthService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("login", () => {
    it("should login with valid credentials", async () => {
      const result = await authService.login("admin", "admin123");
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe("admin");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw 401 for invalid username", async () => {
      await expect(authService.login("nonexistent", "pass123")).rejects.toThrow(CustomError);
      try {
        await authService.login("nonexistent", "pass123");
      } catch (err) {
        expect(err.statusCode).toBe(401);
      }
    });

    it("should throw 401 for wrong password", async () => {
      await expect(authService.login("admin", "wrongpass")).rejects.toThrow(CustomError);
      try {
        await authService.login("admin", "wrongpass");
      } catch (err) {
        expect(err.statusCode).toBe(401);
      }
    });
  });

  describe("refreshToken", () => {
    it("should refresh a valid token", async () => {
      const loginResult = await authService.login("admin", "admin123");
      const refreshed = await authService.refreshToken(loginResult.refreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.user.username).toBe("admin");
    });

    it("should throw 401 for invalid refresh token", async () => {
      await expect(authService.refreshToken("invalid-token")).rejects.toThrow(CustomError);
      try {
        await authService.refreshToken("invalid-token");
      } catch (err) {
        expect(err.statusCode).toBe(401);
      }
    });
  });

  describe("getSessionStatus", () => {
    it("should return user for valid userId", async () => {
      const status = await authService.getSessionStatus(1);
      expect(status.username).toBe("admin");
    });
  });

  describe("refreshToken - revoked token", () => {
    it("should throw 401 for revoked token", async () => {
      const loginResult = await authService.login("admin", "admin123");
      // Revoke the token
      const { RevokedToken } = require("../../../src/models");
      const jwt = require("jsonwebtoken");
      const authConfig = require("../../../src/config/auth");
      const decoded = jwt.verify(loginResult.refreshToken, authConfig.jwtRefreshSecret);
      if (decoded.jti) {
        await RevokedToken.create({ jti: decoded.jti, userId: decoded.userId, expiresAt: new Date(Date.now() + 3600000) });
      }
      await expect(authService.refreshToken(loginResult.refreshToken)).rejects.toThrow(CustomError);
    });
  });

  describe("recoverViaFile", () => {
    it("should throw 404 for non-existent user", async () => {
      await expect(authService.recoverViaFile("nonexistent", "newpass123")).rejects.toThrow(CustomError);
    });
  });

  describe("regenerateRecoveryCode", () => {
    it("should regenerate recovery code for valid user", async () => {
      const result = await authService.regenerateRecoveryCode(1);
      expect(result.recoveryCode).toBeDefined();
      expect(result.recoveryCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });

    it("should throw 404 for non-existent user", async () => {
      await expect(authService.regenerateRecoveryCode(99999)).rejects.toThrow(CustomError);
      try {
        await authService.regenerateRecoveryCode(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });

    it("should throw 404 when findById returns null", async () => {
      jest.spyOn(authService.repository, "findById").mockResolvedValueOnce(null);
      await expect(authService.regenerateRecoveryCode(1)).rejects.toThrow();
    });
  });

  describe("recoverPassword", () => {
    it("should throw 404 for non-existent user", async () => {
      await expect(authService.recoverPassword("nonexistent", "CODE", "newpass")).rejects.toThrow(CustomError);
    });

    it("should throw 400 for invalid recovery code", async () => {
      await expect(authService.recoverPassword("admin", "INVALID-CODE", "newpass")).rejects.toThrow(CustomError);
    });

    it("should reset password with valid recovery code", async () => {
      // First regenerate to get a valid code
      const { recoveryCode } = await authService.regenerateRecoveryCode(1);
      const result = await authService.recoverPassword("admin", recoveryCode, "newpass123");
      expect(result.recoveryCode).toBeDefined();
      // Verify new password works
      const loginResult = await authService.login("admin", "newpass123");
      expect(loginResult.user).toBeDefined();
      // Reset password back for other tests
      const { recoveryCode: code2 } = await authService.regenerateRecoveryCode(1);
      await authService.recoverPassword("admin", code2, "admin123");
    });
  });

  describe("recoverViaFile", () => {
    it("should throw 404 for non-existent user", async () => {
      await expect(authService.recoverViaFile("nonexistent", "newpass123")).rejects.toThrow(CustomError);
    });

    it("should recover via file token when token exists", async () => {
      const RecoveryService = require("../../../src/services/RecoveryService");
      const recoveryService = new RecoveryService();
      const token = recoveryService.generateFileToken();
      await recoveryService.writeTokenFile(token);
      const result = await authService.recoverViaFile("admin", "filepass123");
      expect(result.recoveryCode).toBeDefined();
      // Verify new password works
      const loginResult = await authService.login("admin", "filepass123");
      expect(loginResult.user).toBeDefined();
      // Reset password back
      const { recoveryCode } = await authService.regenerateRecoveryCode(1);
      await authService.recoverPassword("admin", recoveryCode, "admin123");
    });

    it("should throw 500 when token file is missing", async () => {
      const fs = require("fs");
      const path = require("path");
      const config = require("../../../src/config");
      const tokenPath = path.resolve(config.recovery.tokenPath);
      if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
      await expect(authService.recoverViaFile("admin", "newpass")).rejects.toThrow(CustomError);
    });
  });

  describe("logout", () => {
    it("should logout with valid token", async () => {
      const loginResult = await authService.login("admin", "admin123");
      await authService.logout(loginResult.refreshToken);
      // Token should now be revoked
      await expect(authService.refreshToken(loginResult.refreshToken)).rejects.toThrow(CustomError);
    });

    it("should handle null token gracefully", async () => {
      await authService.logout(null);
      // Should not throw
    });

    it("should handle invalid token gracefully", async () => {
      await authService.logout("invalid-token");
      // Should not throw
    });
  });
});

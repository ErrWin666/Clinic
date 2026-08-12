const AuthController = require("../../../src/controllers/AuthController");
const CustomError = require("../../../src/utils/CustomError");

jest.mock("../../../src/models", () => ({
  Notification: {
    findOrCreate: jest.fn().mockResolvedValue([{ id: 1 }, false]),
  },
}));

describe("AuthController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new AuthController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    req = { body: {}, cookies: {}, user: { id: 1, role: "admin" } };
  });

  describe("login", () => {
    it("should login successfully and set cookies", async () => {
      req.body = { username: "admin", password: "pass123" };
      jest.spyOn(controller.authService, "login").mockResolvedValue({
        user: { id: 1, username: "admin", role: "admin" },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      await controller.login(req, res, next);
      expect(res.cookie).toHaveBeenCalledWith("accessToken", "access-token", expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on login error", async () => {
      req.body = { username: "admin", password: "wrong" };
      jest.spyOn(controller.authService, "login").mockRejectedValue(
        new CustomError("Invalid credentials", "INVALID_CREDENTIALS", 401)
      );
      await controller.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("refreshToken", () => {
    it("should call next with CustomError if no refresh token", async () => {
      req.cookies = {};
      await controller.refreshToken(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });

    it("should refresh token and set new cookie", async () => {
      req.cookies = { refreshToken: "valid-refresh" };
      jest.spyOn(controller.authService, "refreshToken").mockResolvedValue({
        user: { id: 1, username: "admin" },
        accessToken: "new-access",
      });
      await controller.refreshToken(req, res, next);
      expect(res.cookie).toHaveBeenCalledWith("accessToken", "new-access", expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should clear cookies on refresh error", async () => {
      req.cookies = { refreshToken: "invalid" };
      jest.spyOn(controller.authService, "refreshToken").mockRejectedValue(new Error("Invalid token"));
      await controller.refreshToken(req, res, next);
      expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("sessionStatus", () => {
    it("should return user session", async () => {
      jest.spyOn(controller.authService, "getSessionStatus").mockResolvedValue({ id: 1, username: "admin" });
      await controller.sessionStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.authService, "getSessionStatus").mockRejectedValue(new Error("fail"));
      await controller.sessionStatus(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("logout", () => {
    it("should clear all cookies", async () => {
      await controller.logout(req, res, next);
      expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
      expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on logout error", async () => {
      req.cookies = { refreshToken: "some-token" };
      jest.spyOn(controller.authService, "logout").mockRejectedValue(new Error("Logout fail"));
      await controller.logout(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("recover", () => {
    it("should recover password successfully", async () => {
      req.body = { username: "admin", recoveryCode: "123456", newPassword: "newpass123" };
      jest.spyOn(controller.authService, "recoverPassword").mockResolvedValue({ success: true });
      await controller.recover(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on recover error", async () => {
      req.body = { username: "admin", recoveryCode: "wrong", newPassword: "newpass" };
      jest.spyOn(controller.authService, "recoverPassword").mockRejectedValue(new Error("Recovery fail"));
      await controller.recover(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("recoverViaFile", () => {
    it("should reject non-localhost requests", async () => {
      req.ip = "192.168.1.1";
      req.socket = { remoteAddress: "192.168.1.1" };
      await controller.recoverViaFile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should recover via file from localhost", async () => {
      req.ip = "127.0.0.1";
      req.body = { username: "admin", newPassword: "newpass123" };
      jest.spyOn(controller.authService, "recoverViaFile").mockResolvedValue({ success: true });
      await controller.recoverViaFile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on recoverViaFile error", async () => {
      req.ip = "::1";
      req.body = { username: "admin", newPassword: "newpass" };
      jest.spyOn(controller.authService, "recoverViaFile").mockRejectedValue(new Error("File recovery fail"));
      await controller.recoverViaFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("regenerateRecoveryCode", () => {
    it("should regenerate recovery code successfully", async () => {
      jest.spyOn(controller.authService, "regenerateRecoveryCode").mockResolvedValue({ recoveryCode: "123456" });
      await controller.regenerateRecoveryCode(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on regenerate error", async () => {
      jest.spyOn(controller.authService, "regenerateRecoveryCode").mockRejectedValue(new Error("Regen fail"));
      await controller.regenerateRecoveryCode(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

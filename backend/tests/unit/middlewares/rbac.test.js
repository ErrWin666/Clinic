const { requirePermission, hasPermission, PERMISSIONS } = require("../../../src/middlewares/rbac");
const CustomError = require("../../../src/utils/CustomError");

describe("RBAC middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 1, role: "admin" } };
    res = {};
    next = jest.fn();
  });

  describe("hasPermission", () => {
    it("should return true for admin with any permission", () => {
      expect(hasPermission("admin", "anything:write")).toBe(true);
    });

    it("should return true for role with exact permission", () => {
      expect(hasPermission("doctor", "patients:read")).toBe(true);
    });

    it("should return false for role without permission", () => {
      expect(hasPermission("viewer", "patients:write")).toBe(false);
    });

    it("should return false for unknown role", () => {
      expect(hasPermission("unknown", "patients:read")).toBe(false);
    });

    it("should return false for undefined role", () => {
      expect(hasPermission(undefined, "patients:read")).toBe(false);
    });
  });

  describe("requirePermission", () => {
    it("should call next for admin with any permission", () => {
      const middleware = requirePermission("suppliers:delete");
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next for doctor with matching permission", () => {
      req.user.role = "doctor";
      const middleware = requirePermission("patients:write");
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should return 401 when no user on request", () => {
      req.user = undefined;
      const middleware = requirePermission("patients:read");
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it("should return 403 when role lacks permission", () => {
      req.user.role = "viewer";
      const middleware = requirePermission("patients:write");
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it("should return 403 for unknown role", () => {
      req.user.role = "unknown";
      const middleware = requirePermission("patients:read");
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });
  });

  describe("PERMISSIONS constant", () => {
    it("should have admin with wildcard", () => {
      expect(PERMISSIONS.admin).toContain("*");
    });

    it("should have doctor with read and write for patients", () => {
      expect(PERMISSIONS.doctor).toContain("patients:read");
      expect(PERMISSIONS.doctor).toContain("patients:write");
    });

    it("should have viewer with only read permissions", () => {
      expect(PERMISSIONS.viewer).toContain("patients:read");
      expect(PERMISSIONS.viewer).not.toContain("patients:write");
    });
  });
});

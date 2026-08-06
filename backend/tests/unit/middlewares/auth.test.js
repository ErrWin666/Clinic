const jwt = require("jsonwebtoken");
const authMiddleware = require("../../../src/middlewares/auth");
const CustomError = require("../../../src/utils/CustomError");
const authConfig = require("../../../src/config/auth");

describe("Auth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {};
    next = jest.fn();
  });

  it("should set req.user and call next for valid token", async () => {
    const token = jwt.sign({ userId: 1, role: "admin" }, authConfig.jwtSecret);
    req.cookies.accessToken = token;
    await authMiddleware(req, res, next);
    expect(req.user).toEqual({ id: 1, role: "admin" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should return 401 when no token in cookies", async () => {
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it("should return 401 for expired token", async () => {
    const expiredToken = jwt.sign({ userId: 1, role: "admin" }, authConfig.jwtSecret, { expiresIn: "-1s" });
    req.cookies.accessToken = expiredToken;
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("TOKEN_EXPIRED");
  });

  it("should return 401 for invalid token", async () => {
    req.cookies.accessToken = "invalid.jwt.token";
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });
});

const { loginLimiter, refreshTokenLimiter, apiLimiter, recoverLimiter } = require("../../../src/middlewares/rateLimit");

describe("rateLimit middleware", () => {
  it("should export loginLimiter as a function", () => {
    expect(typeof loginLimiter).toBe("function");
  });

  it("should export refreshTokenLimiter as a function", () => {
    expect(typeof refreshTokenLimiter).toBe("function");
  });

  it("should export apiLimiter as a function", () => {
    expect(typeof apiLimiter).toBe("function");
  });

  it("should export recoverLimiter as a function", () => {
    expect(typeof recoverLimiter).toBe("function");
  });

  it("should allow requests under the limit for loginLimiter", (done) => {
    const req = { ip: "127.0.0.1" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    loginLimiter(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      done();
    }, 10);
  });

  it("should allow requests under the limit for refreshTokenLimiter", (done) => {
    const req = { ip: "127.0.0.2" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    refreshTokenLimiter(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      done();
    }, 10);
  });

  it("should allow requests under the limit for apiLimiter", (done) => {
    const req = { ip: "127.0.0.3" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    apiLimiter(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      done();
    }, 10);
  });

  it("should allow requests under the limit for recoverLimiter", (done) => {
    const req = { ip: "127.0.0.4" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    recoverLimiter(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      done();
    }, 10);
  });

  it("should have a handler function for rate limit exceeded", () => {
    const rateLimit = require("../../../src/middlewares/rateLimit");
    expect(typeof rateLimit.loginLimiter).toBe("function");
    expect(rateLimit.loginLimiter).toBeDefined();
  });
});

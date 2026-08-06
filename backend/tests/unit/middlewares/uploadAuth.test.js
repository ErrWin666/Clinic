const uploadAuth = require("../../../src/middlewares/uploadAuth");
const CustomError = require("../../../src/utils/CustomError");

describe("uploadAuth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    next = jest.fn();
    res = {};
    req = { path: "", user: { role: "admin" } };
  });

  it("should allow admin access to /admin/ path", () => {
    req.path = "/admin/profile.png";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("should reject non-admin access to /admin/ path", () => {
    req.user = { role: "user" };
    req.path = "/admin/profile.png";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("should allow access to /patients/:id/ path", () => {
    req.path = "/patients/1/file.pdf";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("should allow access to /clinic/ path for any authenticated user", () => {
    req.user = { role: "user" };
    req.path = "/clinic/logo-123.png";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("should allow admin access to /clinic/ path", () => {
    req.path = "/clinic/logo-123.png";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("should reject access to root path without folder", () => {
    req.path = "/";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("should reject path traversal attempt", () => {
    req.path = "/../../etc/passwd";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("should reject encoded path traversal", () => {
    req.path = "/%2e%2e%2f%2e%2e%2fetc%2fpasswd";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("should reject access to patients folder without id", () => {
    req.path = "/patients";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("should reject access to unknown folder", () => {
    req.path = "/unknown/file.txt";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it("should handle URL-encoded paths", () => {
    req.path = "/patients/1/my%20file.pdf";
    uploadAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});

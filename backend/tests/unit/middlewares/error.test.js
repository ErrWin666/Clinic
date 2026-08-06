const { errorHandler, notFoundHandler } = require("../../../src/middlewares/error");
const CustomError = require("../../../src/utils/CustomError");

describe("error middleware", () => {
  let req, res, next;

  beforeEach(() => {
    next = jest.fn();
    req = { url: "/api/test", method: "GET" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("errorHandler", () => {
    it("should handle operational CustomError with correct status code", () => {
      const err = new CustomError("Not found", "NOT_FOUND", 404);
      err.isOperational = true;
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "NOT_FOUND", message: "Not found" }),
        })
      );
    });

    it("should handle non-operational error with 500", () => {
      const err = new Error("Something broke");
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "INTERNAL_ERROR" }),
        })
      );
    });

    it("should handle error without statusCode as 500", () => {
      const err = new Error("Random error");
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("notFoundHandler", () => {
    it("should return 404 with route info", () => {
      req.method = "POST";
      req.path = "/api/unknown";
      notFoundHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: "NOT_FOUND" }),
        })
      );
    });
  });
});

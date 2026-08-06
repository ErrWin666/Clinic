const BaseController = require("../../../src/controllers/BaseController");
const CustomError = require("../../../src/utils/CustomError");

describe("BaseController", () => {
  let res, next;

  beforeEach(() => {
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("validateId", () => {
    it("should return parsed id for valid integer", () => {
      expect(BaseController.validateId("5")).toBe(5);
    });

    it("should throw for non-numeric string", () => {
      expect(() => BaseController.validateId("abc")).toThrow(CustomError);
      expect(() => BaseController.validateId("abc")).toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it("should throw for zero", () => {
      expect(() => BaseController.validateId("0")).toThrow(CustomError);
    });

    it("should throw for negative number", () => {
      expect(() => BaseController.validateId("-5")).toThrow(CustomError);
    });

    it("should throw for NaN", () => {
      expect(() => BaseController.validateId(NaN)).toThrow(CustomError);
    });
  });

  describe("validateRequired", () => {
    it("should return true for defined non-empty value", () => {
      expect(BaseController.validateRequired({ name: "test" }, "name")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(BaseController.validateRequired({ name: undefined }, "name")).toBe(false);
    });

    it("should return false for null", () => {
      expect(BaseController.validateRequired({ name: null }, "name")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(BaseController.validateRequired({ name: "" }, "name")).toBe(false);
    });

    it("should return false for missing property", () => {
      expect(BaseController.validateRequired({}, "name")).toBe(false);
    });

    it("should return false for null object", () => {
      expect(BaseController.validateRequired(null, "name")).toBe(false);
    });

    it("should return true for zero", () => {
      expect(BaseController.validateRequired({ count: 0 }, "count")).toBe(true);
    });

    it("should return true for false", () => {
      expect(BaseController.validateRequired({ active: false }, "active")).toBe(true);
    });
  });

  describe("sendSuccess", () => {
    it("should send success response with default status 200", () => {
      BaseController.sendSuccess(res, { id: 1 }, "Success");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1 }, message: "Success" })
      );
    });

    it("should send success response with custom status", () => {
      BaseController.sendSuccess(res, { id: 1 }, "Created", 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("sendPaginated", () => {
    it("should send paginated response", () => {
      BaseController.sendPaginated(res, [1, 2], { totalItems: 2 }, "List");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [1, 2], pagination: { totalItems: 2 } })
      );
    });
  });

  describe("executeOperation", () => {
    it("should return result of successful operation", async () => {
      const fn = jest.fn().mockResolvedValue("result");
      const result = await BaseController.executeOperation(fn, "Error msg");
      expect(result).toBe("result");
    });

    it("should rethrow operational errors", async () => {
      const operationalError = new CustomError("Not found", "NOT_FOUND", 404);
      const fn = jest.fn().mockRejectedValue(operationalError);
      await expect(BaseController.executeOperation(fn, "Error")).rejects.toThrow(CustomError);
    });

    it("should wrap non-operational errors", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("Unexpected"));
      await expect(BaseController.executeOperation(fn, "Custom error")).rejects.toMatchObject({
        message: "Custom error",
        statusCode: 500,
      });
    });
  });

  describe("instance methods", () => {
    it("should delegate validateId to static", () => {
      const instance = new BaseController();
      expect(instance.validateId("5")).toBe(5);
    });

    it("should delegate validateRequired to static", () => {
      const instance = new BaseController();
      expect(instance.validateRequired({ x: "val" }, "x")).toBe(true);
    });

    it("should delegate sendSuccess to static", () => {
      const instance = new BaseController();
      instance.sendSuccess(res, "data", "msg");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should delegate sendPaginated to static", () => {
      const instance = new BaseController();
      instance.sendPaginated(res, [], {}, "msg");
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

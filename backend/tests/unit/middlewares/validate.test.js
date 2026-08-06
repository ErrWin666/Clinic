const { validate } = require("../../../src/middlewares/validate");
const CustomError = require("../../../src/utils/CustomError");

describe("validate middleware", () => {
  let req, res, next;

  beforeEach(() => {
    next = jest.fn();
    res = {};
    req = { body: {}, query: {}, params: {} };
  });

  it("should pass valid data and assign validated values", () => {
    const schema = {
      validate: jest.fn(() => ({
        value: { body: { name: "test" }, query: { page: 1 }, params: { id: 5 } },
        error: null,
      })),
    };
    validate(schema)(req, res, next);
    expect(req.body).toEqual({ name: "test" });
    expect(req.query).toEqual({ page: 1 });
    expect(req.params).toEqual({ id: 5 });
    expect(next).toHaveBeenCalledWith();
  });

  it("should assign only body when query/params are empty", () => {
    const schema = {
      validate: jest.fn(() => ({
        value: { body: { name: "test" }, query: {}, params: {} },
        error: null,
      })),
    };
    validate(schema)(req, res, next);
    expect(req.body).toEqual({ name: "test" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should not assign body when value.body is falsy", () => {
    const schema = {
      validate: jest.fn(() => ({
        value: { body: null, query: { page: 1 }, params: {} },
        error: null,
      })),
    };
    const originalBody = req.body;
    validate(schema)(req, res, next);
    expect(req.body).toBe(originalBody);
    expect(req.query).toEqual({ page: 1 });
    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with CustomError on validation failure", () => {
    const schema = {
      validate: jest.fn(() => ({
        value: null,
        error: {
          details: [
            { path: ["body", "name"], message: '"name" is required' },
            { path: ["body", "age"], message: '"age" must be a number' },
          ],
        },
      })),
    };
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.isOperational).toBe(true);
  });

  it("should use abortEarly false and stripUnknown true", () => {
    const schema = {
      validate: jest.fn(() => ({ value: {}, error: null })),
    };
    validate(schema)(req, res, next);
    expect(schema.validate).toHaveBeenCalledWith(
      expect.any(Object),
      { abortEarly: false, stripUnknown: true }
    );
  });
});

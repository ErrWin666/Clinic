const BaseService = require("../../../src/services/BaseService");
const CustomError = require("../../../src/utils/CustomError");

describe("BaseService", () => {
  let baseService;

  beforeEach(() => {
    baseService = new BaseService({});
  });

  describe("executeOperation", () => {
    it("should return the result when the operation succeeds", async () => {
      const result = await baseService.executeOperation(async () => 42);
      expect(result).toBe(42);
    });

    it("should re-throw CustomError as-is (operational errors)", async () => {
      const customErr = new CustomError("Not found", "NOT_FOUND", 404);
      await expect(
        baseService.executeOperation(async () => {
          throw customErr;
        }, "Failed message", "FAIL_CODE")
      ).rejects.toThrow("Not found");
    });

    it("should preserve statusCode and code on re-thrown CustomError", async () => {
      const customErr = new CustomError("Conflict", "CONFLICT", 409);
      try {
        await baseService.executeOperation(async () => {
          throw customErr;
        });
        fail("Should have thrown");
      } catch (err) {
        expect(err).toBe(customErr);
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe("CONFLICT");
        expect(err.isOperational).toBe(true);
      }
    });

    it("should wrap SequelizeUniqueConstraintError as 409 CustomError", async () => {
      const seqErr = new Error("Validation error");
      seqErr.name = "SequelizeUniqueConstraintError";
      await expect(
        baseService.executeOperation(async () => {
          throw seqErr;
        }, "Create failed", "CREATE_ERROR")
      ).rejects.toThrow("Duplicate entry already exists");
    });

    it("should return 409 status for SequelizeUniqueConstraintError", async () => {
      const seqErr = new Error("Validation error");
      seqErr.name = "SequelizeUniqueConstraintError";
      try {
        await baseService.executeOperation(async () => {
          throw seqErr;
        });
        fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CustomError);
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe("DUPLICATE_ENTRY");
      }
    });

    it("should wrap generic Error as 500 CustomError with provided message", async () => {
      await expect(
        baseService.executeOperation(async () => {
          throw new Error("Something broke");
        }, "Operation failed", "INTERNAL_ERROR")
      ).rejects.toThrow("Operation failed");
    });

    it("should set statusCode=500 and code for generic errors", async () => {
      try {
        await baseService.executeOperation(async () => {
          throw new Error("DB connection lost");
        }, "DB error", "DB_ERROR");
        fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CustomError);
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe("DB_ERROR");
      }
    });

    it("should use default errorMessage and errorCode when not provided", async () => {
      try {
        await baseService.executeOperation(async () => {
          throw new Error("fail");
        });
        fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CustomError);
        expect(err.message).toBe("Operation failed");
        expect(err.code).toBe("INTERNAL_ERROR");
        expect(err.statusCode).toBe(500);
      }
    });

    it("should handle async operations that return promises", async () => {
      const result = await baseService.executeOperation(async () => {
        return Promise.resolve("async value");
      });
      expect(result).toBe("async value");
    });

    it("should handle null return value", async () => {
      const result = await baseService.executeOperation(async () => null);
      expect(result).toBeNull();
    });

    it("should handle object return value", async () => {
      const obj = { id: 1, name: "test" };
      const result = await baseService.executeOperation(async () => obj);
      expect(result).toEqual(obj);
    });
  });
});

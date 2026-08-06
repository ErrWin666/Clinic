const ApiResponse = require("../../../src/utils/ApiResponse");
const { parsePagination, buildPaginationResponse } = require("../../../src/utils/pagination");
const CustomError = require("../../../src/utils/CustomError");

describe("ApiResponse", () => {
  describe("success", () => {
    it("should return success response with data and message", () => {
      const result = ApiResponse.success({ id: 1 }, "Created");
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1 });
      expect(result.message).toBe("Created");
    });

    it("should use default message when not provided", () => {
      const result = ApiResponse.success({ id: 1 });
      expect(result.message).toBe("Operation completed successfully");
    });

    it("should handle null data", () => {
      const result = ApiResponse.success(null);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("paginated", () => {
    it("should return paginated response", () => {
      const result = ApiResponse.paginated([1, 2], { totalItems: 2 }, "List");
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2]);
      expect(result.pagination).toEqual({ totalItems: 2 });
      expect(result.message).toBe("List");
    });

    it("should use default message", () => {
      const result = ApiResponse.paginated([], {});
      expect(result.message).toBe("Records retrieved successfully");
    });
  });

  describe("error", () => {
    it("should return error response with code and message", () => {
      const result = ApiResponse.error("NOT_FOUND", "Not found");
      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toBe("Not found");
    });

    it("should include details when provided", () => {
      const result = ApiResponse.error("VALIDATION_ERROR", "Invalid", { field: "name" });
      expect(result.error.details).toEqual({ field: "name" });
    });

    it("should not include details when null", () => {
      const result = ApiResponse.error("ERROR", "Failed");
      expect(result.error.details).toBeUndefined();
    });
  });
});

describe("parsePagination", () => {
  it("should parse valid page and pageSize", () => {
    const result = parsePagination({ page: "2", pageSize: "10" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.offset).toBe(10);
    expect(result.limit).toBe(10);
  });

  it("should use defaults when not provided", () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(20);
  });

  it("should enforce minimum page of 1", () => {
    const result = parsePagination({ page: "0" });
    expect(result.page).toBe(1);
  });

  it("should enforce minimum pageSize of 1", () => {
    const result = parsePagination({ pageSize: "1" });
    expect(result.pageSize).toBe(1);
  });

  it("should enforce maximum pageSize of 100", () => {
    const result = parsePagination({ pageSize: "500" });
    expect(result.pageSize).toBe(100);
  });

  it("should handle invalid string values", () => {
    const result = parsePagination({ page: "abc", pageSize: "xyz" });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("should handle negative values", () => {
    const result = parsePagination({ page: "-5", pageSize: "-10" });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
  });
});

describe("buildPaginationResponse", () => {
  it("should build response with correct totalPages", () => {
    const result = buildPaginationResponse(25, 1, 10);
    expect(result.totalItems).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it("should handle zero items", () => {
    const result = buildPaginationResponse(0, 1, 10);
    expect(result.totalPages).toBe(0);
  });

  it("should handle exact page boundary", () => {
    const result = buildPaginationResponse(20, 1, 10);
    expect(result.totalPages).toBe(2);
  });
});

describe("CustomError", () => {
  it("should create error with code and statusCode", () => {
    const err = new CustomError("Not found", "NOT_FOUND", 404);
    expect(err.message).toBe("Not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it("should default statusCode to 500", () => {
    const err = new CustomError("Server error", "INTERNAL");
    expect(err.statusCode).toBe(500);
  });
});

describe("displayId", () => {
  const { generateDisplayId, generateInvoiceDisplayId } = require("../../../src/utils/displayId");

  it("should throw after MAX_RETRIES for generateDisplayId", async () => {
    const mockModel = {
      findAll: jest.fn().mockResolvedValue([{ displayId: "APT-0001" }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, displayId: "APT-0002" }),
    };
    await expect(generateDisplayId(mockModel, "APT")).rejects.toThrow(CustomError);
  });

  it("should throw after MAX_RETRIES for generateInvoiceDisplayId", async () => {
    const mockModel = {
      findAll: jest.fn().mockResolvedValue([{ displayId: `INV-${new Date().getFullYear()}-0001` }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, displayId: `INV-${new Date().getFullYear()}-0002` }),
    };
    await expect(generateInvoiceDisplayId(mockModel)).rejects.toThrow(CustomError);
  });

  it("should generate displayId when no conflicts", async () => {
    const mockModel = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const result = await generateDisplayId(mockModel, "APT");
    expect(result).toBe("APT-0001");
  });

  it("should generate invoice displayId when no conflicts", async () => {
    const mockModel = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const result = await generateInvoiceDisplayId(mockModel);
    expect(result).toContain(`INV-${new Date().getFullYear()}-0001`);
  });
});

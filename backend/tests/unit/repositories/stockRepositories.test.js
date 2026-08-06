jest.mock("../../../src/models", () => ({
  Batch: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  StockMovement: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

jest.mock("../../../src/database", () => ({
  sequelize: {
    fn: jest.fn((fn, col) => ({ fn, col })),
    col: jest.fn((name) => ({ col: name })),
  },
}));

const BatchRepository = require("../../../src/repositories/BatchRepository");
const StockMovementRepository = require("../../../src/repositories/StockMovementRepository");
const { Batch, StockMovement } = require("../../../src/models");

describe("BatchRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new BatchRepository();
  });

  it("should find active batches by variant", async () => {
    Batch.findAll.mockResolvedValue([{ id: 1, quantity: 10 }]);
    const result = await repo.findActiveByVariant(1);
    expect(result.length).toBe(1);
    expect(Batch.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ productVariantId: 1, isActive: true }) })
    );
  });

  it("should find active batches by variant FEFO (expiry sorted)", async () => {
    Batch.findAll.mockResolvedValue([{ id: 1, expiryDate: "2027-01-01" }]);
    const result = await repo.findActiveByVariantFEFO(1);
    expect(result.length).toBe(1);
    expect(Batch.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [["expiryDate", "ASC"]] })
    );
  });

  it("should find active batches by variant FIFO (received sorted)", async () => {
    Batch.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await repo.findActiveByVariantFIFO(1);
    expect(result).toBeDefined();
    expect(Batch.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [["receivedDate", "ASC"]] })
    );
  });

  it("should find active batches by variant for average costing", async () => {
    Batch.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await repo.findActiveByVariantAverage(1);
    expect(result.length).toBe(2);
  });

  it("should find expiring soon batches", async () => {
    Batch.findAll.mockResolvedValue([{ id: 1, expiryDate: "2026-08-01" }]);
    const result = await repo.findExpiringSoon(30);
    expect(result.length).toBe(1);
    expect(Batch.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });

  it("should find expired batches", async () => {
    Batch.findAll.mockResolvedValue([{ id: 1, expiryDate: "2025-01-01" }]);
    const result = await repo.findExpired();
    expect(result.length).toBe(1);
  });

  it("should find by variant and batch number", async () => {
    Batch.findOne.mockResolvedValue({ id: 1, batchNumber: "B001" });
    const result = await repo.findByVariantAndBatchNumber(1, "B001");
    expect(result).toBeDefined();
    expect(Batch.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productVariantId: 1, batchNumber: "B001" } })
    );
  });
});

describe("StockMovementRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new StockMovementRepository();
  });

  it("should find by variant with pagination", async () => {
    StockMovement.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    const result = await repo.findByVariant(1, { offset: 0, limit: 10 });
    expect(result.count).toBe(1);
    expect(StockMovement.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productVariantId: 1 }, offset: 0, limit: 10 })
    );
  });

  it("should find by variant with custom order", async () => {
    StockMovement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    await repo.findByVariant(1, { order: [["id", "ASC"]] });
    expect(StockMovement.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [["id", "ASC"]] })
    );
  });

  it("should find by batch", async () => {
    StockMovement.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await repo.findByBatch(1);
    expect(result.length).toBe(1);
  });

  it("should find by reference", async () => {
    StockMovement.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await repo.findByReference("Invoice", 10);
    expect(result.length).toBe(1);
    expect(StockMovement.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { referenceType: "Invoice", referenceId: 10 } })
    );
  });

  it("should find by reference and type", async () => {
    StockMovement.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await repo.findByReferenceAndType("Invoice", 10, "out");
    expect(result.length).toBe(1);
    expect(StockMovement.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { referenceType: "Invoice", referenceId: 10, type: "out" } })
    );
  });

  it("should find movements by date range with filters", async () => {
    StockMovement.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await repo.findMovementsByDateRange("2026-01-01", "2026-12-31", {
      type: "out",
      reason: "sale",
      productVariantId: 1,
    });
    expect(result.length).toBe(1);
    expect(StockMovement.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "out",
          reason: "sale",
          productVariantId: 1,
        }),
      })
    );
  });

  it("should find movements by date range without filters", async () => {
    StockMovement.findAll.mockResolvedValue([]);
    await repo.findMovementsByDateRange("2026-01-01", "2026-12-31");
    expect(StockMovement.findAll).toHaveBeenCalled();
  });

  it("should search with filters", async () => {
    StockMovement.findAndCountAll.mockResolvedValue({ rows: [{ id: 1 }], count: 1 });
    const result = await repo.searchWithFilters({
      where: { type: "out" },
      offset: 0,
      limit: 20,
    });
    expect(result.count).toBe(1);
  });

  it("should search with filters and default order", async () => {
    StockMovement.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    await repo.searchWithFilters({ offset: 0, limit: 10 });
    expect(StockMovement.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, order: [["movementDate", "DESC"], ["createdAt", "DESC"]] })
    );
  });

  it("should sum quantity by variant", async () => {
    StockMovement.findOne.mockResolvedValue({ total: "150" });
    const result = await repo.sumQuantityByVariant(1);
    expect(result).toBe(150);
  });

  it("should return 0 when no movements exist for variant", async () => {
    StockMovement.findOne.mockResolvedValue(null);
    const result = await repo.sumQuantityByVariant(999);
    expect(result).toBe(0);
  });
});

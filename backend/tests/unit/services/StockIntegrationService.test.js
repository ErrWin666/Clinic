jest.mock("../../../src/models", () => ({
  StockMovement: { findAll: jest.fn(), count: jest.fn().mockResolvedValue(0) },
  Batch: { create: jest.fn() },
  InvoiceItem: { findAll: jest.fn() },
  ExamConsumableRule: { findAll: jest.fn() },
}));

jest.mock("../../../src/repositories/PackagingUnitRepository", () => {
  return jest.fn().mockImplementation(() => ({
    findByVariantAndName: jest.fn(),
  }));
});

jest.mock("../../../src/utils/money", () => ({
  multiplyQtyPrice: jest.fn((q, p) => q * p),
  sumMoney: jest.fn((arr) => arr.reduce((a, b) => a + b, 0)),
  convertToBase: jest.fn((qty, factor) => qty * factor),
}));

jest.mock("../../../src/utils/logger", () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

jest.mock("../../../src/constants/messages", () => ({
  STOCK_MOVEMENT: { INSUFFICIENT_STOCK: "Insufficient stock" },
}));

const StockIntegrationService = require("../../../src/services/stock/StockIntegrationService");
const { InvoiceItem, StockMovement, ExamConsumableRule, Batch } = require("../../../src/models");
const PackagingUnitRepository = require("../../../src/repositories/PackagingUnitRepository");

describe("StockIntegrationService", () => {
  let service, mockMovementService, mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMovementService = {
      selectBatchesForSale: jest.fn(),
      createMovement: jest.fn(),
    };
    mockTransaction = {};
    service = new StockIntegrationService(mockMovementService);
  });

  describe("processInvoiceSale", () => {
    it("should process invoice items and create stock movements", async () => {
      const items = [
        { productVariantId: 1, quantity: 5, unit: "piece", unitPrice: 100, update: jest.fn() },
      ];
      InvoiceItem.findAll.mockResolvedValue(items);
      service._packagingRepository.findByVariantAndName.mockResolvedValue(null);
      mockMovementService.selectBatchesForSale.mockResolvedValue([
        { batchId: 1, quantity: 5, unitCost: 50 },
      ]);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.processInvoiceSale(10, mockTransaction);

      expect(InvoiceItem.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ invoiceId: 10 }),
          transaction: mockTransaction,
        })
      );
      expect(mockMovementService.createMovement).toHaveBeenCalled();
      expect(items[0].update).toHaveBeenCalledWith(
        expect.objectContaining({ batchId: 1, costAmount: 250, baseQuantity: 5 }),
        { transaction: mockTransaction }
      );
    });

    it("should handle empty invoice items", async () => {
      InvoiceItem.findAll.mockResolvedValue([]);
      await service.processInvoiceSale(10, mockTransaction);
      expect(mockMovementService.createMovement).not.toHaveBeenCalled();
    });

    it("should skip stock deduction if already processed (idempotency)", async () => {
      const { StockMovement } = require("../../../src/models");
      StockMovement.count.mockResolvedValueOnce(3); // already has 3 sale movements
      const items = [{ productVariantId: 1, quantity: 5, unit: "piece", unitPrice: 100, update: jest.fn() }];
      InvoiceItem.findAll.mockResolvedValue(items);

      await service.processInvoiceSale(10, mockTransaction);

      expect(mockMovementService.createMovement).not.toHaveBeenCalled();
      expect(InvoiceItem.findAll).not.toHaveBeenCalled();
    });

    it("should use packaging unit factor for unit conversion", async () => {
      const items = [
        { productVariantId: 1, quantity: 2, unit: "box", unitPrice: 100, update: jest.fn() },
      ];
      InvoiceItem.findAll.mockResolvedValue(items);
      service._packagingRepository.findByVariantAndName.mockResolvedValue({ factor: 10 });
      mockMovementService.selectBatchesForSale.mockResolvedValue([
        { batchId: 1, quantity: 20, unitCost: 5 },
      ]);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.processInvoiceSale(10, mockTransaction);

      // 2 boxes * factor 10 = 20 base units
      expect(mockMovementService.selectBatchesForSale).toHaveBeenCalledWith(1, 20, { transaction: mockTransaction });
      expect(items[0].update).toHaveBeenCalledWith(
        expect.objectContaining({ baseQuantity: 20 }),
        { transaction: mockTransaction }
      );
    });
  });

  describe("processInvoiceReturn", () => {
    it("should create return movements for all sale movements", async () => {
      const movements = [
        { productVariantId: 1, batchId: 1, quantity: -5, unitCost: 50 },
      ];
      StockMovement.findAll.mockResolvedValue(movements);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.processInvoiceReturn(10, mockTransaction);

      expect(StockMovement.findAll).toHaveBeenCalledWith({
        where: { referenceType: "Invoice", referenceId: 10, type: "out", reason: "sale" },
        transaction: mockTransaction,
      });
      expect(mockMovementService.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: "in", quantity: 5, reason: "return" }),
        mockTransaction
      );
    });

    it("should handle no movements", async () => {
      StockMovement.findAll.mockResolvedValue([]);
      await service.processInvoiceReturn(10, mockTransaction);
      expect(mockMovementService.createMovement).not.toHaveBeenCalled();
    });

    it("should skip return if already processed (idempotency)", async () => {
      const { StockMovement } = require("../../../src/models");
      StockMovement.count.mockResolvedValueOnce(2); // already has 2 return movements
      await service.processInvoiceReturn(10, mockTransaction);
      expect(mockMovementService.createMovement).not.toHaveBeenCalled();
      expect(StockMovement.findAll).not.toHaveBeenCalled();
    });
  });

  describe("processExamConsumables", () => {
    it("should process exam consumable rules and create movements", async () => {
      const rules = [{ productVariantId: 1, quantity: 2 }];
      ExamConsumableRule.findAll.mockResolvedValue(rules);
      mockMovementService.selectBatchesForSale.mockResolvedValue([
        { batchId: 1, quantity: 2, unitCost: 10 },
      ]);
      mockMovementService.createMovement.mockResolvedValue({ id: 1 });

      const results = await service.processExamConsumables(5, "checkup", mockTransaction);

      expect(results.length).toBe(1);
      expect(mockMovementService.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "dispensing", referenceType: "EyeExamination", referenceId: 5 }),
        mockTransaction
      );
    });

    it("should handle insufficient stock gracefully", async () => {
      const rules = [{ productVariantId: 1, quantity: 2 }];
      ExamConsumableRule.findAll.mockResolvedValue(rules);
      const insufficientError = Object.assign(new Error("Insufficient stock"), { code: "INSUFFICIENT_STOCK" });
      mockMovementService.selectBatchesForSale.mockRejectedValue(insufficientError);

      const results = await service.processExamConsumables(5, "checkup", mockTransaction);
      expect(results).toEqual([]);
    });

    it("should re-throw non-insufficient-stock errors", async () => {
      const rules = [{ productVariantId: 1, quantity: 2 }];
      ExamConsumableRule.findAll.mockResolvedValue(rules);
      mockMovementService.selectBatchesForSale.mockRejectedValue(new Error("DB error"));

      await expect(service.processExamConsumables(5, "checkup", mockTransaction)).rejects.toThrow("DB error");
    });
  });

  describe("reverseExamConsumables", () => {
    it("should create return movements for exam consumables", async () => {
      const movements = [
        { productVariantId: 1, batchId: 1, quantity: -3, unitCost: 10 },
      ];
      StockMovement.findAll.mockResolvedValue(movements);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.reverseExamConsumables(5, mockTransaction);

      expect(mockMovementService.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: "in", quantity: 3, reason: "return", referenceType: "EyeExamination", referenceId: 5 }),
        mockTransaction
      );
    });

    it("should handle no movements to reverse", async () => {
      StockMovement.findAll.mockResolvedValue([]);
      await service.reverseExamConsumables(5, mockTransaction);
      expect(mockMovementService.createMovement).not.toHaveBeenCalled();
    });
  });

  describe("receivePurchaseOrderItem", () => {
    it("should create batch and stock movement for received PO item", async () => {
      const poItem = {
        productVariantId: 1,
        receivedQuantity: 10,
        receivedUnit: "box",
        unitCost: 50,
        purchaseOrderId: 5,
        batchNumber: "BATCH-001",
        expiryDate: "2027-01-01",
      };
      const mockBatch = { id: 1, reload: jest.fn().mockResolvedValue({ id: 1, quantity: 10 }) };
      Batch.create.mockResolvedValue(mockBatch);
      service._packagingRepository.findByVariantAndName.mockResolvedValue({ factor: 10 });
      mockMovementService.createMovement.mockResolvedValue({});

      const result = await service.receivePurchaseOrderItem(poItem, 1, 1, mockTransaction);

      expect(Batch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productVariantId: 1,
          batchNumber: "BATCH-001",
          initialQuantity: 100,
          unitCost: 50,
          supplierId: 1,
        }),
        { transaction: mockTransaction }
      );
      expect(mockMovementService.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: "in", quantity: 100, reason: "purchase" }),
        mockTransaction
      );
      expect(result).toBeDefined();
    });

    it("should use default batch number if not provided", async () => {
      const poItem = {
        productVariantId: 1,
        receivedQuantity: 5,
        unitCost: 10,
        purchaseOrderId: 5,
      };
      const mockBatch = { id: 1, reload: jest.fn().mockResolvedValue({ id: 1 }) };
      Batch.create.mockResolvedValue(mockBatch);
      service._packagingRepository.findByVariantAndName.mockResolvedValue(null);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.receivePurchaseOrderItem(poItem, 1, 1, mockTransaction);

      expect(Batch.create).toHaveBeenCalledWith(
        expect.objectContaining({ batchNumber: expect.stringContaining("PO-") }),
        { transaction: mockTransaction }
      );
    });

    it("should fallback to quantity when receivedQuantity not set", async () => {
      const poItem = {
        productVariantId: 1,
        quantity: 20,
        unitCost: 30,
        purchaseOrderId: 5,
        batchNumber: "BATCH-FB-001",
        expiryDate: "2027-06-01",
      };
      const mockBatch = { id: 1, reload: jest.fn().mockResolvedValue({ id: 1 }) };
      Batch.create.mockResolvedValue(mockBatch);
      service._packagingRepository.findByVariantAndName.mockResolvedValue(null);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.receivePurchaseOrderItem(poItem, 1, 1, mockTransaction);

      // Should use quantity (20) since receivedQuantity is not set
      expect(Batch.create).toHaveBeenCalledWith(
        expect.objectContaining({ initialQuantity: 20 }),
        { transaction: mockTransaction }
      );
    });

    it("should set expiryDate to null when not provided", async () => {
      const poItem = {
        productVariantId: 1,
        receivedQuantity: 5,
        unitCost: 10,
        purchaseOrderId: 5,
        batchNumber: "BATCH-NOEXP-001",
      };
      const mockBatch = { id: 1, reload: jest.fn().mockResolvedValue({ id: 1 }) };
      Batch.create.mockResolvedValue(mockBatch);
      service._packagingRepository.findByVariantAndName.mockResolvedValue(null);
      mockMovementService.createMovement.mockResolvedValue({});

      await service.receivePurchaseOrderItem(poItem, 1, 1, mockTransaction);

      expect(Batch.create).toHaveBeenCalledWith(
        expect.objectContaining({ expiryDate: null }),
        { transaction: mockTransaction }
      );
    });
  });
});

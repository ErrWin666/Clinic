jest.mock("../../../src/services/stock", () => {
  return jest.fn().mockImplementation(() => ({
    listMovements: jest.fn(),
    createMovement: jest.fn(),
    adjustStock: jest.fn(),
    recordDamage: jest.fn(),
    recordExpiry: jest.fn(),
    recordOpeningStock: jest.fn(),
    getInventoryStats: jest.fn(),
    checkAlerts: jest.fn(),
    getInventoryValuation: jest.fn(),
    getProfitLossReport: jest.fn(),
  }));
});

jest.mock("../../../src/database", () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    }),
  },
}));

const StockController = require("../../../src/controllers/StockController");
const CustomError = require("../../../src/utils/CustomError");

describe("StockController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new StockController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
  });

  describe("listMovements", () => {
    it("should return paginated movements", async () => {
      jest.spyOn(controller.stockService, "listMovements").mockResolvedValue({
        rows: [{ id: 1, type: "in" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.listMovements(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.stockService, "listMovements").mockRejectedValue(new Error("DB error"));
      await controller.listMovements(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("recordOpeningStock", () => {
    it("should record opening stock and return 201", async () => {
      req.body = { productVariantId: 1, quantity: 20, unitCost: 50, batchNumber: "B001" };
      jest.spyOn(controller.stockService, "recordOpeningStock").mockResolvedValue({
        batch: { id: 1 },
        movement: { id: 1, type: "in" },
      });
      await controller.recordOpeningStock(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.body = { productVariantId: 99999, quantity: 20, unitCost: 50 };
      jest.spyOn(controller.stockService, "recordOpeningStock").mockRejectedValue(
        new CustomError("Not found", "NOT_FOUND", 404)
      );
      await controller.recordOpeningStock(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("adjustStock", () => {
    it("should adjust stock and return 200", async () => {
      req.body = { productVariantId: 1, batchId: 1, newQuantity: 15, note: "Count" };
      jest.spyOn(controller.stockService, "adjustStock").mockResolvedValue({ id: 1, type: "adjust" });
      await controller.adjustStock(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("recordDamage", () => {
    it("should record damage and return 201", async () => {
      req.body = { batchId: 1, quantity: 5, note: "Broken" };
      jest.spyOn(controller.stockService, "recordDamage").mockResolvedValue({ id: 1, type: "out" });
      await controller.recordDamage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("recordExpiry", () => {
    it("should record expiry and return 201", async () => {
      req.body = { batchId: 1, note: "Expired" };
      jest.spyOn(controller.stockService, "recordExpiry").mockResolvedValue({ id: 1, type: "out" });
      await controller.recordExpiry(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getStats", () => {
    it("should return inventory stats", async () => {
      jest.spyOn(controller.stockService, "getInventoryStats").mockResolvedValue({
        totalProducts: 10,
        totalValue: 5000,
      });
      await controller.getStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("checkAlerts", () => {
    it("should return alerts", async () => {
      jest.spyOn(controller.stockService, "checkAlerts").mockResolvedValue({
        lowStock: [],
        outOfStock: [],
        expiringSoon: [],
      });
      await controller.checkAlerts(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should use daysAhead from query", async () => {
      req.query.daysAhead = "60";
      const spy = jest.spyOn(controller.stockService, "checkAlerts").mockResolvedValue({});
      await controller.checkAlerts(req, res, next);
      expect(spy).toHaveBeenCalledWith(60);
    });
  });

  describe("getValuation", () => {
    it("should return inventory valuation", async () => {
      jest.spyOn(controller.stockService, "getInventoryValuation").mockResolvedValue({
        totalValue: 10000,
        byMethod: { fifo: 5000, average: 5000 },
      });
      await controller.getValuation(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getVariantMovements", () => {
    it("should return movements for a variant", async () => {
      req.params.variantId = "1";
      jest.spyOn(controller.stockService, "listMovements").mockResolvedValue({
        rows: [{ id: 1 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.getVariantMovements(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid variantId", async () => {
      req.params.variantId = "invalid";
      await controller.getVariantMovements(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getBatchMovements", () => {
    it("should return movements for a batch", async () => {
      req.params.batchId = "1";
      jest.spyOn(controller.stockService, "listMovements").mockResolvedValue({
        rows: [{ id: 1 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.getBatchMovements(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid batchId", async () => {
      req.params.batchId = "abc";
      await controller.getBatchMovements(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("createMovement", () => {
    it("should create movement and return 201", async () => {
      req.body = { productVariantId: 1, batchId: 1, quantity: 10, type: "in" };
      jest.spyOn(controller.stockService, "createMovement").mockResolvedValue({ id: 1, type: "in" });
      await controller.createMovement(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on createMovement error", async () => {
      req.body = { productVariantId: 1, batchId: 1, quantity: 10, type: "in" };
      jest.spyOn(controller.stockService, "createMovement").mockRejectedValue(new Error("Create fail"));
      await controller.createMovement(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("adjustStock - error", () => {
    it("should call next on adjustStock error", async () => {
      req.body = { productVariantId: 1, batchId: 1, newQuantity: 15 };
      jest.spyOn(controller.stockService, "adjustStock").mockRejectedValue(new Error("Adjust fail"));
      await controller.adjustStock(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("recordDamage - error", () => {
    it("should call next on recordDamage error", async () => {
      req.body = { batchId: 1, quantity: 5 };
      jest.spyOn(controller.stockService, "recordDamage").mockRejectedValue(new Error("Damage fail"));
      await controller.recordDamage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("recordExpiry - error", () => {
    it("should call next on recordExpiry error", async () => {
      req.body = { batchId: 1 };
      jest.spyOn(controller.stockService, "recordExpiry").mockRejectedValue(new Error("Expiry fail"));
      await controller.recordExpiry(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getStats - error", () => {
    it("should call next on getStats error", async () => {
      jest.spyOn(controller.stockService, "getInventoryStats").mockRejectedValue(new Error("Stats fail"));
      await controller.getStats(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("checkAlerts - error", () => {
    it("should call next on checkAlerts error", async () => {
      jest.spyOn(controller.stockService, "checkAlerts").mockRejectedValue(new Error("Alerts fail"));
      await controller.checkAlerts(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getValuation - error", () => {
    it("should call next on getValuation error", async () => {
      jest.spyOn(controller.stockService, "getInventoryValuation").mockRejectedValue(new Error("Valuation fail"));
      await controller.getValuation(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getProfitLoss", () => {
    it("should return profit/loss report", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      jest.spyOn(controller.stockService, "getProfitLossReport").mockResolvedValue({
        revenue: 10000,
        cost: 5000,
        profit: 5000,
      });
      await controller.getProfitLoss(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on getProfitLoss error", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      jest.spyOn(controller.stockService, "getProfitLossReport").mockRejectedValue(new Error("Report fail"));
      await controller.getProfitLoss(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getVariantMovements - error", () => {
    it("should call next on listMovements error", async () => {
      req.params.variantId = "1";
      jest.spyOn(controller.stockService, "listMovements").mockRejectedValue(new Error("List fail"));
      await controller.getVariantMovements(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getBatchMovements - error", () => {
    it("should call next on listMovements error", async () => {
      req.params.batchId = "1";
      jest.spyOn(controller.stockService, "listMovements").mockRejectedValue(new Error("List fail"));
      await controller.getBatchMovements(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

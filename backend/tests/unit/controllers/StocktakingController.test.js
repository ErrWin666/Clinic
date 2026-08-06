const StocktakingController = require("../../../src/controllers/StocktakingController");
const CustomError = require("../../../src/utils/CustomError");

describe("StocktakingController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new StocktakingController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
  });

  describe("list", () => {
    it("should return paginated stocktakings", async () => {
      jest.spyOn(controller.stocktakingService, "list").mockResolvedValue({
        rows: [{ id: 1, status: "in_progress" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.stocktakingService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return stocktaking by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.stocktakingService, "getById").mockResolvedValue({ id: 1, items: [] });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("start", () => {
    it("should start stocktaking and return 201", async () => {
      req.body = { note: "Monthly count" };
      jest.spyOn(controller.stocktakingService, "start").mockResolvedValue({ id: 1, status: "in_progress" });
      await controller.start(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle missing body", async () => {
      req.body = undefined;
      jest.spyOn(controller.stocktakingService, "start").mockResolvedValue({ id: 1 });
      await controller.start(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on start error", async () => {
      jest.spyOn(controller.stocktakingService, "start").mockRejectedValue(new Error("Start fail"));
      await controller.start(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateCounts", () => {
    it("should update counts", async () => {
      req.params.id = "1";
      req.body = { items: [{ id: 1, countedQuantity: 10 }] };
      jest.spyOn(controller.stocktakingService, "updateCounts").mockResolvedValue({ id: 1, items: [] });
      await controller.updateCounts(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for completed stocktaking", async () => {
      req.params.id = "1";
      req.body = { items: [] };
      jest.spyOn(controller.stocktakingService, "updateCounts").mockRejectedValue(
        new CustomError("Already completed", "STOCKTAKING_COMPLETED", 400)
      );
      await controller.updateCounts(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.updateCounts(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should handle missing body items", async () => {
      req.params.id = "1";
      req.body = undefined;
      jest.spyOn(controller.stocktakingService, "updateCounts").mockResolvedValue({ id: 1 });
      await controller.updateCounts(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("complete", () => {
    it("should complete stocktaking", async () => {
      req.params.id = "1";
      jest.spyOn(controller.stocktakingService, "complete").mockResolvedValue({ id: 1, status: "completed" });
      await controller.complete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on complete error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.stocktakingService, "complete").mockRejectedValue(new Error("Complete fail"));
      await controller.complete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.complete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should handle missing user", async () => {
      req.params.id = "1";
      req.user = undefined;
      jest.spyOn(controller.stocktakingService, "complete").mockResolvedValue({ id: 1, status: "completed" });
      await controller.complete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("cancel", () => {
    it("should cancel stocktaking", async () => {
      req.params.id = "1";
      jest.spyOn(controller.stocktakingService, "cancel").mockResolvedValue({ id: 1, status: "cancelled" });
      await controller.cancel(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.cancel(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on cancel error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.stocktakingService, "cancel").mockRejectedValue(new Error("Cancel fail"));
      await controller.cancel(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

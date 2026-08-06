const PurchaseOrderController = require("../../../src/controllers/PurchaseOrderController");
const CustomError = require("../../../src/utils/CustomError");

describe("PurchaseOrderController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new PurchaseOrderController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
  });

  describe("list", () => {
    it("should return paginated POs", async () => {
      jest.spyOn(controller.purchaseOrderService, "list").mockResolvedValue({
        rows: [{ id: 1, displayId: "PO-0001" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.purchaseOrderService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return PO by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.purchaseOrderService, "getById").mockResolvedValue({ id: 1, items: [] });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create PO and return 201", async () => {
      req.body = { supplierId: 1, items: [{ productVariantId: 1, quantity: 5, unitCost: 10 }] };
      jest.spyOn(controller.purchaseOrderService, "create").mockResolvedValue({ id: 1, ...req.body });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.body = { supplierId: 99999, items: [] };
      jest.spyOn(controller.purchaseOrderService, "create").mockRejectedValue(
        new CustomError("Not found", "NOT_FOUND", 404)
      );
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("update", () => {
    it("should update PO", async () => {
      req.params.id = "1";
      req.body = { note: "Updated" };
      jest.spyOn(controller.purchaseOrderService, "update").mockResolvedValue({ id: 1, note: "Updated" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("receive", () => {
    it("should receive PO and return 200", async () => {
      req.params.id = "1";
      req.body = { items: [{ id: 1, receivedQuantity: 10 }] };
      jest.spyOn(controller.purchaseOrderService, "receive").mockResolvedValue({ id: 1, status: "received" });
      await controller.receive(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for already received PO", async () => {
      req.params.id = "1";
      req.body = { items: [] };
      jest.spyOn(controller.purchaseOrderService, "receive").mockRejectedValue(
        new CustomError("Already received", "PO_ALREADY_RECEIVED", 400)
      );
      await controller.receive(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("cancel", () => {
    it("should cancel PO", async () => {
      req.params.id = "1";
      jest.spyOn(controller.purchaseOrderService, "cancel").mockResolvedValue({ id: 1, status: "cancelled" });
      await controller.cancel(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for received PO", async () => {
      req.params.id = "1";
      jest.spyOn(controller.purchaseOrderService, "cancel").mockRejectedValue(
        new CustomError("Cannot cancel", "PO_RECEIVED", 400)
      );
      await controller.cancel(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });
});

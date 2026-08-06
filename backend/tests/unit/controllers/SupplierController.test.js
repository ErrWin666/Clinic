const SupplierController = require("../../../src/controllers/SupplierController");
const CustomError = require("../../../src/utils/CustomError");

describe("SupplierController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new SupplierController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
  });

  describe("list", () => {
    it("should return paginated suppliers", async () => {
      jest.spyOn(controller.supplierService, "list").mockResolvedValue({
        rows: [{ id: 1, name: "Supplier 1" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.supplierService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return supplier by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.supplierService, "getById").mockResolvedValue({ id: 1, name: "Test" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe("create", () => {
    it("should create supplier and return 201", async () => {
      req.body = { name: "New Supplier" };
      jest.spyOn(controller.supplierService, "create").mockResolvedValue({ id: 1, ...req.body });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    it("should update supplier", async () => {
      req.params.id = "1";
      req.body = { address: "New Address" };
      jest.spyOn(controller.supplierService, "update").mockResolvedValue({ id: 1, address: "New Address" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("delete", () => {
    it("should delete supplier", async () => {
      req.params.id = "1";
      jest.spyOn(controller.supplierService, "delete").mockResolvedValue({ isActive: false });
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next when supplier has balance", async () => {
      req.params.id = "1";
      jest.spyOn(controller.supplierService, "delete").mockRejectedValue(
        new CustomError("Has balance", "SUPPLIER_HAS_BALANCE", 400)
      );
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getStatement", () => {
    it("should return supplier statement", async () => {
      req.params.id = "1";
      jest.spyOn(controller.supplierService, "getStatement").mockResolvedValue({
        supplier: { id: 1 },
        transactions: [],
        currentBalance: 0,
      });
      await controller.getStatement(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("listPayments", () => {
    it("should list payments for a supplier", async () => {
      req.params.supplierId = "1";
      jest.spyOn(controller.paymentService, "listBySupplier").mockResolvedValue({
        rows: [{ id: 1, amount: 100 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.listPayments(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createPayment", () => {
    it("should create payment and return 201", async () => {
      req.params.supplierId = "1";
      req.body = { amount: 500, paymentDate: "2026-01-01", paymentMethod: "cash" };
      jest.spyOn(controller.paymentService, "create").mockResolvedValue({ id: 1, ...req.body });
      await controller.createPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next for invalid supplierId", async () => {
      req.params.supplierId = "invalid";
      await controller.createPayment(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });
});

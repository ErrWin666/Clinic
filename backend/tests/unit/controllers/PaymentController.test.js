const PaymentController = require("../../../src/controllers/PaymentController");

jest.mock("../../../src/models", () => ({
  Invoice: { findByPk: jest.fn() },
  Payment: { findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
}));

jest.mock("../../../src/database", () => ({
  sequelize: { transaction: jest.fn() },
}));

const { Invoice, Payment } = require("../../../src/models");
const { sequelize } = require("../../../src/database");

describe("PaymentController", () => {
  let controller, req, res, next;
  let mockTransaction;

  beforeEach(() => {
    controller = new PaymentController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe("list", () => {
    it("should return payments for an invoice", async () => {
      req.params.invoiceId = "1";
      Payment.findAll.mockResolvedValue([
        { id: 1, invoiceId: 1, amount: 100, paymentMethod: "cash" },
      ]);
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next for invalid invoice id", async () => {
      req.params.invoiceId = "invalid";
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.invoiceId = "1";
      Payment.findAll.mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("create", () => {
    it("should create a payment and update invoice status to paid", async () => {
      req.params.invoiceId = "1";
      req.body = { amount: 100, paymentMethod: "cash" };
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 0,
        totalAmount: 100,
        invoiceStatus: "unpaid",
        update: jest.fn(),
      });
      Payment.create.mockResolvedValue({ id: 1, invoiceId: 1, amount: 100 });
      await controller.create(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should set status to partially-paid for partial payment", async () => {
      req.params.invoiceId = "1";
      req.body = { amount: 50, paymentMethod: "cash" };
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 0,
        totalAmount: 100,
        invoiceStatus: "unpaid",
        update: jest.fn(),
      });
      Payment.create.mockResolvedValue({ id: 1, invoiceId: 1, amount: 50 });
      await controller.create(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should reject payment with non-positive amount", async () => {
      req.params.invoiceId = "1";
      req.body = { amount: 0, paymentMethod: "cash" };
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 0,
        totalAmount: 100,
        invoiceStatus: "unpaid",
        update: jest.fn(),
      });
      await controller.create(req, res, next);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject payment exceeding invoice total", async () => {
      req.params.invoiceId = "1";
      req.body = { amount: 150, paymentMethod: "cash" };
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 0,
        totalAmount: 100,
        invoiceStatus: "unpaid",
        update: jest.fn(),
      });
      await controller.create(req, res, next);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject payment for non-existent invoice", async () => {
      req.params.invoiceId = "999";
      req.body = { amount: 100 };
      Invoice.findByPk.mockResolvedValue(null);
      await controller.create(req, res, next);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject payment for cancelled invoice", async () => {
      req.params.invoiceId = "1";
      req.body = { amount: 100, paymentMethod: "cash" };
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 0,
        totalAmount: 100,
        invoiceStatus: "cancelled",
        update: jest.fn(),
      });
      await controller.create(req, res, next);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete a payment and update invoice", async () => {
      req.params.id = "1";
      Payment.findByPk.mockResolvedValue({
        id: 1,
        invoiceId: 1,
        amount: 50,
        destroy: jest.fn(),
      });
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 50,
        totalAmount: 100,
        invoiceStatus: "partially-paid",
        update: jest.fn(),
      });
      await controller.delete(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for non-existent payment", async () => {
      req.params.id = "999";
      Payment.findByPk.mockResolvedValue(null);
      await controller.delete(req, res, next);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should set invoice to paid when remaining amount still covers total", async () => {
      req.params.id = "1";
      Payment.findByPk.mockResolvedValue({
        id: 1,
        invoiceId: 1,
        amount: 50,
        destroy: jest.fn(),
      });
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 150,
        totalAmount: 100,
        invoiceStatus: "paid",
        update: jest.fn(),
      });
      await controller.delete(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should set invoice to unpaid when paidAmount becomes 0 or less", async () => {
      req.params.id = "1";
      Payment.findByPk.mockResolvedValue({
        id: 1,
        invoiceId: 1,
        amount: 50,
        destroy: jest.fn(),
      });
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 50,
        totalAmount: 100,
        invoiceStatus: "partially-paid",
        update: jest.fn(),
      });
      await controller.delete(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should set invoice to partially-paid when remaining amount is between 0 and total", async () => {
      req.params.id = "1";
      Payment.findByPk.mockResolvedValue({
        id: 1,
        invoiceId: 1,
        amount: 30,
        destroy: jest.fn(),
      });
      Invoice.findByPk.mockResolvedValue({
        id: 1,
        paidAmount: 80,
        totalAmount: 100,
        invoiceStatus: "partially-paid",
        update: jest.fn(),
      });
      await controller.delete(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
      const updateCall = Invoice.findByPk.mockResolvedValue.mock;
      // newPaidAmount = 80 - 30 = 50, which is > 0 and < 100, so partially-paid
    });

    it("should handle delete when invoice not found", async () => {
      req.params.id = "1";
      Payment.findByPk.mockResolvedValue({
        id: 1,
        invoiceId: 1,
        amount: 50,
        destroy: jest.fn(),
      });
      Invoice.findByPk.mockResolvedValue(null);
      await controller.delete(req, res, next);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it("should call next on error during delete", async () => {
      req.params.id = "1";
      Payment.findByPk.mockRejectedValue(new Error("DB error"));
      await controller.delete(req, res, next);
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

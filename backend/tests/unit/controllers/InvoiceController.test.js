const InvoiceController = require("../../../src/controllers/InvoiceController");
const CustomError = require("../../../src/utils/CustomError");

jest.mock("../../../src/models", () => ({
  Settings: { findOne: jest.fn().mockResolvedValue(null), findAll: jest.fn().mockResolvedValue([]) },
}));

jest.mock("../../../src/utils/pdf", () => ({
  generateInvoicePDF: jest.fn().mockReturnValue({
    output: jest.fn().mockReturnValue(new ArrayBuffer(100)),
  }),
}));

describe("InvoiceController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new InvoiceController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return paginated invoices", async () => {
      jest.spyOn(controller.invoiceService, "list").mockResolvedValue({
        rows: [{ id: 1, displayId: "INV-0001" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.invoiceService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return invoice by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.invoiceService, "getById").mockResolvedValue({ id: 1, displayId: "INV-0001" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create invoice and return 201", async () => {
      req.body = { patientId: 1, invoiceDate: "2026-01-01", items: [{ description: "Test", quantity: 1, unitPrice: 10 }] };
      jest.spyOn(controller.invoiceService, "create").mockResolvedValue({ id: 1, displayId: "INV-0001" });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    it("should update invoice", async () => {
      req.params.id = "1";
      req.body = { invoiceDate: "2026-02-01" };
      jest.spyOn(controller.invoiceService, "update").mockResolvedValue({ id: 1 });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for paid invoice update attempt", async () => {
      req.params.id = "1";
      jest.spyOn(controller.invoiceService, "update").mockRejectedValue(
        new CustomError("Paid", "INVOICE_PAID", 400)
      );
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("changeStatus", () => {
    it("should change invoice status", async () => {
      req.params.id = "1";
      req.body = { status: "paid" };
      jest.spyOn(controller.invoiceService, "changeStatus").mockResolvedValue({ id: 1, invoiceStatus: "paid" });
      await controller.changeStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("delete", () => {
    it("should delete invoice", async () => {
      req.params.id = "1";
      jest.spyOn(controller.invoiceService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for paid invoice delete attempt", async () => {
      req.params.id = "1";
      jest.spyOn(controller.invoiceService, "delete").mockRejectedValue(
        new CustomError("Paid", "INVOICE_PAID", 400)
      );
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("export", () => {
    it("should export invoices as CSV", async () => {
      jest.spyOn(controller.invoiceService, "list").mockResolvedValue({
        rows: [{ id: 1, displayId: "INV-0001", invoiceDate: "2026-01-01", patient: { fullName: "Test" }, invoiceStatus: "paid", totalAmount: 100 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.export(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(res.send).toHaveBeenCalled();
    });

    it("should export invoices with customerName fallback when no patient", async () => {
      jest.spyOn(controller.invoiceService, "list").mockResolvedValue({
        rows: [{ id: 2, displayId: "INV-0002", invoiceDate: "2026-01-01", patient: null, customerName: "Walk-in", invoiceStatus: "unpaid", totalAmount: 50 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.export(req, res, next);
      const sent = res.send.mock.calls[0][0];
      expect(sent).toContain("Walk-in");
    });

    it("should call next on export error", async () => {
      jest.spyOn(controller.invoiceService, "list").mockRejectedValue(new Error("fail"));
      await controller.export(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getPDF", () => {
    it("should generate and return PDF", async () => {
      req.params.id = "1";
      jest.spyOn(controller.invoiceService, "getById").mockResolvedValue({ id: 1, displayId: "INV-0001" });
      await controller.getPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.send).toHaveBeenCalled();
    });

    it("should use lang from query when provided", async () => {
      req.params.id = "1";
      req.query = { lang: "ar" };
      jest.spyOn(controller.invoiceService, "getById").mockResolvedValue({ id: 1, displayId: "INV-0001" });
      await controller.getPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.getPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on service error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.invoiceService, "getById").mockRejectedValue(new Error("fail"));
      await controller.getPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

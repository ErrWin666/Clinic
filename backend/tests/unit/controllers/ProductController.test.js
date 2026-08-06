const ProductController = require("../../../src/controllers/ProductController");
const CustomError = require("../../../src/utils/CustomError");

describe("ProductController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new ProductController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return paginated products", async () => {
      req.query = { page: 1, pageSize: 10 };
      jest.spyOn(controller.productService, "list").mockResolvedValue({
        rows: [{ id: 1, name: "Test Product" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [{ id: 1, name: "Test Product" }] })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.productService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return product by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.productService, "getById").mockResolvedValue({ id: 1, name: "Test" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1, name: "Test" } })
      );
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should call next for non-existent product", async () => {
      req.params.id = "999";
      jest.spyOn(controller.productService, "getById").mockRejectedValue(
        new CustomError("Not found", "NOT_FOUND", 404)
      );
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create product and return 201", async () => {
      req.body = { name: "New Product", category: "frames", costingMethod: "fifo" };
      jest.spyOn(controller.productService, "create").mockResolvedValue({ id: 1, ...req.body });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1, ...req.body } })
      );
    });

    it("should call next on validation error", async () => {
      req.body = { name: "Bad" };
      jest.spyOn(controller.productService, "create").mockRejectedValue(
        new CustomError("Invalid category", "VALIDATION_ERROR", 400)
      );
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("update", () => {
    it("should update product", async () => {
      req.params.id = "1";
      req.body = { description: "Updated" };
      jest.spyOn(controller.productService, "update").mockResolvedValue({ id: 1, description: "Updated" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("delete", () => {
    it("should delete product", async () => {
      req.params.id = "1";
      jest.spyOn(controller.productService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });
  });

  describe("listVariants", () => {
    it("should list variants for a product", async () => {
      req.params.productId = "1";
      jest.spyOn(controller.variantService, "list").mockResolvedValue({
        rows: [{ id: 1, name: "V1" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.listVariants(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createVariant", () => {
    it("should create variant and return 201", async () => {
      req.params.productId = "1";
      req.body = { name: "Standard", sku: "SKU-001", sellPrice: 100 };
      jest.spyOn(controller.variantService, "create").mockResolvedValue({ id: 1, ...req.body });
      await controller.createVariant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next for invalid productId", async () => {
      req.params.productId = "invalid";
      await controller.createVariant(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("updateVariant", () => {
    it("should update variant", async () => {
      req.params.variantId = "1";
      req.body = { sellPrice: 200 };
      jest.spyOn(controller.variantService, "update").mockResolvedValue({ id: 1, sellPrice: 200 });
      await controller.updateVariant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteVariant", () => {
    it("should delete variant", async () => {
      req.params.variantId = "1";
      jest.spyOn(controller.variantService, "delete").mockResolvedValue(true);
      await controller.deleteVariant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getByBarcode", () => {
    it("should return variant by barcode", async () => {
      req.params.barcode = "1234567890123";
      jest.spyOn(controller.packagingService, "findByBarcode").mockResolvedValue({
        variant: { id: 1, barcode: "1234567890123" },
        unit: null,
        factor: 1,
      });
      await controller.getByBarcode(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next for unknown barcode", async () => {
      req.params.barcode = "UNKNOWN";
      jest.spyOn(controller.packagingService, "findByBarcode").mockRejectedValue(
        new CustomError("Not found", "BARCODE_NOT_FOUND", 404)
      );
      await controller.getByBarcode(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });
});

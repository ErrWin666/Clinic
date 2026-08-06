const ProductBundleController = require("../../../src/controllers/ProductBundleController");

describe("ProductBundleController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new ProductBundleController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return paginated bundles", async () => {
      req.query = { page: 1, pageSize: 10 };
      jest.spyOn(controller.bundleService, "list").mockResolvedValue({
        rows: [{ id: 1, name: "Test Bundle" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.bundleService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return bundle by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.bundleService, "getById").mockResolvedValue({ id: 1, name: "Test Bundle" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.bundleService, "getById").mockRejectedValue(new Error("Not found"));
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("create", () => {
    it("should create a bundle", async () => {
      req.body = { name: "New Bundle", productId: 1 };
      jest.spyOn(controller.bundleService, "create").mockResolvedValue({ id: 1, name: "New Bundle" });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.body = { name: "New Bundle" };
      jest.spyOn(controller.bundleService, "create").mockRejectedValue(new Error("Validation error"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update a bundle", async () => {
      req.params.id = "1";
      req.body = { name: "Updated Bundle" };
      jest.spyOn(controller.bundleService, "update").mockResolvedValue({ id: 1, name: "Updated Bundle" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      req.body = { name: "Updated" };
      jest.spyOn(controller.bundleService, "update").mockRejectedValue(new Error("Not found"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete a bundle", async () => {
      req.params.id = "1";
      jest.spyOn(controller.bundleService, "delete").mockResolvedValue();
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.bundleService, "delete").mockRejectedValue(new Error("Not found"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("expand", () => {
    it("should expand a bundle into line items", async () => {
      req.params.id = "1";
      req.body = { quantity: 2 };
      jest.spyOn(controller.bundleService, "expandBundle").mockResolvedValue([
        { productVariantId: 1, quantity: 4, unitPrice: 50 },
      ]);
      await controller.expand(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should default quantity to 1 if not provided", async () => {
      req.params.id = "1";
      req.body = {};
      jest.spyOn(controller.bundleService, "expandBundle").mockResolvedValue([
        { productVariantId: 1, quantity: 2, unitPrice: 50 },
      ]);
      await controller.expand(req, res, next);
      expect(controller.bundleService.expandBundle).toHaveBeenCalledWith(1, 1);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.expand(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.bundleService, "expandBundle").mockRejectedValue(new Error("Not found"));
      await controller.expand(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

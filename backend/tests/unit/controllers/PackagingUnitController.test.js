const PackagingUnitController = require("../../../src/controllers/PackagingUnitController");

describe("PackagingUnitController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new PackagingUnitController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("listByVariant", () => {
    it("should return packaging units for a variant", async () => {
      req.params.variantId = "1";
      jest.spyOn(controller.packagingService, "listByVariant").mockResolvedValue([
        { id: 1, name: "Box of 10", factor: 10 },
      ]);
      await controller.listByVariant(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next for invalid variant id", async () => {
      req.params.variantId = "invalid";
      await controller.listByVariant(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.variantId = "1";
      jest.spyOn(controller.packagingService, "listByVariant").mockRejectedValue(new Error("DB error"));
      await controller.listByVariant(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("create", () => {
    it("should create a packaging unit", async () => {
      req.params.variantId = "1";
      req.body = { name: "Box of 10", factor: 10, sellPrice: 100 };
      jest.spyOn(controller.packagingService, "create").mockResolvedValue({ id: 1, name: "Box of 10" });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next for invalid variant id", async () => {
      req.params.variantId = "invalid";
      req.body = { name: "Box of 10" };
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next on error", async () => {
      req.params.variantId = "1";
      req.body = { name: "Box of 10" };
      jest.spyOn(controller.packagingService, "create").mockRejectedValue(new Error("Validation error"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update a packaging unit", async () => {
      req.params.id = "1";
      req.body = { sellPrice: 150 };
      jest.spyOn(controller.packagingService, "update").mockResolvedValue({ id: 1, sellPrice: 150 });
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
      req.body = { sellPrice: 150 };
      jest.spyOn(controller.packagingService, "update").mockRejectedValue(new Error("Not found"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete a packaging unit", async () => {
      req.params.id = "1";
      jest.spyOn(controller.packagingService, "delete").mockResolvedValue();
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
      jest.spyOn(controller.packagingService, "delete").mockRejectedValue(new Error("Not found"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

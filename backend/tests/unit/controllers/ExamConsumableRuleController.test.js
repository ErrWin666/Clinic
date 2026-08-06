const ExamConsumableRuleController = require("../../../src/controllers/ExamConsumableRuleController");

describe("ExamConsumableRuleController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new ExamConsumableRuleController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return paginated rules", async () => {
      req.query = { page: 1, pageSize: 10 };
      jest.spyOn(controller.ruleService, "list").mockResolvedValue({
        rows: [{ id: 1, examinationType: "checkup" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.ruleService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return rule by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.ruleService, "getById").mockResolvedValue({ id: 1, examinationType: "checkup" });
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
      jest.spyOn(controller.ruleService, "getById").mockRejectedValue(new Error("Not found"));
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("create", () => {
    it("should create a rule", async () => {
      req.body = { examinationType: "checkup", productVariantId: 1, quantity: 2 };
      jest.spyOn(controller.ruleService, "create").mockResolvedValue({ id: 1, examinationType: "checkup" });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.body = { examinationType: "checkup" };
      jest.spyOn(controller.ruleService, "create").mockRejectedValue(new Error("Validation error"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update a rule", async () => {
      req.params.id = "1";
      req.body = { quantity: 5 };
      jest.spyOn(controller.ruleService, "update").mockResolvedValue({ id: 1, quantity: 5 });
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
      req.body = { quantity: 5 };
      jest.spyOn(controller.ruleService, "update").mockRejectedValue(new Error("Not found"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete a rule", async () => {
      req.params.id = "1";
      jest.spyOn(controller.ruleService, "delete").mockResolvedValue();
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
      jest.spyOn(controller.ruleService, "delete").mockRejectedValue(new Error("Not found"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

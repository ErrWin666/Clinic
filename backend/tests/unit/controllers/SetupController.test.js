const SetupController = require("../../../src/controllers/SetupController");

describe("SetupController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new SetupController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { body: {} };
  });

  describe("checkAdmin", () => {
    it("should return admin check result", async () => {
      jest.spyOn(controller.setupService, "checkAdminExists").mockResolvedValue({ exists: false });
      await controller.checkAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.setupService, "checkAdminExists").mockRejectedValue(new Error("DB error"));
      await controller.checkAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("createAdmin", () => {
    it("should create admin and return 201", async () => {
      req.body = { username: "admin", password: "pass123" };
      jest.spyOn(controller.setupService, "createAdmin").mockResolvedValue({ id: 1, username: "admin" });
      await controller.createAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      req.body = { username: "admin" };
      jest.spyOn(controller.setupService, "createAdmin").mockRejectedValue(new Error("DB error"));
      await controller.createAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

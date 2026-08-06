const SystemController = require("../../../src/controllers/SystemController");

describe("SystemController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new SystemController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = {};
  });

  describe("getDiskSpace", () => {
    it("should return disk space info", async () => {
      jest.spyOn(controller.systemService, "getDiskSpace").mockResolvedValue({
        total: 1000000,
        free: 500000,
        used: 500000,
      });
      await controller.getDiskSpace(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.systemService, "getDiskSpace").mockRejectedValue(new Error("Disk error"));
      await controller.getDiskSpace(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

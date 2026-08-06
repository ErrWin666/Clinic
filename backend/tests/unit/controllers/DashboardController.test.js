const DashboardController = require("../../../src/controllers/DashboardController");

describe("DashboardController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new DashboardController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { query: {} };
  });

  describe("getStats", () => {
    it("should return dashboard stats", async () => {
      jest.spyOn(controller.dashboardService, "getStats").mockResolvedValue({
        totalPatients: 100,
        totalAppointments: 50,
        totalRevenue: 5000,
      });
      await controller.getStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should pass startDate and endDate from query", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      const spy = jest.spyOn(controller.dashboardService, "getStats").mockResolvedValue({});
      await controller.getStats(req, res, next);
      expect(spy).toHaveBeenCalledWith("2026-01-01", "2026-12-31");
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.dashboardService, "getStats").mockRejectedValue(new Error("DB error"));
      await controller.getStats(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

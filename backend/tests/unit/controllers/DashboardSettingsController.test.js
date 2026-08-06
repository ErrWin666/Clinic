const DashboardController = require("../../../src/controllers/DashboardController");
const SettingsController = require("../../../src/controllers/SettingsController");
const CustomError = require("../../../src/utils/CustomError");

describe("DashboardController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new DashboardController();
    next = jest.fn();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    req = { params: {}, query: {}, body: {} };
  });

  describe("getStats", () => {
    it("should return dashboard stats", async () => {
      req.query = { startDate: "2026-01-01", endDate: "2026-12-31" };
      jest.spyOn(controller.dashboardService, "getStats").mockResolvedValue({
        totalPatients: 100,
        totalRevenue: 50000,
      });
      await controller.getStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should handle missing query params", async () => {
      req.query = undefined;
      jest.spyOn(controller.dashboardService, "getStats").mockResolvedValue({});
      await controller.getStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.dashboardService, "getStats").mockRejectedValue(new Error("DB error"));
      await controller.getStats(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe("SettingsController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new SettingsController();
    next = jest.fn();
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    req = { params: {}, query: {}, body: {}, user: { id: 1 }, file: null };
  });

  describe("getAll", () => {
    it("should return all settings", async () => {
      jest.spyOn(controller.settingsService, "getAll").mockResolvedValue({ clinic: { name: "Test" } });
      await controller.getAll(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.settingsService, "getAll").mockRejectedValue(new Error("DB error"));
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update settings", async () => {
      req.body = { settings: { "clinic.name": "Updated Clinic" } };
      jest.spyOn(controller.settingsService, "update").mockResolvedValue({ clinic: { name: "Updated Clinic" } });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updateAdmin", () => {
    it("should update admin user", async () => {
      req.body = { fullName: "Updated Admin" };
      jest.spyOn(controller.settingsService, "updateAdmin").mockResolvedValue({ id: 1, fullName: "Updated Admin" });
      await controller.updateAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadAdminImage", () => {
    it("should upload admin image", async () => {
      req.file = { filename: "profile.jpg" };
      jest.spyOn(controller.settingsService, "uploadAdminImage").mockResolvedValue({ id: 1 });
      await controller.uploadAdminImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { profileImageUrl: "admin/profile.jpg" } })
      );
    });

    it("should call next when no file provided", async () => {
      req.file = undefined;
      await controller.uploadAdminImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe("uploadClinicLogo", () => {
    it("should upload clinic logo", async () => {
      req.file = { filename: "logo.png" };
      jest.spyOn(controller.settingsService, "uploadClinicLogo").mockResolvedValue({ logoUrl: "clinic/logo.png" });
      await controller.uploadClinicLogo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next when no file provided", async () => {
      req.file = null;
      await controller.uploadClinicLogo(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("deleteAdminImage", () => {
    it("should delete admin image", async () => {
      jest.spyOn(controller.settingsService, "deleteAdminImage").mockResolvedValue(true);
      await controller.deleteAdminImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteClinicLogo", () => {
    it("should delete clinic logo", async () => {
      jest.spyOn(controller.settingsService, "deleteClinicLogo").mockResolvedValue(true);
      await controller.deleteClinicLogo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

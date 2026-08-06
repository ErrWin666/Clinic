const SettingsController = require("../../../src/controllers/SettingsController");
const CustomError = require("../../../src/utils/CustomError");

describe("SettingsController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new SettingsController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { body: {}, user: { id: 1 }, file: null };
  });

  describe("getAll", () => {
    it("should return all settings", async () => {
      jest.spyOn(controller.settingsService, "getAll").mockResolvedValue({ clinicName: "Test" });
      await controller.getAll(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.settingsService, "getAll").mockRejectedValue(new Error("DB error"));
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update settings", async () => {
      req.body = { settings: { clinicName: "Updated" } };
      jest.spyOn(controller.settingsService, "update").mockResolvedValue({ clinicName: "Updated" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.body = { settings: {} };
      jest.spyOn(controller.settingsService, "update").mockRejectedValue(new Error("DB error"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateAdmin", () => {
    it("should update admin user", async () => {
      req.body = { username: "newadmin" };
      jest.spyOn(controller.settingsService, "updateAdmin").mockResolvedValue({ id: 1, username: "newadmin" });
      await controller.updateAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.settingsService, "updateAdmin").mockRejectedValue(new Error("DB error"));
      await controller.updateAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("uploadAdminImage", () => {
    it("should upload admin image", async () => {
      req.file = { filename: "admin-img.jpg" };
      jest.spyOn(controller.settingsService, "uploadAdminImage").mockResolvedValue({ id: 1 });
      await controller.uploadAdminImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ profileImageUrl: "admin/admin-img.jpg" }),
        })
      );
    });

    it("should call next with CustomError when no file provided", async () => {
      req.file = null;
      await controller.uploadAdminImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on service error", async () => {
      req.file = { filename: "admin-img.jpg" };
      jest.spyOn(controller.settingsService, "uploadAdminImage").mockRejectedValue(new Error("DB error"));
      await controller.uploadAdminImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("deleteAdminImage", () => {
    it("should delete admin image", async () => {
      jest.spyOn(controller.settingsService, "deleteAdminImage").mockResolvedValue();
      await controller.deleteAdminImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.settingsService, "deleteAdminImage").mockRejectedValue(new Error("DB error"));
      await controller.deleteAdminImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("uploadClinicLogo", () => {
    it("should upload clinic logo", async () => {
      req.file = { filename: "logo.png" };
      jest.spyOn(controller.settingsService, "uploadClinicLogo").mockResolvedValue({ logo: "clinic/logo.png" });
      await controller.uploadClinicLogo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next with CustomError when no file provided", async () => {
      req.file = null;
      await controller.uploadClinicLogo(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on service error", async () => {
      req.file = { filename: "logo.png" };
      jest.spyOn(controller.settingsService, "uploadClinicLogo").mockRejectedValue(new Error("DB error"));
      await controller.uploadClinicLogo(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("deleteClinicLogo", () => {
    it("should delete clinic logo", async () => {
      jest.spyOn(controller.settingsService, "deleteClinicLogo").mockResolvedValue();
      await controller.deleteClinicLogo(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.settingsService, "deleteClinicLogo").mockRejectedValue(new Error("DB error"));
      await controller.deleteClinicLogo(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

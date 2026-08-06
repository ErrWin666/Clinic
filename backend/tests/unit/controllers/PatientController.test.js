const PatientController = require("../../../src/controllers/PatientController");
const CustomError = require("../../../src/utils/CustomError");

describe("PatientController", () => {
  let controller;
  let req, res, next;

  beforeEach(() => {
    controller = new PatientController();
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
    it("should return paginated patients", async () => {
      req.query = { page: 1, pageSize: 10 };
      jest.spyOn(controller.patientService, "list").mockResolvedValue({
        rows: [{ id: 1, fullName: "Test" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [{ id: 1, fullName: "Test" }] })
      );
    });

    it("should call next on error", async () => {
      jest.spyOn(controller.patientService, "list").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getById", () => {
    it("should return patient by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.patientService, "getById").mockResolvedValue({ id: 1, fullName: "Test" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1, fullName: "Test" } })
      );
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should call next for non-existent patient", async () => {
      req.params.id = "999";
      jest.spyOn(controller.patientService, "getById").mockRejectedValue(
        new CustomError("Not found", "NOT_FOUND", 404)
      );
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create patient and return 201", async () => {
      req.body = { fullName: "New Patient", birthDate: "1990-01-01", gender: "male", phoneNumber: "123" };
      jest.spyOn(controller.patientService, "create").mockResolvedValue({ id: 1, ...req.body });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1, ...req.body } })
      );
    });

    it("should call next on duplicate email error", async () => {
      req.body = { fullName: "Dup", email: "dup@test.com" };
      jest.spyOn(controller.patientService, "create").mockRejectedValue(
        new CustomError("Email exists", "EMAIL_EXISTS", 409)
      );
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(409);
    });
  });

  describe("update", () => {
    it("should update patient", async () => {
      req.params.id = "1";
      req.body = { fullName: "Updated" };
      jest.spyOn(controller.patientService, "update").mockResolvedValue({ id: 1, fullName: "Updated" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1, fullName: "Updated" } })
      );
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("delete", () => {
    it("should delete patient", async () => {
      req.params.id = "1";
      jest.spyOn(controller.patientService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });

    it("should call next when patient has unpaid invoices", async () => {
      req.params.id = "1";
      jest.spyOn(controller.patientService, "delete").mockRejectedValue(
        new CustomError("Has unpaid invoices", "PATIENT_HAS_UNPAID_INVOICES", 400)
      );
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });
  });

  describe("autocomplete", () => {
    it("should return matching patients", async () => {
      req.query = { q: "Test", limit: "5" };
      jest.spyOn(controller.patientService, "autocomplete").mockResolvedValue([{ id: 1, fullName: "Test" }]);
      await controller.autocomplete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [{ id: 1, fullName: "Test" }] })
      );
    });

    it("should use default limit when not provided", async () => {
      req.query = { q: "Test" };
      jest.spyOn(controller.patientService, "autocomplete").mockResolvedValue([]);
      await controller.autocomplete(req, res, next);
      expect(controller.patientService.autocomplete).toHaveBeenCalledWith("Test", 10);
    });

    it("should call next on error", async () => {
      req.query = { q: "Test" };
      jest.spyOn(controller.patientService, "autocomplete").mockRejectedValue(new Error("fail"));
      await controller.autocomplete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("export", () => {
    it("should export patients as CSV", async () => {
      req.query = {};
      jest.spyOn(controller.patientService, "exportPatients").mockResolvedValue([
        { id: 1, displayId: "P-0001", fullName: "Test", birthDate: "1990-01-01", gender: "male", phoneNumber: "123", email: "test@test.com", patientType: "regular", createdAt: new Date("2026-01-01") },
      ]);
      await controller.export(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", "attachment; filename=patients.csv");
      expect(res.send).toHaveBeenCalled();
      const sentData = res.send.mock.calls[0][0];
      expect(sentData).toContain("Test");
      expect(sentData).toContain("P-0001");
    });

    it("should call next on error", async () => {
      req.query = {};
      jest.spyOn(controller.patientService, "exportPatients").mockRejectedValue(new Error("fail"));
      await controller.export(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle patients with null email", async () => {
      req.query = {};
      jest.spyOn(controller.patientService, "exportPatients").mockResolvedValue([
        { id: 1, displayId: "P-0001", fullName: "Test", birthDate: "1990-01-01", gender: "male", phoneNumber: "123", email: null, patientType: "regular", createdAt: new Date("2026-01-01") },
      ]);
      await controller.export(req, res, next);
      expect(res.send).toHaveBeenCalled();
      const sentData = res.send.mock.calls[0][0];
      expect(sentData).toContain("Test");
    });
  });

  describe("uploadProfileImage", () => {
    it("should call next with CustomError if no file provided", async () => {
      req.params.id = "1";
      req.file = undefined;
      await controller.uploadProfileImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should upload image and return URL", async () => {
      req.params.id = "1";
      req.file = { filename: "profile.png" };
      jest.spyOn(controller.patientService, "update").mockResolvedValue({ id: 1, profileImage: "profile.png" });
      await controller.uploadProfileImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { profileImageUrl: "patients/1/profile.png" },
        })
      );
    });
  });

  describe("deleteProfileImage", () => {
    it("should delete image if exists", async () => {
      req.params.id = "1";
      jest.spyOn(controller.patientService, "getById").mockResolvedValue({ id: 1, profileImage: "img.png" });
      jest.spyOn(controller.patientService, "update").mockResolvedValue({ id: 1, profileImage: null });
      await controller.deleteProfileImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should succeed even if no image set", async () => {
      req.params.id = "1";
      jest.spyOn(controller.patientService, "getById").mockResolvedValue({ id: 1, profileImage: null });
      await controller.deleteProfileImage(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.patientService, "getById").mockRejectedValue(new Error("fail"));
      await controller.deleteProfileImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.deleteProfileImage(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getSummaryPDF", () => {
    it("should return PDF buffer", async () => {
      req.params.id = "1";
      jest.spyOn(controller.settingsService, "getClinicSettings").mockResolvedValue({ name: "Clinic" });
      const mockDoc = { output: jest.fn().mockReturnValue(new ArrayBuffer(32)) };
      jest.spyOn(controller.patientService, "generateSummaryPDF").mockResolvedValue(mockDoc);
      jest.spyOn(controller.patientService, "getById").mockResolvedValue({ id: 1, displayId: "P-0001" });
      await controller.getSummaryPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.getSummaryPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.settingsService, "getClinicSettings").mockRejectedValue(new Error("fail"));
      await controller.getSummaryPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

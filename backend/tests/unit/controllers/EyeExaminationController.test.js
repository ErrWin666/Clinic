const EyeExaminationController = require("../../../src/controllers/EyeExaminationController");
const CustomError = require("../../../src/utils/CustomError");

jest.mock("../../../src/models", () => ({
  Settings: { findOne: jest.fn().mockResolvedValue(null), findAll: jest.fn().mockResolvedValue([]) },
}));

jest.mock("../../../src/utils/pdf", () => ({
  generateExaminationPDF: jest.fn().mockReturnValue({
    output: jest.fn().mockReturnValue(new ArrayBuffer(100)),
  }),
}));

describe("EyeExaminationController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new EyeExaminationController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("listByPatient", () => {
    it("should return paginated exams by patient", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.examService, "getByPatientId").mockResolvedValue({
        rows: [{ id: 1 }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.listByPatient(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid patientId", async () => {
      req.params.patientId = "abc";
      await controller.listByPatient(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getById", () => {
    it("should return exam by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.examService, "getById").mockResolvedValue({ id: 1 });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "0";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create exam and return 201", async () => {
      req.params.patientId = "1";
      req.body = { examDate: "2026-01-01", findings: "Normal" };
      jest.spyOn(controller.examService, "create").mockResolvedValue({ id: 1 });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.examService, "create").mockRejectedValue(new Error("fail"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update exam", async () => {
      req.params.id = "1";
      req.body = { findings: "Updated" };
      jest.spyOn(controller.examService, "update").mockResolvedValue({ id: 1, findings: "Updated" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createFollowUp", () => {
    it("should create follow-up and return 201", async () => {
      req.params.id = "1";
      jest.spyOn(controller.examService, "createFollowUp").mockResolvedValue({ id: 2, parentId: 1 });
      await controller.createFollowUp(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getPDF", () => {
    it("should generate and return PDF", async () => {
      req.params.id = "1";
      jest.spyOn(controller.examService, "getById").mockResolvedValue({ id: 1, displayId: "EX-0001" });
      await controller.getPDF(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.send).toHaveBeenCalled();
    });

    it("should call next on error", async () => {
      req.params.id = "1";
      jest.spyOn(controller.examService, "getById").mockRejectedValue(new Error("fail"));
      await controller.getPDF(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete exam", async () => {
      req.params.id = "1";
      jest.spyOn(controller.examService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "invalid";
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });
});

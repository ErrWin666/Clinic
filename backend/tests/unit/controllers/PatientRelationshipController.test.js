const PatientRelationshipController = require("../../../src/controllers/PatientRelationshipController");
const CustomError = require("../../../src/utils/CustomError");

describe("PatientRelationshipController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new PatientRelationshipController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("list", () => {
    it("should return relationships for a patient", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.relationshipService, "getByPatientId").mockResolvedValue([
        { id: 1, patientId: 1, relatedPatientId: 2, relationshipType: "parent" },
      ]);
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should call next on error", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.relationshipService, "getByPatientId").mockRejectedValue(new Error("DB error"));
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid patient id", async () => {
      req.params.patientId = "invalid";
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create a relationship", async () => {
      req.params.patientId = "1";
      req.body = { relatedPatientId: 2, relationshipType: "parent" };
      jest.spyOn(controller.relationshipService, "create").mockResolvedValue({
        id: 1, patientId: 1, relatedPatientId: 2, relationshipType: "parent",
      });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ id: 1 }) })
      );
    });

    it("should call next on error", async () => {
      req.params.patientId = "1";
      req.body = { relatedPatientId: 2 };
      jest.spyOn(controller.relationshipService, "create").mockRejectedValue(new Error("Duplicate"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("delete", () => {
    it("should delete a relationship", async () => {
      req.params.relationshipId = "1";
      jest.spyOn(controller.relationshipService, "delete").mockResolvedValue();
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });

    it("should call next for invalid id", async () => {
      req.params.relationshipId = "invalid";
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should call next on error", async () => {
      req.params.relationshipId = "1";
      jest.spyOn(controller.relationshipService, "delete").mockRejectedValue(new Error("Not found"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

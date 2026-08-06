const CustomError = require("../../../src/utils/CustomError");

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  renameSync: jest.fn(),
}));

jest.mock("../../../src/services/ClinicNoteService", () => {
  return jest.fn().mockImplementation(() => ({
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    uploadAttachment: jest.fn(),
    downloadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
  }));
});

jest.mock("../../../src/services/PatientNoteService", () => {
  return jest.fn().mockImplementation(() => ({
    listByPatient: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    uploadAttachment: jest.fn(),
    downloadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
  }));
});

const ClinicNoteController = require("../../../src/controllers/ClinicNoteController");
const PatientNoteController = require("../../../src/controllers/PatientNoteController");

describe("ClinicNoteController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new ClinicNoteController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
  });

  describe("list", () => {
    it("should return paginated notes", async () => {
      jest.spyOn(controller.clinicNoteService, "list").mockResolvedValue({
        rows: [{ id: 1, content: "Note 1" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getById", () => {
    it("should return note by id", async () => {
      req.params.id = "1";
      jest.spyOn(controller.clinicNoteService, "getById").mockResolvedValue({ id: 1, content: "Test" });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid id", async () => {
      req.params.id = "abc";
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("create", () => {
    it("should create note and return 201", async () => {
      req.body = { title: "Test", content: "Content" };
      jest.spyOn(controller.clinicNoteService, "create").mockResolvedValue({ id: 1, title: "Test" });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.body = { content: "Content" };
      jest.spyOn(controller.clinicNoteService, "create").mockRejectedValue(new Error("fail"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should update note and return 200", async () => {
      req.params.id = "1";
      req.body = { content: "Updated" };
      jest.spyOn(controller.clinicNoteService, "update").mockResolvedValue({ id: 1, content: "Updated" });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("delete", () => {
    it("should delete note and return 200", async () => {
      req.params.id = "1";
      jest.spyOn(controller.clinicNoteService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadAttachment", () => {
    it("should upload single file and return 201", async () => {
      req.params.id = "1";
      req.file = { originalname: "test.txt", path: "/tmp/test.txt", mimetype: "text/plain", size: 100 };
      jest.spyOn(controller.clinicNoteService, "uploadAttachment").mockResolvedValue({ id: 1 });
      await controller.uploadAttachment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should upload multiple files and return 201", async () => {
      req.params.id = "1";
      req.files = [
        { originalname: "a.txt", path: "/tmp/a.txt", mimetype: "text/plain", size: 50 },
        { originalname: "b.txt", path: "/tmp/b.txt", mimetype: "text/plain", size: 60 },
      ];
      jest.spyOn(controller.clinicNoteService, "uploadAttachment").mockResolvedValue({ id: 1 });
      await controller.uploadAttachment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next with 400 when no file provided", async () => {
      req.params.id = "1";
      await controller.uploadAttachment(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("deleteAttachment", () => {
    it("should delete attachment and return 200", async () => {
      req.params.id = "1";
      req.params.fileId = "2";
      jest.spyOn(controller.clinicNoteService, "deleteAttachment").mockResolvedValue(true);
      await controller.deleteAttachment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

describe("PatientNoteController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new PatientNoteController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
  });

  describe("list", () => {
    it("should return paginated patient notes", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.patientNoteService, "listByPatient").mockResolvedValue({
        rows: [{ id: 1, content: "Note 1" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.list(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid patientId", async () => {
      req.params.patientId = "abc";
      await controller.list(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getById", () => {
    it("should return note by id", async () => {
      req.params.patientId = "1";
      req.params.id = "2";
      jest.spyOn(controller.patientNoteService, "getById").mockResolvedValue({ id: 2 });
      await controller.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("create", () => {
    it("should create patient note and return 201", async () => {
      req.params.patientId = "1";
      req.body = { content: "Test content" };
      jest.spyOn(controller.patientNoteService, "create").mockResolvedValue({ id: 1 });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    it("should update patient note and return 200", async () => {
      req.params.patientId = "1";
      req.params.id = "2";
      req.body = { content: "Updated" };
      jest.spyOn(controller.patientNoteService, "update").mockResolvedValue({ id: 2 });
      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("delete", () => {
    it("should delete patient note and return 200", async () => {
      req.params.patientId = "1";
      req.params.id = "2";
      jest.spyOn(controller.patientNoteService, "delete").mockResolvedValue(true);
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("uploadAttachment", () => {
    it("should upload single file and return 201", async () => {
      req.params.patientId = "1";
      req.params.id = "2";
      req.file = { originalname: "test.txt", path: "/tmp/test.txt", mimetype: "text/plain", size: 100 };
      jest.spyOn(controller.patientNoteService, "uploadAttachment").mockResolvedValue({ id: 1 });
      await controller.uploadAttachment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next with 400 when no file provided", async () => {
      req.params.patientId = "1";
      req.params.id = "2";
      await controller.uploadAttachment(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("deleteAttachment", () => {
    it("should delete attachment and return 200", async () => {
      req.params.patientId = "1";
      req.params.id = "2";
      req.params.fileId = "3";
      jest.spyOn(controller.patientNoteService, "deleteAttachment").mockResolvedValue(true);
      await controller.deleteAttachment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

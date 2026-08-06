const CustomError = require("../../../src/utils/CustomError");

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
  createWriteStream: jest.fn(() => ({ on: jest.fn() })),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock("../../../src/services/FolderService", () => {
  return jest.fn().mockImplementation(() => ({
    listByPatient: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
    delete: jest.fn(),
  }));
});

jest.mock("../../../src/services/FileService", () => {
  return jest.fn().mockImplementation(() => ({
    listByPatient: jest.fn(),
    upload: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
  }));
});

const FileFolderController = require("../../../src/controllers/FileFolderController");

describe("FileFolderController", () => {
  let controller, req, res, next;

  beforeEach(() => {
    controller = new FileFolderController();
    next = jest.fn();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    req = { params: {}, query: {}, body: {} };
  });

  describe("listFolders", () => {
    it("should return paginated folders", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.folderService, "listByPatient").mockResolvedValue({
        rows: [{ id: 1, name: "Folder1" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.listFolders(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid patientId", async () => {
      req.params.patientId = "abc";
      await controller.listFolders(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("createFolder", () => {
    it("should create folder and return 201", async () => {
      req.params.patientId = "1";
      req.body = { name: "New Folder" };
      jest.spyOn(controller.folderService, "create").mockResolvedValue({ id: 1, name: "New Folder" });
      await controller.createFolder(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should call next on error", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.folderService, "create").mockRejectedValue(new Error("fail"));
      await controller.createFolder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("renameFolder", () => {
    it("should rename folder", async () => {
      req.params.folderId = "1";
      req.body = { name: "Renamed" };
      jest.spyOn(controller.folderService, "rename").mockResolvedValue({ id: 1, name: "Renamed" });
      await controller.renameFolder(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid folderId", async () => {
      req.params.folderId = "0";
      await controller.renameFolder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("deleteFolder", () => {
    it("should delete folder", async () => {
      req.params.folderId = "1";
      jest.spyOn(controller.folderService, "delete").mockResolvedValue(true);
      await controller.deleteFolder(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.params.folderId = "1";
      jest.spyOn(controller.folderService, "delete").mockRejectedValue(new Error("fail"));
      await controller.deleteFolder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid folderId", async () => {
      req.params.folderId = "0";
      await controller.deleteFolder(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("listFiles", () => {
    it("should return paginated files", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.fileService, "listByPatient").mockResolvedValue({
        rows: [{ id: 1, name: "file.pdf" }],
        pagination: { totalItems: 1, currentPage: 1, totalPages: 1 },
      });
      await controller.listFiles(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next on error", async () => {
      req.params.patientId = "1";
      jest.spyOn(controller.fileService, "listByPatient").mockRejectedValue(new Error("fail"));
      await controller.listFiles(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should call next for invalid patientId", async () => {
      req.params.patientId = "abc";
      await controller.listFiles(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("uploadFile", () => {
    it("should call next with CustomError if no file provided", async () => {
      req.params.patientId = "1";
      req.file = undefined;
      await controller.uploadFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should upload file and return 201", async () => {
      req.params.patientId = "1";
      req.file = { filename: "test.jpg", originalname: "test.jpg" };
      req.body = {};
      jest.spyOn(controller.fileService, "upload").mockResolvedValue({ id: 1, name: "test.jpg" });
      await controller.uploadFile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should upload file with folderId", async () => {
      req.params.patientId = "1";
      req.file = { filename: "test.jpg", originalname: "test.jpg" };
      req.body = { folderId: "5" };
      jest.spyOn(controller.fileService, "upload").mockResolvedValue({ id: 1, name: "test.jpg" });
      await controller.uploadFile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(controller.fileService.upload).toHaveBeenCalledWith(1, req.file, 5, null);
    });
  });

  describe("downloadFile", () => {
    it("should set headers and pipe stream", async () => {
      req.params.fileId = "1";
      jest.spyOn(controller.fileService, "download").mockResolvedValue({
        file: { name: "test.pdf", type: "application/pdf" },
        fullPath: "/fake/path/test.pdf",
      });
      await controller.downloadFile(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="test.pdf"; filename*=UTF-8\'\'test.pdf');
    });

    it("should call next for invalid fileId", async () => {
      req.params.fileId = "abc";
      await controller.downloadFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("previewFile", () => {
    it("should set inline disposition and pipe stream", async () => {
      req.params.fileId = "1";
      jest.spyOn(controller.fileService, "download").mockResolvedValue({
        file: { name: "image.png", type: "image/png" },
        fullPath: "/fake/path/image.png",
      });
      await controller.previewFile(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
      expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", 'inline; filename="image.png"; filename*=UTF-8\'\'image.png');
    });

    it("should call next on error", async () => {
      req.params.fileId = "1";
      jest.spyOn(controller.fileService, "download").mockRejectedValue(new Error("fail"));
      await controller.previewFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("deleteFile", () => {
    it("should delete file", async () => {
      req.params.fileId = "1";
      jest.spyOn(controller.fileService, "delete").mockResolvedValue(true);
      await controller.deleteFile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next for invalid fileId", async () => {
      req.params.fileId = "0";
      await controller.deleteFile(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });
});

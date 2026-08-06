const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient, createTestFolder } = require("../../helpers/factories");
const FileService = require("../../../src/services/FileService");
const FolderService = require("../../../src/services/FolderService");
const CustomError = require("../../../src/utils/CustomError");
const { File } = require("../../../src/models");
const fs = require("fs");
const path = require("path");
const config = require("../../../src/config");

describe("FileService", () => {
  let fileService;
  let folderService;
  let testPatient;
  let testFolder;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    fileService = new FileService();
    folderService = new FolderService();
    testPatient = await createTestPatient({ fullName: "File Patient" });
    testFolder = await folderService.create(testPatient.id, { name: "FileTestFolder" });
  });

  afterAll(async () => {
    await teardownTestDB();
    const uploadDir = path.resolve(config.upload.dir);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  function createMockFile(originalname, mimetype, size) {
    const tmpDir = path.resolve(config.upload.dir, "tmp");
    fs.mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `${Date.now()}-${originalname}`);
    fs.writeFileSync(tmpPath, "test content");
    return {
      originalname,
      mimetype,
      size,
      path: tmpPath,
    };
  }

  describe("upload", () => {
    it("should create file record in patient root", async () => {
      const mockFile = createMockFile("test1.jpg", "image/jpeg", 1024);
      const file = await fileService.upload(testPatient.id, mockFile);

      expect(file).toBeDefined();
      expect(file.name).toBe("test1.jpg");
      expect(file.patientId).toBe(testPatient.id);
      expect(file.folderId).toBeNull();
      expect(file.type).toBe("image/jpeg");

      const fullPath = path.resolve(config.upload.dir, file.path);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    it("should create file in specified folder", async () => {
      const mockFile = createMockFile("test2.pdf", "application/pdf", 2048);
      const file = await fileService.upload(testPatient.id, mockFile, testFolder.id);

      expect(file.folderId).toBe(testFolder.id);
      expect(file.path).toContain("FileTestFolder");
    });
  });

  describe("download", () => {
    it("should return file and path", async () => {
      const mockFile = createMockFile("download.jpg", "image/jpeg", 512);
      const uploaded = await fileService.upload(testPatient.id, mockFile);

      const { file, fullPath } = await fileService.download(uploaded.id);
      expect(file).toBeDefined();
      expect(file.name).toBe("download.jpg");
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    it("should throw 404 for non-existent file", async () => {
      await expect(fileService.download(99999)).rejects.toThrow(CustomError);
    });

    it("should throw 404 when physical file is missing from disk", async () => {
      const mockFile = createMockFile("ghost.jpg", "image/jpeg", 256);
      const uploaded = await fileService.upload(testPatient.id, mockFile);
      // Delete physical file but keep DB record
      const fullPath = path.resolve(config.upload.dir, uploaded.path);
      fs.unlinkSync(fullPath);
      await expect(fileService.download(uploaded.id)).rejects.toThrow(CustomError);
    });
  });

  describe("listByPatient", () => {
    it("should return paginated files for a patient", async () => {
      const { rows, pagination } = await fileService.listByPatient(testPatient.id, {
        page: 1,
        pageSize: 10,
      });

      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(pagination).toBeDefined();
    });

    it("should filter by folderId", async () => {
      const { rows } = await fileService.listByPatient(testPatient.id, {
        folderId: testFolder.id,
      });

      expect(rows.every((r) => r.folderId === testFolder.id)).toBe(true);
    });

    it("should filter by search term", async () => {
      const mockFile = createMockFile("searchable_file.png", "image/png", 1024);
      await fileService.upload(testPatient.id, mockFile);

      const { rows } = await fileService.listByPatient(testPatient.id, {
        search: "searchable",
      });

      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.name.includes("searchable"))).toBe(true);
    });

    it("should filter by type", async () => {
      const { rows } = await fileService.listByPatient(testPatient.id, {
        type: "pdf",
      });

      expect(rows.every((r) => r.type.includes("pdf"))).toBe(true);
    });

    it("should filter by examinationId=null", async () => {
      const { rows } = await fileService.listByPatient(testPatient.id, {
        examinationId: "null",
      });
      expect(rows).toBeDefined();
    });

    it("should filter by specific examinationId", async () => {
      const { rows } = await fileService.listByPatient(testPatient.id, {
        examinationId: "42",
      });
      expect(rows).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete file record and physical file", async () => {
      const mockFile = createMockFile("deleteme.jpg", "image/jpeg", 256);
      const uploaded = await fileService.upload(testPatient.id, mockFile);
      const fullPath = path.resolve(config.upload.dir, uploaded.path);

      expect(fs.existsSync(fullPath)).toBe(true);
      await fileService.delete(uploaded.id);

      const found = await File.findByPk(uploaded.id);
      expect(found).toBeNull();
      expect(fs.existsSync(fullPath)).toBe(false);
    });

    it("should delete DB record even when physical file is missing", async () => {
      const mockFile = createMockFile("already_gone.jpg", "image/jpeg", 256);
      const uploaded = await fileService.upload(testPatient.id, mockFile);
      const fullPath = path.resolve(config.upload.dir, uploaded.path);
      // Remove physical file first
      fs.unlinkSync(fullPath);
      expect(fs.existsSync(fullPath)).toBe(false);
      // Delete should still succeed
      await fileService.delete(uploaded.id);
      const found = await File.findByPk(uploaded.id);
      expect(found).toBeNull();
    });
  });

  describe("fixMojibakeName (via download/list)", () => {
    it("should fix mojibake Arabic filename on download", async () => {
      const mojibakeName = Buffer.from("مرحبا.jpg", "utf8").toString("latin1");
      const uploaded = await fileService.upload(testPatient.id, createMockFile("normal.jpg", "image/jpeg", 256));
      // Mock repository to return mojibake name but real path so fs.existsSync passes
      jest.spyOn(fileService.repository, "findById").mockResolvedValueOnce({
        id: uploaded.id,
        name: mojibakeName,
        path: uploaded.path,
      });
      const result = await fileService.download(uploaded.id);
      expect(result).toBeDefined();
      expect(result.file.name).toMatch(/[\u0600-\u06FF]/);
    });

    it("should fix mojibake Arabic filename on listByPatient", async () => {
      const mojibakeName = Buffer.from("اختبار.txt", "utf8").toString("latin1");
      jest.spyOn(fileService.repository, "searchWithFilters").mockResolvedValueOnce({
        rows: [{ name: mojibakeName }],
        count: 1,
      });
      const { rows } = await fileService.listByPatient(testPatient.id, { page: 1, pageSize: 50 });
      expect(rows).toBeDefined();
      expect(rows.length).toBe(1);
      expect(rows[0].name).toMatch(/[\u0600-\u06FF]/);
    });

    it("should handle non-mojibake filenames on download", async () => {
      const mockFile = createMockFile("normal.jpg", "image/jpeg", 256);
      const uploaded = await fileService.upload(testPatient.id, mockFile);
      const result = await fileService.download(uploaded.id);
      expect(result).toBeDefined();
      expect(result.file.name).toBe(uploaded.name);
    });

    it("should return original name when mojibake fix does not produce valid Arabic", async () => {
      // ØØØØ matches mojibake pattern but doesn't decode to valid Arabic
      const fakeMojibake = "ØØØØ.jpg";
      const uploaded = await fileService.upload(testPatient.id, createMockFile("normal.jpg", "image/jpeg", 256));
      jest.spyOn(fileService.repository, "findById").mockResolvedValueOnce({
        id: uploaded.id,
        name: fakeMojibake,
        path: uploaded.path,
      });
      const result = await fileService.download(uploaded.id);
      expect(result).toBeDefined();
      expect(result.file.name).toBe(fakeMojibake);
    });

    it("should handle null filename gracefully on listByPatient", async () => {
      jest.spyOn(fileService.repository, "searchWithFilters").mockResolvedValueOnce({
        rows: [{ name: null }],
        count: 1,
      });
      const { rows } = await fileService.listByPatient(testPatient.id, { page: 1, pageSize: 50 });
      expect(rows).toBeDefined();
      expect(rows[0].name).toBeNull();
    });
  });
});

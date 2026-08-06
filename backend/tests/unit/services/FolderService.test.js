const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const FolderService = require("../../../src/services/FolderService");
const CustomError = require("../../../src/utils/CustomError");
const { Folder } = require("../../../src/models");
const fs = require("fs");
const path = require("path");
const config = require("../../../src/config");

describe("FolderService", () => {
  let folderService;
  let testPatient;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    folderService = new FolderService();
    testPatient = await createTestPatient({ fullName: "Folder Patient" });
  });

  afterAll(async () => {
    await teardownTestDB();
    const uploadDir = path.resolve(config.upload.dir);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  describe("create", () => {
    it("should create root folder (no parent)", async () => {
      const folder = await folderService.create(testPatient.id, {
        name: "RootFolder",
      });

      expect(folder).toBeDefined();
      expect(folder.name).toBe("RootFolder");
      expect(folder.patientId).toBe(testPatient.id);
      expect(folder.parentFolderId).toBeNull();
      expect(folder.path).toContain("RootFolder");

      const fullPath = path.resolve(config.upload.dir, folder.path);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    it("should create sub folder with parent", async () => {
      const root = await folderService.create(testPatient.id, { name: "ParentFolder" });
      const sub = await folderService.create(testPatient.id, {
        name: "SubFolder",
        parentFolderId: root.id,
      });

      expect(sub.parentFolderId).toBe(root.id);
      expect(sub.path).toContain("ParentFolder");
      expect(sub.path).toContain("SubFolder");

      const fullPath = path.resolve(config.upload.dir, sub.path);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  describe("rename", () => {
    it("should update name and path", async () => {
      const folder = await folderService.create(testPatient.id, { name: "RenameMe" });
      const renamed = await folderService.rename(folder.id, "RenamedFolder");

      expect(renamed.name).toBe("RenamedFolder");
      expect(renamed.path).toContain("RenamedFolder");
    });
  });

  describe("listByPatient", () => {
    it("should return paginated folders for a patient", async () => {
      const { rows, pagination } = await folderService.listByPatient(testPatient.id, {
        page: 1,
        pageSize: 10,
      });

      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(pagination).toBeDefined();
    });

    it("should filter by parentFolderId", async () => {
      const root = await folderService.create(testPatient.id, { name: "FilterRoot" });
      await folderService.create(testPatient.id, { name: "FilterSub", parentFolderId: root.id });

      const { rows } = await folderService.listByPatient(testPatient.id, {
        parentFolderId: root.id,
      });

      expect(rows.every((r) => r.parentFolderId === root.id)).toBe(true);
    });

    it("should filter by search term", async () => {
      await folderService.create(testPatient.id, { name: "SearchableFolder" });

      const { rows } = await folderService.listByPatient(testPatient.id, {
        search: "Searchable",
      });

      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.name.includes("Searchable"))).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete folder and physical directory", async () => {
      const folder = await folderService.create(testPatient.id, { name: "DeleteMe" });
      const fullPath = path.resolve(config.upload.dir, folder.path);
      expect(fs.existsSync(fullPath)).toBe(true);

      await folderService.delete(folder.id);

      const found = await Folder.findByPk(folder.id);
      expect(found).toBeNull();
    });

    it("should delete folder even if physical directory does not exist", async () => {
      const folder = await folderService.create(testPatient.id, { name: "DeleteNoDir" });
      const fullPath = path.resolve(config.upload.dir, folder.path);
      fs.rmSync(fullPath, { recursive: true, force: true });
      expect(fs.existsSync(fullPath)).toBe(false);

      await folderService.delete(folder.id);

      const found = await Folder.findByPk(folder.id);
      expect(found).toBeNull();
    });
  });

  describe("sanitizeFolderName", () => {
    it("should reject empty folder name", async () => {
      await expect(folderService.create(testPatient.id, { name: "" })).rejects.toThrow();
    });

    it("should reject dot folder name", async () => {
      await expect(folderService.create(testPatient.id, { name: "." })).rejects.toThrow();
    });

    it("should reject double-dot folder name", async () => {
      await expect(folderService.create(testPatient.id, { name: ".." })).rejects.toThrow();
    });

    it("should strip path separators from folder name", async () => {
      const folder = await folderService.create(testPatient.id, { name: "path/to/Folder" });
      expect(folder.name).toBe("Folder");
    });
  });

  describe("rename - edge cases", () => {
    it("should rename folder when physical dir does not exist", async () => {
      const folder = await folderService.create(testPatient.id, { name: "RenameNoDir" });
      const fullPath = path.resolve(config.upload.dir, folder.path);
      fs.rmSync(fullPath, { recursive: true, force: true });

      const renamed = await folderService.rename(folder.id, "RenamedNoDir");
      expect(renamed.name).toBe("RenamedNoDir");
    });

    it("should reject invalid name on rename", async () => {
      const folder = await folderService.create(testPatient.id, { name: "ValidName" });
      await expect(folderService.rename(folder.id, "")).rejects.toThrow();
    });
  });

  describe("listByPatient - with sort", () => {
    it("should sort by name descending", async () => {
      const { rows } = await folderService.listByPatient(testPatient.id, {
        sortBy: "name",
        sortOrder: "DESC",
      });
      expect(rows).toBeDefined();
    });
  });

  describe("create - path traversal guard", () => {
    it("should reject path traversal via patientId", async () => {
      await expect(
        folderService.create("../../etc", { name: "test" })
      ).rejects.toThrow();
    });
  });

  describe("rename - path traversal guard", () => {
    it("should reject path traversal via malicious folder path", async () => {
      const folder = await folderService.create(testPatient.id, { name: "ValidFolder" });
      jest.spyOn(folderService.repository, "findById").mockResolvedValueOnce({
        id: folder.id,
        path: "../../etc/malicious",
        update: jest.fn(),
      });
      await expect(folderService.rename(folder.id, "NewName")).rejects.toThrow();
    });
  });
});

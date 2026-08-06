const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const ClinicNoteService = require("../../../src/services/ClinicNoteService");
const PatientNoteService = require("../../../src/services/PatientNoteService");
const CustomError = require("../../../src/utils/CustomError");
const { ClinicNote, PatientNote } = require("../../../src/models");
const fs = require("fs");
const path = require("path");
const config = require("../../../src/config");

let clinicNoteService;
let patientNoteService;
let adminUser;
let testPatient;

beforeAll(async () => {
  await setupTestDB();
  adminUser = await createTestAdmin();
  clinicNoteService = new ClinicNoteService();
  patientNoteService = new PatientNoteService();
  testPatient = await createTestPatient({ fullName: "Note Patient" });
});

afterAll(async () => {
  await teardownTestDB();
  const uploadDir = path.resolve(config.upload.dir);
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
});

describe("ClinicNoteService", () => {
  describe("create", () => {
    it("should create a clinic note with title and content", async () => {
      const note = await clinicNoteService.create(
        { title: "Test Note", content: "Some content" },
        adminUser.id
      );
      expect(note).toBeDefined();
      expect(note.title).toBe("Test Note");
      expect(note.content).toBe("Some content");
      expect(note.userId).toBe(adminUser.id);
    });

    it("should create a clinic note with null title", async () => {
      const note = await clinicNoteService.create(
        { content: "No title content" },
        adminUser.id
      );
      expect(note.title).toBeNull();
      expect(note.content).toBe("No title content");
    });

    it("should throw CustomError for empty content", async () => {
      await expect(
        clinicNoteService.create({ content: "   " }, adminUser.id)
      ).rejects.toThrow(CustomError);
    });
  });

  describe("list", () => {
    it("should return paginated notes", async () => {
      const { rows, pagination } = await clinicNoteService.list({ page: 1, pageSize: 10 });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(pagination).toBeDefined();
      expect(pagination.currentPage).toBe(1);
    });

    it("should search notes by content", async () => {
      await clinicNoteService.create({ title: "Searchable", content: "unique-search-term" }, adminUser.id);
      const { rows } = await clinicNoteService.list({ search: "unique-search-term" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].content).toContain("unique-search-term");
    });
  });

  describe("getById", () => {
    it("should return note by id", async () => {
      const created = await clinicNoteService.create({ content: "Get by id" }, adminUser.id);
      const note = await clinicNoteService.getById(created.id);
      expect(note.id).toBe(created.id);
      expect(note.content).toBe("Get by id");
    });

    it("should throw 404 for non-existent note", async () => {
      await expect(clinicNoteService.getById(99999)).rejects.toThrow(CustomError);
    });
  });

  describe("update", () => {
    it("should update title and content", async () => {
      const created = await clinicNoteService.create({ content: "Original" }, adminUser.id);
      const updated = await clinicNoteService.update(created.id, {
        title: "Updated Title",
        content: "Updated content",
      });
      expect(updated.title).toBe("Updated Title");
      expect(updated.content).toBe("Updated content");
    });

    it("should throw CustomError for empty content on update", async () => {
      const created = await clinicNoteService.create({ content: "Original" }, adminUser.id);
      await expect(clinicNoteService.update(created.id, { content: "  " })).rejects.toThrow(CustomError);
    });
  });

  describe("delete", () => {
    it("should soft-delete a note", async () => {
      const created = await clinicNoteService.create({ content: "To be deleted" }, adminUser.id);
      await clinicNoteService.delete(created.id);
      await expect(clinicNoteService.getById(created.id)).rejects.toThrow(CustomError);
    });

    it("should throw 404 when deleting non-existent note", async () => {
      await expect(clinicNoteService.delete(99999)).rejects.toThrow(CustomError);
    });
  });
});

describe("PatientNoteService", () => {
  describe("create", () => {
    it("should create a patient note", async () => {
      const note = await patientNoteService.create(
        testPatient.id,
        { title: "Patient Note", content: "Patient content" },
        adminUser.id
      );
      expect(note).toBeDefined();
      expect(note.patientId).toBe(testPatient.id);
      expect(note.title).toBe("Patient Note");
      expect(note.content).toBe("Patient content");
    });

    it("should throw CustomError for empty content", async () => {
      await expect(
        patientNoteService.create(testPatient.id, { content: "" }, adminUser.id)
      ).rejects.toThrow(CustomError);
    });
  });

  describe("listByPatient", () => {
    it("should return paginated notes for a patient", async () => {
      const { rows, pagination } = await patientNoteService.listByPatient(testPatient.id, {
        page: 1,
        pageSize: 10,
      });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(pagination).toBeDefined();
    });

    it("should search notes by content", async () => {
      await patientNoteService.create(
        testPatient.id,
        { content: "patient-search-term" },
        adminUser.id
      );
      const { rows } = await patientNoteService.listByPatient(testPatient.id, {
        search: "patient-search-term",
      });
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe("getById", () => {
    it("should return note by id for correct patient", async () => {
      const created = await patientNoteService.create(testPatient.id, { content: "Get me" }, adminUser.id);
      const note = await patientNoteService.getById(testPatient.id, created.id);
      expect(note.id).toBe(created.id);
    });

    it("should throw 404 for wrong patient id", async () => {
      const created = await patientNoteService.create(testPatient.id, { content: "Get me" }, adminUser.id);
      await expect(patientNoteService.getById(99999, created.id)).rejects.toThrow(CustomError);
    });
  });

  describe("update", () => {
    it("should update patient note", async () => {
      const created = await patientNoteService.create(testPatient.id, { content: "Original" }, adminUser.id);
      const updated = await patientNoteService.update(testPatient.id, created.id, {
        content: "Updated",
      });
      expect(updated.content).toBe("Updated");
    });

    it("should throw 404 for wrong patient on update", async () => {
      const created = await patientNoteService.create(testPatient.id, { content: "Original" }, adminUser.id);
      await expect(patientNoteService.update(99999, created.id, { content: "X" })).rejects.toThrow(CustomError);
    });
  });

  describe("delete", () => {
    it("should soft-delete a patient note", async () => {
      const created = await patientNoteService.create(testPatient.id, { content: "Delete me" }, adminUser.id);
      await patientNoteService.delete(testPatient.id, created.id);
      await expect(patientNoteService.getById(testPatient.id, created.id)).rejects.toThrow(CustomError);
    });

    it("should throw 404 for wrong patient on delete", async () => {
      const created = await patientNoteService.create(testPatient.id, { content: "Delete me" }, adminUser.id);
      await expect(patientNoteService.delete(99999, created.id)).rejects.toThrow(CustomError);
    });
  });
});

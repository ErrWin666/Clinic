const {
  listClinicNotesSchema,
  clinicNoteIdParamSchema,
  clinicNoteAttachmentParamSchema,
  createClinicNoteSchema,
  updateClinicNoteSchema,
} = require("../../../src/schemas/clinicNoteSchema");

const {
  listPatientNotesSchema,
  patientNoteIdParamSchema,
  patientNoteAttachmentParamSchema,
  createPatientNoteSchema,
  updatePatientNoteSchema,
} = require("../../../src/schemas/patientNoteSchema");

describe("clinicNoteSchema", () => {
  describe("listClinicNotesSchema", () => {
    it("should validate with empty query", () => {
      const { error, value } = listClinicNotesSchema.validate({
        params: {}, query: {}, body: {},
      });
      expect(error).toBeUndefined();
      expect(value.query.page).toBe(1);
      expect(value.query.pageSize).toBe(20);
    });

    it("should validate with search and pagination", () => {
      const { error, value } = listClinicNotesSchema.validate({
        params: {}, query: { search: "test", page: 2, pageSize: 5 }, body: {},
      });
      expect(error).toBeUndefined();
      expect(value.query.search).toBe("test");
      expect(value.query.page).toBe(2);
    });

    it("should reject pageSize > 100", () => {
      const { error } = listClinicNotesSchema.validate({
        params: {}, query: { pageSize: 200 }, body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("clinicNoteIdParamSchema", () => {
    it("should validate with valid id", () => {
      const { error } = clinicNoteIdParamSchema.validate({
        params: { id: 1 }, query: {}, body: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing id", () => {
      const { error } = clinicNoteIdParamSchema.validate({
        params: {}, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject non-positive id", () => {
      const { error } = clinicNoteIdParamSchema.validate({
        params: { id: 0 }, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("clinicNoteAttachmentParamSchema", () => {
    it("should validate with id and fileId", () => {
      const { error } = clinicNoteAttachmentParamSchema.validate({
        params: { id: 1, fileId: 2 }, query: {}, body: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing fileId", () => {
      const { error } = clinicNoteAttachmentParamSchema.validate({
        params: { id: 1 }, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("createClinicNoteSchema", () => {
    it("should validate with title and content", () => {
      const { error } = createClinicNoteSchema.validate({
        params: {}, query: {}, body: { title: "Test", content: "Content" },
      });
      expect(error).toBeUndefined();
    });

    it("should validate with null title", () => {
      const { error } = createClinicNoteSchema.validate({
        params: {}, query: {}, body: { title: null, content: "Content" },
      });
      expect(error).toBeUndefined();
    });

    it("should validate without title", () => {
      const { error } = createClinicNoteSchema.validate({
        params: {}, query: {}, body: { content: "Content" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing content", () => {
      const { error } = createClinicNoteSchema.validate({
        params: {}, query: {}, body: { title: "Test" },
      });
      expect(error).toBeDefined();
    });

    it("should reject title > 255 chars", () => {
      const { error } = createClinicNoteSchema.validate({
        params: {}, query: {}, body: { content: "C", title: "x".repeat(256) },
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateClinicNoteSchema", () => {
    it("should validate with id and content", () => {
      const { error } = updateClinicNoteSchema.validate({
        params: { id: 1 }, query: {}, body: { content: "Updated" },
      });
      expect(error).toBeUndefined();
    });

    it("should validate with id and title only", () => {
      const { error } = updateClinicNoteSchema.validate({
        params: { id: 1 }, query: {}, body: { title: "New Title" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing id param", () => {
      const { error } = updateClinicNoteSchema.validate({
        params: {}, query: {}, body: { content: "Updated" },
      });
      expect(error).toBeDefined();
    });
  });
});

describe("patientNoteSchema", () => {
  describe("listPatientNotesSchema", () => {
    it("should validate with patientId param", () => {
      const { error, value } = listPatientNotesSchema.validate({
        params: { patientId: 1 }, query: {}, body: {},
      });
      expect(error).toBeUndefined();
      expect(value.query.page).toBe(1);
    });

    it("should reject missing patientId", () => {
      const { error } = listPatientNotesSchema.validate({
        params: {}, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("patientNoteIdParamSchema", () => {
    it("should validate with patientId and id", () => {
      const { error } = patientNoteIdParamSchema.validate({
        params: { patientId: 1, id: 2 }, query: {}, body: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing id", () => {
      const { error } = patientNoteIdParamSchema.validate({
        params: { patientId: 1 }, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("patientNoteAttachmentParamSchema", () => {
    it("should validate with all params", () => {
      const { error } = patientNoteAttachmentParamSchema.validate({
        params: { patientId: 1, id: 2, fileId: 3 }, query: {}, body: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing fileId", () => {
      const { error } = patientNoteAttachmentParamSchema.validate({
        params: { patientId: 1, id: 2 }, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("createPatientNoteSchema", () => {
    it("should validate with patientId and content", () => {
      const { error } = createPatientNoteSchema.validate({
        params: { patientId: 1 }, query: {}, body: { content: "Test" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing content", () => {
      const { error } = createPatientNoteSchema.validate({
        params: { patientId: 1 }, query: {}, body: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject missing patientId", () => {
      const { error } = createPatientNoteSchema.validate({
        params: {}, query: {}, body: { content: "Test" },
      });
      expect(error).toBeDefined();
    });
  });

  describe("updatePatientNoteSchema", () => {
    it("should validate with both params and body", () => {
      const { error } = updatePatientNoteSchema.validate({
        params: { patientId: 1, id: 2 }, query: {}, body: { content: "Updated" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing patientId", () => {
      const { error } = updatePatientNoteSchema.validate({
        params: { id: 2 }, query: {}, body: { content: "Updated" },
      });
      expect(error).toBeDefined();
    });
  });
});

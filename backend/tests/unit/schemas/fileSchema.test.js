const { listFilesSchema } = require("../../../src/schemas/fileSchema");

describe("fileSchema", () => {
  describe("listFilesSchema", () => {
    it("should validate with patientId param and no folderId", () => {
      const { error, value } = listFilesSchema.validate({
        params: { patientId: 1 },
        query: {},
        body: {},
      });
      expect(error).toBeUndefined();
      expect(value.params.patientId).toBe(1);
    });

    it("should validate with patientId and folderId", () => {
      const { error, value } = listFilesSchema.validate({
        params: { patientId: 1 },
        query: { folderId: 5 },
        body: {},
      });
      expect(error).toBeUndefined();
      expect(value.query.folderId).toBe(5);
    });

    it("should validate with null folderId", () => {
      const { error } = listFilesSchema.validate({
        params: { patientId: 1 },
        query: { folderId: null },
        body: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing patientId", () => {
      const { error } = listFilesSchema.validate({
        params: {},
        query: {},
        body: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject negative patientId", () => {
      const { error } = listFilesSchema.validate({
        params: { patientId: -1 },
        query: {},
        body: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject non-integer patientId", () => {
      const { error } = listFilesSchema.validate({
        params: { patientId: 1.5 },
        query: {},
        body: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject negative folderId", () => {
      const { error } = listFilesSchema.validate({
        params: { patientId: 1 },
        query: { folderId: -5 },
        body: {},
      });
      expect(error).toBeDefined();
    });
  });
});

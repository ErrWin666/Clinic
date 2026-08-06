const { createPatientSchema, updatePatientSchema, listPatientSchema, autocompleteSchema } = require("../../../src/schemas/patientSchema");

describe("Patient Schema Validation", () => {
  const validPatient = {
    fullName: "John Doe",
    birthDate: "1990-01-15",
    gender: "male",
    phoneNumber: "1234567890",
  };

  describe("createPatientSchema", () => {
    it("should pass with valid data", () => {
      const { error } = createPatientSchema.validate({
        body: validPatient,
        query: {},
        params: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing fullName", () => {
      const { error } = createPatientSchema.validate({
        body: { ...validPatient, fullName: undefined },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject fullName too short (< 2 chars)", () => {
      const { error } = createPatientSchema.validate({
        body: { ...validPatient, fullName: "A" },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject invalid gender", () => {
      const { error } = createPatientSchema.validate({
        body: { ...validPatient, gender: "other" },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject invalid patientType", () => {
      const { error } = createPatientSchema.validate({
        body: { ...validPatient, patientType: "invalid" },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject invalid birthDate format", () => {
      const { error } = createPatientSchema.validate({
        body: { ...validPatient, birthDate: "not-a-date" },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should accept valid patientType", () => {
      for (const type of ["regular", "guardian", "child"]) {
        const { error } = createPatientSchema.validate({
          body: { ...validPatient, patientType: type },
          query: {},
          params: {},
        });
        expect(error).toBeUndefined();
      }
    });
  });

  describe("listPatientSchema", () => {
    it("should pass with valid pagination", () => {
      const { error } = listPatientSchema.validate({
        body: {},
        query: { page: 1, pageSize: 20 },
        params: {},
      });
      expect(error).toBeUndefined();
    });

    it("should accept valid gender filter", () => {
      const { error } = listPatientSchema.validate({
        body: {},
        query: { gender: "male" },
        params: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject invalid gender filter", () => {
      const { error } = listPatientSchema.validate({
        body: {},
        query: { gender: "other" },
        params: {},
      });
      expect(error).toBeDefined();
    });
  });
});

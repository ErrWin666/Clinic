const { createRelationshipSchema } = require("../../../src/schemas/relationshipSchema");

describe("Relationship Schema Validation", () => {
  const validRelationship = {
    relatedPatientId: 2,
    relationType: "father",
  };

  it("should pass with valid data", () => {
    const { error } = createRelationshipSchema.validate({
      body: validRelationship,
      query: {},
      params: { patientId: 1 },
    });
    expect(error).toBeUndefined();
  });

  it("should accept all valid relationTypes", () => {
    for (const type of ["father", "mother", "guardian", "single-father", "single-mother"]) {
      const { error } = createRelationshipSchema.validate({
        body: { ...validRelationship, relationType: type },
        query: {},
        params: { patientId: 1 },
      });
      expect(error).toBeUndefined();
    }
  });

  it("should reject missing relatedPatientId", () => {
    const { error } = createRelationshipSchema.validate({
      body: { relationType: "father" },
      query: {},
      params: { patientId: 1 },
    });
    expect(error).toBeDefined();
  });

  it("should reject invalid relationType", () => {
    const { error } = createRelationshipSchema.validate({
      body: { ...validRelationship, relationType: "invalid" },
      query: {},
      params: { patientId: 1 },
    });
    expect(error).toBeDefined();
  });
});

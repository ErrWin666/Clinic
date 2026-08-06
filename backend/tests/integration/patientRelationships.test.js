const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Patient Relationship API Integration", () => {
  let agent;
  let adultId;
  let childId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    const adultRes = await agent.post("/api/patients").send({
      fullName: "API Adult",
      birthDate: "1980-01-01",
      gender: "male",
      phoneNumber: "5550001",
    });
    adultId = adultRes.body.data.id;

    const childRes = await agent.post("/api/patients").send({
      fullName: "API Child",
      birthDate: "2010-01-01",
      gender: "female",
      phoneNumber: "5550002",
    });
    childId = childRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("POST /api/patients/:patientId/relationships", () => {
    it("should create a valid relationship", async () => {
      const res = await agent
        .post(`/api/patients/${adultId}/relationships`)
        .send({ relatedPatientId: childId, relationType: "father" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.guardianId).toBe(adultId);
      expect(res.body.data.childId).toBe(childId);
    });

    it("should reject self-link with 400", async () => {
      const res = await agent
        .post(`/api/patients/${adultId}/relationships`)
        .send({ relatedPatientId: adultId, relationType: "guardian" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject duplicate with 409", async () => {
      const res = await agent
        .post(`/api/patients/${adultId}/relationships`)
        .send({ relatedPatientId: childId, relationType: "mother" });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject child-to-child with 400", async () => {
      const child2Res = await agent.post("/api/patients").send({
        fullName: "API Child 2",
        birthDate: "2012-01-01",
        gender: "male",
        phoneNumber: "5550003",
      });
      const child2Id = child2Res.body.data.id;

      const res = await agent
        .post(`/api/patients/${childId}/relationships`)
        .send({ relatedPatientId: child2Id, relationType: "guardian" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/patients/:patientId/relationships", () => {
    it("should list relationships for a patient", async () => {
      const res = await agent.get(`/api/patients/${adultId}/relationships`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("DELETE /api/patients/:patientId/relationships/:relationshipId", () => {
    it("should delete a relationship and revert patientType", async () => {
      const adultRes = await agent.post("/api/patients").send({
        fullName: "Delete Rel Adult",
        birthDate: "1975-01-01",
        gender: "male",
        phoneNumber: "5550004",
      });
      const newAdultId = adultRes.body.data.id;

      const childRes = await agent.post("/api/patients").send({
        fullName: "Delete Rel Child",
        birthDate: "2011-01-01",
        gender: "female",
        phoneNumber: "5550005",
      });
      const newChildId = childRes.body.data.id;

      const relRes = await agent
        .post(`/api/patients/${newAdultId}/relationships`)
        .send({ relatedPatientId: newChildId, relationType: "father" });
      const relId = relRes.body.data.id;

      const delRes = await agent.delete(
        `/api/patients/${newAdultId}/relationships/${relId}`
      );
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const adultAfter = await agent.get(`/api/patients/${newAdultId}`);
      expect(adultAfter.body.data.patientType).toBe("regular");
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get(`/api/patients/${adultId}/relationships`);
      expect(res.status).toBe(401);
    });
  });
});

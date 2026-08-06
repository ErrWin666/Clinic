const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Middleware Integration", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("auth middleware", () => {
    it("should return 401 without cookie", async () => {
      const res = await request(app).get("/api/patients");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/patients")
        .set("Cookie", "accessToken=invalidtoken");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should allow access with valid cookie", async () => {
      const res = await agent.get("/api/patients");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("validate middleware", () => {
    it("should reject invalid patient creation with 400", async () => {
      const res = await agent.post("/api/patients").send({
        fullName: "A",
        gender: "invalid",
        phoneNumber: "123",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing required fields", async () => {
      const res = await agent.post("/api/patients").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("error handler middleware", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await agent.get("/api/nonexistent-route");
      expect(res.status).toBe(404);
    });
  });

  describe("notFound handler", () => {
    it("should return 404 for non-existent patient", async () => {
      const res = await agent.get("/api/patients/99999");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

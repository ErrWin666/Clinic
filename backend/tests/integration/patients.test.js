const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Patient API Integration", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("POST /api/patients", () => {
    it("should create a patient", async () => {
      const res = await agent
        .post("/api/patients")
        .send({
          fullName: "Integration Patient",
          birthDate: "1990-01-15",
          gender: "male",
          phoneNumber: "1234567890",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayId).toBe("P-0001");
    });

    it("should validate required fields", async () => {
      const res = await agent
        .post("/api/patients")
        .send({ fullName: "Missing Fields" });
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/patients", () => {
    it("should return paginated list", async () => {
      const res = await agent.get("/api/patients?page=1&pageSize=10");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should filter by age range", async () => {
      await agent.post("/api/patients").send({
        fullName: "Young Patient",
        birthDate: "2015-01-01",
        gender: "male",
        phoneNumber: "2222222222",
      });
      await agent.post("/api/patients").send({
        fullName: "Old Patient",
        birthDate: "1960-01-01",
        gender: "female",
        phoneNumber: "3333333333",
      });

      const res = await agent.get("/api/patients?minAge=5&maxAge=20");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const names = res.body.data.map((p) => p.fullName);
      expect(names).toContain("Young Patient");
      expect(names).not.toContain("Old Patient");
    });
  });

  describe("GET /api/patients/:id", () => {
    it("should return patient by id", async () => {
      const createRes = await agent
        .post("/api/patients")
        .send({
          fullName: "Get By ID",
          birthDate: "1985-03-20",
          gender: "female",
          phoneNumber: "5555555555",
        });
      const id = createRes.body.data.id;
      const res = await agent.get(`/api/patients/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Get By ID");
    });

    it("should return 404 for non-existent patient", async () => {
      const res = await agent.get("/api/patients/99999");
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/patients/autocomplete", () => {
    it("should return matching patients", async () => {
      const res = await agent.get("/api/patients/autocomplete?q=Integration");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /api/patients/:id", () => {
    it("should update patient", async () => {
      const createRes = await agent
        .post("/api/patients")
        .send({
          fullName: "To Update",
          birthDate: "2000-01-01",
          gender: "male",
          phoneNumber: "7777777777",
        });
      const id = createRes.body.data.id;
      const res = await agent
        .put(`/api/patients/${id}`)
        .send({ fullName: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe("Updated Name");
    });
  });

  describe("DELETE /api/patients/:id", () => {
    it("should delete patient", async () => {
      const createRes = await agent
        .post("/api/patients")
        .send({
          fullName: "To Delete",
          birthDate: "2000-01-01",
          gender: "female",
          phoneNumber: "8888888888",
        });
      const id = createRes.body.data.id;
      const res = await agent.delete(`/api/patients/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Unauthorized access", () => {
    it("should block access without auth", async () => {
      const res = await request(app).get("/api/patients");
      expect(res.status).toBe(401);
    });
  });
});

const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Auth & Setup Integration", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("GET /api/setup/check-admin", () => {
    it("should return adminExists=false when no admin", async () => {
      const res = await request(app).get("/api/setup/check-admin");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.adminExists).toBe(false);
    });
  });

  describe("POST /api/setup/create-admin", () => {
    it("should create admin successfully", async () => {
      const res = await request(app)
        .post("/api/setup/create-admin")
        .send({
          username: "admin",
          password: "admin123",
          confirmPassword: "admin123",
          clinicName: "Eye Clinic",
          currency: "USD",
          language: "ar",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe("admin");
    });

    it("should reject duplicate admin", async () => {
      const res = await request(app)
        .post("/api/setup/create-admin")
        .send({
          username: "admin2",
          password: "admin123",
          confirmPassword: "admin123",
          clinicName: "Eye Clinic",
          currency: "USD",
          language: "ar",
        });
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials and set cookies", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "admin123" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe("admin");
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("accessToken"))).toBe(true);
    });

    it("should reject wrong password with 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "wrongpass" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/session-status", () => {
    it("should return 401 without auth cookie", async () => {
      const res = await request(app).get("/api/auth/session-status");
      expect(res.status).toBe(401);
    });

    it("should return session with valid cookie", async () => {
      const agent = await getAuthCookie(app);
      const res = await agent.get("/api/auth/session-status");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe("admin");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const agent = await getAuthCookie(app);
      const res = await agent.post("/api/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

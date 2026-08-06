const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { User } = require("../../src/models");

describe("E2E: Auth & RBAC Flow", () => {
  let adminAgent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    adminAgent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Authentication", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should reject login with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "wrongpassword",
      });
      expect(res.status).toBe(401);
    });

    it("should reject login with non-existent user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "nonexistent",
        password: "password",
      });
      expect(res.status).toBe(401);
    });

    it("should reject login with missing fields", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
      });
      expect(res.status).toBe(400);
    });

    it("should get session status when authenticated", async () => {
      const res = await adminAgent.get("/api/auth/session-status");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should reject session status without auth", async () => {
      const res = await request(app).get("/api/auth/session-status");
      expect(res.status).toBe(401);
    });

    it("should refresh token", async () => {
      const res = await adminAgent.post("/api/auth/refresh-token");
      expect(res.status).toBe(200);
    });

    it("should logout successfully", async () => {
      const res = await adminAgent.post("/api/auth/logout");
      expect(res.status).toBe(200);
    });

    it("should reject authenticated endpoints after logout", async () => {
      const res = await adminAgent.get("/api/patients");
      expect(res.status).toBe(401);
    });
  });

  describe("RBAC: Role-based access control", () => {
    let doctorAgent, receptionistAgent, viewerAgent;

    beforeAll(async () => {
      // Create users with different roles
      await User.create({
        username: "doctor1",
        password: "doctor123",
        role: "doctor",
      });
      await User.create({
        username: "receptionist1",
        password: "recept123",
        role: "receptionist",
      });
      await User.create({
        username: "viewer1",
        password: "viewer123",
        role: "viewer",
      });

      doctorAgent = request.agent(app);
      await doctorAgent
        .post("/api/auth/login")
        .send({ username: "doctor1", password: "doctor123" })
        .expect(200);

      receptionistAgent = request.agent(app);
      await receptionistAgent
        .post("/api/auth/login")
        .send({ username: "receptionist1", password: "recept123" })
        .expect(200);

      viewerAgent = request.agent(app);
      await viewerAgent
        .post("/api/auth/login")
        .send({ username: "viewer1", password: "viewer123" })
        .expect(200);
    });

    describe("Admin role", () => {
      let agent;
      beforeAll(async () => {
        agent = await getAuthCookie(app);
      });

      it("should access patients", async () => {
        const res = await agent.get("/api/patients");
        expect(res.status).toBe(200);
      });

      it("should access inventory write", async () => {
        const res = await agent.post("/api/products").send({
          name: "Admin Product",
          category: "frames",
          costingMethod: "fifo",
        });
        expect(res.status).toBe(201);
      });

      it("should access settings", async () => {
        const res = await agent.get("/api/settings");
        expect(res.status).toBe(200);
      });

      it("should access users", async () => {
        const res = await agent.get("/api/users");
        expect(res.status).toBe(200);
      });
    });

    describe("Doctor role", () => {
      it("should read patients", async () => {
        const res = await doctorAgent.get("/api/patients");
        expect(res.status).toBe(200);
      });

      it("should read inventory", async () => {
        const res = await doctorAgent.get("/api/products");
        expect(res.status).toBe(200);
      });

      it("should not write inventory", async () => {
        const res = await doctorAgent.post("/api/products").send({
          name: "Doctor Product",
          category: "frames",
          costingMethod: "fifo",
        });
        expect(res.status).toBe(403);
      });

      it("should access settings (no RBAC restriction)", async () => {
        const res = await doctorAgent.get("/api/settings");
        expect(res.status).toBe(200);
      });

      it("should not access users", async () => {
        const res = await doctorAgent.get("/api/users");
        expect(res.status).toBe(403);
      });

      it("should read dashboard", async () => {
        const res = await doctorAgent.get("/api/dashboard/stats");
        expect(res.status).toBe(200);
      });
    });

    describe("Receptionist role", () => {
      it("should read patients", async () => {
        const res = await receptionistAgent.get("/api/patients");
        expect(res.status).toBe(200);
      });

      it("should write patients", async () => {
        const res = await receptionistAgent.post("/api/patients").send({
          fullName: "Receptionist Created",
          birthDate: "1990-01-01",
          gender: "male",
          phoneNumber: "5551110000",
        });
        expect(res.status).toBe(201);
      });

      it("should write inventory", async () => {
        const res = await receptionistAgent.post("/api/products").send({
          name: "Recept Product",
          category: "supplies",
          costingMethod: "fifo",
        });
        expect(res.status).toBe(201);
      });

      it("should access settings (no RBAC restriction)", async () => {
        const res = await receptionistAgent.get("/api/settings");
        expect(res.status).toBe(200);
      });

      it("should not access users", async () => {
        const res = await receptionistAgent.get("/api/users");
        expect(res.status).toBe(403);
      });
    });

    describe("Viewer role", () => {
      it("should read patients", async () => {
        const res = await viewerAgent.get("/api/patients");
        expect(res.status).toBe(200);
      });

      it("should write patients (no RBAC restriction on patient routes)", async () => {
        const res = await viewerAgent.post("/api/patients").send({
          fullName: "Viewer Created",
          birthDate: "1990-01-01",
          gender: "male",
          phoneNumber: "5551113333",
        });
        // Patient routes don't have requirePermission - accessible to any authenticated user
        expect(res.status).toBe(201);
      });

      it("should read inventory", async () => {
        const res = await viewerAgent.get("/api/products");
        expect(res.status).toBe(200);
      });

      it("should not write inventory", async () => {
        const res = await viewerAgent.post("/api/products").send({
          name: "Viewer Product",
          category: "frames",
          costingMethod: "fifo",
        });
        expect(res.status).toBe(403);
      });

      it("should access settings (no RBAC restriction)", async () => {
        const res = await viewerAgent.get("/api/settings");
        expect(res.status).toBe(200);
      });

      it("should not access users", async () => {
        const res = await viewerAgent.get("/api/users");
        expect(res.status).toBe(403);
      });

      it("should read dashboard", async () => {
        const res = await viewerAgent.get("/api/dashboard/stats");
        expect(res.status).toBe(200);
      });
    });

    describe("Unauthenticated access", () => {
      it("should reject all endpoints without auth", async () => {
        const endpoints = [
          { method: "get", path: "/api/patients" },
          { method: "get", path: "/api/products" },
          { method: "get", path: "/api/appointments" },
          { method: "get", path: "/api/invoices" },
          { method: "get", path: "/api/settings" },
          { method: "get", path: "/api/users" },
          { method: "get", path: "/api/suppliers" },
          { method: "get", path: "/api/stock/movements" },
        ];

        for (const ep of endpoints) {
          const res = await request(app)[ep.method](ep.path);
          expect(res.status).toBe(401);
        }
      });
    });
  });
});

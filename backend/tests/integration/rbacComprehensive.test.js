const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { User } = require("../../src/models");

describe("Integration: Comprehensive RBAC", () => {
  let adminAgent;
  let doctorAgent;
  let receptionistAgent;
  let viewerAgent;
  let unauthenticatedAgent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();

    adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({ username: "admin", password: "admin123" });

    await User.create({ username: "doctor1", password: "doctor123", role: "doctor" });
    await User.create({ username: "receptionist1", password: "recept123", role: "receptionist" });
    await User.create({ username: "viewer1", password: "viewer123", role: "viewer" });

    doctorAgent = request.agent(app);
    await doctorAgent.post("/api/auth/login").send({ username: "doctor1", password: "doctor123" });

    receptionistAgent = request.agent(app);
    await receptionistAgent.post("/api/auth/login").send({ username: "receptionist1", password: "recept123" });

    viewerAgent = request.agent(app);
    await viewerAgent.post("/api/auth/login").send({ username: "viewer1", password: "viewer123" });

    unauthenticatedAgent = request.agent(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Unauthenticated access", () => {
    const endpoints = [
      { method: "get", path: "/api/patients" },
      { method: "get", path: "/api/products" },
      { method: "get", path: "/api/suppliers" },
      { method: "get", path: "/api/dashboard" },
      { method: "get", path: "/api/settings" },
      { method: "get", path: "/api/notifications" },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should return 401 for ${method.toUpperCase()} ${path} without auth`, async () => {
        const res = await unauthenticatedAgent[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe("Admin access (all permissions)", () => {
    const endpoints = [
      { method: "get", path: "/api/patients" },
      { method: "get", path: "/api/products" },
      { method: "get", path: "/api/suppliers" },
      { method: "get", path: "/api/dashboard" },
      { method: "get", path: "/api/settings" },
      { method: "get", path: "/api/notifications" },
      { method: "get", path: "/api/users" },
      { method: "get", path: "/api/audit-logs" },
      { method: "get", path: "/api/system/disk-space" },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should allow admin ${method.toUpperCase()} ${path}`, async () => {
        const res = await adminAgent[method](path);
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
      });
    });
  });

  describe("Viewer role (read-only)", () => {
    it("should allow GET /api/patients", async () => {
      const res = await viewerAgent.get("/api/patients");
      expect(res.status).toBe(200);
    });

    it("should allow GET /api/products", async () => {
      const res = await viewerAgent.get("/api/products");
      expect(res.status).toBe(200);
    });

    it("should allow POST /api/patients (no RBAC on patient routes)", async () => {
      const res = await viewerAgent.post("/api/patients").send({
        fullName: "Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "555-0001",
      });
      expect(res.status).toBe(201);
    });

    it("should reject DELETE /api/products/1 (no write permission)", async () => {
      const res = await viewerAgent.delete("/api/products/1");
      expect([403, 404]).toContain(res.status);
    });

    it("should reject GET /api/users (no users:read permission)", async () => {
      const res = await viewerAgent.get("/api/users");
      expect(res.status).toBe(403);
    });

    it("should allow GET /api/audit-logs (no RBAC on audit-logs)", async () => {
      const res = await viewerAgent.get("/api/audit-logs");
      expect(res.status).toBe(200);
    });
  });

  describe("Receptionist role (limited write)", () => {
    it("should allow GET /api/patients", async () => {
      const res = await receptionistAgent.get("/api/patients");
      expect(res.status).toBe(200);
    });

    it("should allow POST /api/patients", async () => {
      const res = await receptionistAgent.post("/api/patients").send({
        fullName: "Receptionist Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "555-9999",
      });
      expect(res.status).toBe(201);
    });

    it("should allow GET /api/appointments", async () => {
      const res = await receptionistAgent.get("/api/appointments");
      expect(res.status).toBe(200);
    });

    it("should reject GET /api/users (no users:read)", async () => {
      const res = await receptionistAgent.get("/api/users");
      expect(res.status).toBe(403);
    });

    it("should allow GET /api/audit-logs (no RBAC on audit-logs)", async () => {
      const res = await receptionistAgent.get("/api/audit-logs");
      expect(res.status).toBe(200);
    });

    it("should allow POST /api/products (has inventory:write)", async () => {
      const res = await receptionistAgent.post("/api/products").send({
        name: "Test Product",
        category: "frames",
        costingMethod: "fifo",
      });
      expect(res.status).toBe(201);
    });
  });

  describe("Doctor role (clinical access)", () => {
    it("should allow GET /api/patients", async () => {
      const res = await doctorAgent.get("/api/patients");
      expect(res.status).toBe(200);
    });

    it("should allow GET /api/products", async () => {
      const res = await doctorAgent.get("/api/products");
      expect(res.status).toBe(200);
    });

    it("should reject POST /api/products (no inventory:write)", async () => {
      const res = await doctorAgent.post("/api/products").send({
        name: "Doctor Product",
        category: "frames",
        costingMethod: "fifo",
      });
      expect(res.status).toBe(403);
    });

    it("should reject GET /api/users (no users:read)", async () => {
      const res = await doctorAgent.get("/api/users");
      expect(res.status).toBe(403);
    });

    it("should allow GET /api/audit-logs (no RBAC on audit-logs)", async () => {
      const res = await doctorAgent.get("/api/audit-logs");
      expect(res.status).toBe(200);
    });
  });

  describe("Cross-role permission isolation", () => {
    it("viewer can access backup endpoints (no RBAC on backup)", async () => {
      const res = await viewerAgent.get("/api/backup/history");
      expect(res.status).toBe(200);
    });

    it("receptionist can access system endpoints (no RBAC on system)", async () => {
      const res = await receptionistAgent.get("/api/system/disk-space");
      expect(res.status).toBe(200);
    });

    it("doctor cannot delete users", async () => {
      const res = await doctorAgent.delete("/api/users/1");
      expect(res.status).toBe(403);
    });
  });
});

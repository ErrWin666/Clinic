const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const fs = require("fs");
const path = require("path");
const config = require("../../src/config");

describe("Backup API Integration", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
    const backupDir = path.resolve(config.backup.dir);
    if (fs.existsSync(backupDir)) {
      try {
        fs.rmSync(backupDir, { recursive: true, force: true });
      } catch {
        try { fs.rmSync(backupDir, { recursive: true, force: true }); } catch {}
      }
    }
  });

  describe("POST /api/backup/create", () => {
    it("should create a backup", async () => {
      const res = await agent.post("/api/backup/create");
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.filename).toContain(".zip");
      expect(res.body.data.status).toBe("success");
    });
  });

  describe("GET /api/backup/history", () => {
    it("should return backup history", async () => {
      const res = await agent.get("/api/backup/history");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/backup/download/:filename", () => {
    it("should download an existing backup", async () => {
      const createRes = await agent.post("/api/backup/create");
      const filename = createRes.body.data.filename;

      const res = await agent.get(`/api/backup/download/${filename}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-disposition"]).toContain("attachment");
    });

    it("should return 404 for non-existent backup", async () => {
      const res = await agent.get("/api/backup/download/nonexistent.zip");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/backup/restore", () => {
    it("should restore from an existing backup", async () => {
      const createRes = await agent.post("/api/backup/create");
      const filename = createRes.body.data.filename;

      const res = await agent.post("/api/backup/restore").send({ filename });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 for non-existent backup", async () => {
      const res = await agent.post("/api/backup/restore").send({ filename: "nonexistent.zip" });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/backup/history");
      expect(res.status).toBe(401);
    });
  });
});

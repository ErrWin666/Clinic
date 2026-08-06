const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { Settings } = require("../../src/models");

describe("Settings API Integration", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    await Settings.bulkCreate([
      { key: "clinic.name", value: JSON.stringify("API Test Clinic"), category: "clinic" },
      { key: "clinic.currency", value: JSON.stringify("EUR"), category: "clinic" },
      { key: "ui.theme", value: JSON.stringify("dark"), category: "ui" },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("GET /api/settings", () => {
    it("should return grouped settings", async () => {
      const res = await agent.get("/api/settings");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clinic).toBeDefined();
      expect(res.body.data.clinic["name"]).toBe("API Test Clinic");
    });
  });

  describe("PUT /api/settings", () => {
    it("should update settings", async () => {
      const res = await agent.put("/api/settings").send({
        settings: [
          { key: "clinic.name", value: "Updated API Clinic", category: "clinic" },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("PUT /api/settings/admin", () => {
    it("should update admin with correct password", async () => {
      const res = await agent.put("/api/settings/admin").send({
        currentPassword: "admin123",
        username: "updatedadmin",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe("updatedadmin");
    });

    it("should reject wrong password with 401", async () => {
      const res = await agent.put("/api/settings/admin").send({
        currentPassword: "wrongpass",
        username: "anothername",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/settings");
      expect(res.status).toBe(401);
    });
  });
});

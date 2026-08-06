const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const fs = require("fs");
const path = require("path");
const config = require("../../src/config");

describe("Files & Folders API Integration", () => {
  let agent;
  let patientId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    const patientRes = await agent.post("/api/patients").send({
      fullName: "File API Patient",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "5559001",
    });
    patientId = patientRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestDB();
    const uploadDir = path.resolve(config.upload.dir);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  describe("POST /api/patients/:patientId/folders", () => {
    it("should create a root folder", async () => {
      const res = await agent
        .post(`/api/patients/${patientId}/folders`)
        .send({ name: "APIRootFolder" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("APIRootFolder");
    });

    it("should create a sub folder", async () => {
      const rootRes = await agent
        .post(`/api/patients/${patientId}/folders`)
        .send({ name: "APIParentFolder" });
      const parentId = rootRes.body.data.id;

      const res = await agent
        .post(`/api/patients/${patientId}/folders`)
        .send({ name: "APISubFolder", parentFolderId: parentId });
      expect(res.status).toBe(201);
      expect(res.body.data.parentFolderId).toBe(parentId);
    });
  });

  describe("GET /api/patients/:patientId/folders", () => {
    it("should list folders for a patient", async () => {
      const res = await agent.get(`/api/patients/${patientId}/folders`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /api/patients/:patientId/folders/:folderId", () => {
    it("should rename a folder", async () => {
      const folderRes = await agent
        .post(`/api/patients/${patientId}/folders`)
        .send({ name: "RenameMeAPI" });
      const folderId = folderRes.body.data.id;

      const res = await agent
        .put(`/api/patients/${patientId}/folders/${folderId}`)
        .send({ name: "RenamedAPI" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("RenamedAPI");
    });
  });

  describe("POST /api/patients/:patientId/files", () => {
    it("should upload a file", async () => {
      const res = await agent
        .post(`/api/patients/${patientId}/files`)
        .attach("file", Buffer.from([0x25, 0x50, 0x44, 0x46, ...Buffer.from("test content")]), "api-test-upload.pdf");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("api-test-upload.pdf");
    });
  });

  describe("GET /api/patients/:patientId/files", () => {
    it("should list files for a patient", async () => {
      const res = await agent.get(`/api/patients/${patientId}/files`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const items = res.body.data.rows || res.body.data;
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("DELETE /api/patients/:patientId/folders/:folderId", () => {
    it("should delete a folder", async () => {
      const folderRes = await agent
        .post(`/api/patients/${patientId}/folders`)
        .send({ name: "DeleteMeAPI" });
      const folderId = folderRes.body.data.id;

      const res = await agent.delete(`/api/patients/${patientId}/folders/${folderId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 without auth for folders", async () => {
      const res = await request(app).get(`/api/patients/${patientId}/folders`);
      expect(res.status).toBe(401);
    });

    it("should return 401 without auth for files", async () => {
      const res = await request(app).get(`/api/patients/${patientId}/files`);
      expect(res.status).toBe(401);
    });
  });
});

const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB } = require("../helpers/setup");
const { User } = require("../../src/models");
const RecoveryService = require("../../src/services/RecoveryService");
const config = require("../../src/config");
const path = require("path");
const os = require("os");
const fs = require("fs").promises;

describe("Auth Recovery Integration", () => {
  let recoveryService;
  let tmpDir;
  let originalTokenPath;

  beforeAll(async () => {
    await setupTestDB();
    recoveryService = new RecoveryService();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "recovery-int-"));
    originalTokenPath = config.recovery.tokenPath;
    config.recovery.tokenPath = path.join(tmpDir, "recovery-token.txt");
  });

  afterAll(async () => {
    config.recovery.tokenPath = originalTokenPath;
    await teardownTestDB();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function createAdminWithRecovery(username = "admin") {
    // Clean up any existing user with this username (paranoid soft-delete
    // would leave the unique constraint in place, so force-destroy).
    await User.destroy({ where: { username }, force: true });
    const user = await User.create({
      username,
      password: "admin123",
      role: "admin",
      isAdmin: true,
    });
    const code = recoveryService.generateRecoveryCode();
    const hash = await recoveryService.hashRecoveryCode(code);
    await user.update({ recoveryCodeHash: hash });
    const token = recoveryService.generateFileToken();
    await recoveryService.writeTokenFile(token);
    return { user, code, token };
  }

  describe("POST /api/auth/recover (Layer 1: recovery code)", () => {
    it("should reset password with valid recovery code and return a new code", async () => {
      const { code } = await createAdminWithRecovery();
      const res = await request(app).post("/api/auth/recover").send({
        username: "admin",
        recoveryCode: code,
        newPassword: "newPass123",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recoveryCode).toBeDefined();
      expect(res.body.data.recoveryCode).not.toBe(code);

      // Login with new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "newPass123" });
      expect(loginRes.status).toBe(200);

      // Old recovery code should no longer work (rotated)
      const res2 = await request(app).post("/api/auth/recover").send({
        username: "admin",
        recoveryCode: code,
        newPassword: "anotherPass123",
      });
      expect(res2.body.success).toBe(false);
    });

    it("should reject invalid recovery code", async () => {
      await createAdminWithRecovery();
      const res = await request(app).post("/api/auth/recover").send({
        username: "admin",
        recoveryCode: "WRONG-CODE-1234-ABCD-EFGH",
        newPassword: "newPass123",
      });
      expect(res.body.success).toBe(false);
    });

    it("should reject non-existent user", async () => {
      const res = await request(app).post("/api/auth/recover").send({
        username: "ghost",
        recoveryCode: "WRONG-CODE-1234-ABCD-EFGH",
        newPassword: "newPass123",
      });
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/recover-via-file (Layer 2: server file)", () => {
    it("should reset password via file token (localhost)", async () => {
      await createAdminWithRecovery();
      // supertest runs locally so req.ip should be 127.0.0.1
      const res = await request(app).post("/api/auth/recover-via-file").send({
        username: "admin",
        newPassword: "fileReset123",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recoveryCode).toBeDefined();

      // Login with new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "fileReset123" });
      expect(loginRes.status).toBe(200);

      // File token should have rotated — old token no longer valid implicitly
      // (we can't easily test "old token fails" since the endpoint reads the
      // file fresh each time; rotation means the file content changed)
      const newToken = await recoveryService.readTokenFile();
      expect(newToken).toBeDefined();
    });

    it("should reject when token file is missing", async () => {
      await createAdminWithRecovery();
      const oldPath = config.recovery.tokenPath;
      config.recovery.tokenPath = path.join(tmpDir, "nonexistent.txt");
      const res = await request(app).post("/api/auth/recover-via-file").send({
        username: "admin",
        newPassword: "fileReset123",
      });
      expect(res.body.success).toBe(false);
      config.recovery.tokenPath = oldPath;
    });
  });

  describe("POST /api/auth/regenerate-recovery-code (auth required)", () => {
    it("should regenerate recovery code when authenticated", async () => {
      await createAdminWithRecovery();
      const agent = request.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ username: "admin", password: "admin123" })
        .expect(200);

      const res = await agent.post("/api/auth/regenerate-recovery-code");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recoveryCode).toBeDefined();
    });

    it("should reject without auth", async () => {
      const res = await request(app).post("/api/auth/regenerate-recovery-code");
      expect(res.status).toBe(401);
    });
  });
});

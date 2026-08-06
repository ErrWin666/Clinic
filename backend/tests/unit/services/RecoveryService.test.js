const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const RecoveryService = require("../../../src/services/RecoveryService");

describe("RecoveryService", () => {
  let recoveryService;
  let tmpDir;
  let originalTokenPath;

  beforeAll(async () => {
    recoveryService = new RecoveryService();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "recovery-test-"));
    originalTokenPath = recoveryService._tokenPath;
    // Override config path via prototype so tests don't touch the real file.
    const config = require("../../../src/config");
    config.recovery.tokenPath = path.join(tmpDir, "recovery-token.txt");
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("generateRecoveryCode", () => {
    it("should generate a 24-char code with dashes (5 groups of 4)", () => {
      const code = recoveryService.generateRecoveryCode();
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code.length).toBe(24);
    });

    it("should generate different codes each time", () => {
      const a = recoveryService.generateRecoveryCode();
      const b = recoveryService.generateRecoveryCode();
      expect(a).not.toBe(b);
    });

    it("should not use ambiguous characters (0, O, 1, I)", () => {
      for (let i = 0; i < 50; i++) {
        const code = recoveryService.generateRecoveryCode();
        expect(code).not.toMatch(/[01OI]/);
      }
    });
  });

  describe("hashRecoveryCode / verifyRecoveryCode", () => {
    it("should hash and verify a valid code", async () => {
      const code = recoveryService.generateRecoveryCode();
      const hash = await recoveryService.hashRecoveryCode(code);
      expect(hash).not.toBe(code);
      const ok = await recoveryService.verifyRecoveryCode(code, hash);
      expect(ok).toBe(true);
    });

    it("should reject a wrong code", async () => {
      const code = recoveryService.generateRecoveryCode();
      const hash = await recoveryService.hashRecoveryCode(code);
      const ok = await recoveryService.verifyRecoveryCode("WRONG-CODE-1234-ABCD-EFGH", hash);
      expect(ok).toBe(false);
    });

    it("should return false for null hash", async () => {
      const ok = await recoveryService.verifyRecoveryCode("any", null);
      expect(ok).toBe(false);
    });

    it("should return false when bcrypt compare throws", async () => {
      const ok = await recoveryService.verifyRecoveryCode("any", "invalid-hash-not-bcrypt");
      expect(ok).toBe(false);
    });

    it("should return false and log error when bcrypt throws", async () => {
      const bcrypt = require("bcrypt");
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockImplementation(() => {
        throw new Error("bcrypt internal error");
      });
      try {
        const ok = await recoveryService.verifyRecoveryCode("any", "somehash");
        expect(ok).toBe(false);
      } finally {
        bcrypt.compare = originalCompare;
      }
    });
  });

  describe("generateFileToken", () => {
    it("should generate a 64-char hex string", () => {
      const token = recoveryService.generateFileToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should generate different tokens each time", () => {
      const a = recoveryService.generateFileToken();
      const b = recoveryService.generateFileToken();
      expect(a).not.toBe(b);
    });
  });

  describe("writeTokenFile / readTokenFile", () => {
    it("should write and read a token", async () => {
      const token = recoveryService.generateFileToken();
      await recoveryService.writeTokenFile(token);
      const read = await recoveryService.readTokenFile();
      expect(read).toBe(token);
    });

    it("should return null when file does not exist", async () => {
      const config = require("../../../src/config");
      const old = config.recovery.tokenPath;
      config.recovery.tokenPath = path.join(tmpDir, "nonexistent.txt");
      const read = await recoveryService.readTokenFile();
      expect(read).toBeNull();
      config.recovery.tokenPath = old;
    });

    it("should return null on non-ENOENT read error", async () => {
      // Mock fs.readFile to throw a non-ENOENT error
      const fs = require("fs").promises;
      const originalReadFile = fs.readFile;
      fs.readFile = jest.fn().mockRejectedValue(Object.assign(new Error("Permission denied"), { code: "EACCES" }));
      const read = await recoveryService.readTokenFile();
      expect(read).toBeNull();
      fs.readFile = originalReadFile;
    });

    it("should return null when file has no RECOVERY_TOKEN line", async () => {
      const config = require("../../../src/config");
      const old = config.recovery.tokenPath;
      const noTokenPath = path.join(tmpDir, "no-token.txt");
      await fs.writeFile(noTokenPath, "some other content\nwithout recovery token");
      config.recovery.tokenPath = noTokenPath;
      const read = await recoveryService.readTokenFile();
      expect(read).toBeNull();
      config.recovery.tokenPath = old;
    });
  });

  describe("rotateTokenFile", () => {
    it("should write a new token and return it", async () => {
      const newToken = await recoveryService.rotateTokenFile();
      expect(newToken).toMatch(/^[0-9a-f]{64}$/);
      const read = await recoveryService.readTokenFile();
      expect(read).toBe(newToken);
    });
  });
});

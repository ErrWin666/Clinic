const SystemService = require("../../../src/services/SystemService");

describe("SystemService", () => {
  let systemService;

  beforeAll(() => {
    systemService = new SystemService();
  });

  describe("getDiskSpace", () => {
    it("should return disk space info with correct structure", async () => {
      const result = await systemService.getDiskSpace();
      expect(result).toBeDefined();
      expect(result.used).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.percentage).toBeDefined();
      expect(result.status).toBeDefined();
      expect(typeof result.used).toBe("number");
      expect(typeof result.total).toBe("number");
      expect(typeof result.percentage).toBe("number");
      expect(typeof result.status).toBe("string");
    });

    it("should return status ok when percentage is low", async () => {
      const result = await systemService.getDiskSpace();
      expect(result.percentage).toBeLessThan(70);
      expect(result.status).toBe("ok");
    });

    it("should return total as 500GB", async () => {
      const result = await systemService.getDiskSpace();
      expect(result.total).toBe(500 * 1024 * 1024 * 1024);
    });

    it("should calculate percentage correctly", async () => {
      const result = await systemService.getDiskSpace();
      const expectedPct = Math.round((result.used / result.total) * 100);
      expect(result.percentage).toBe(expectedPct);
    });

    it("should handle inaccessible directories gracefully", async () => {
      const fs = require("fs");
      const originalReaddir = fs.readdirSync;
      // Make one dir throw, but keep others working
      let callCount = 0;
      fs.readdirSync = jest.fn((dir) => {
        callCount++;
        if (callCount === 1) throw new Error("Permission denied");
        return [];
      });
      const result = await systemService.getDiskSpace();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      fs.readdirSync = originalReaddir;
    });

    it("should traverse subdirectories and sum file sizes", async () => {
      const fs = require("fs");
      const path = require("path");
      const config = require("../../../src/config");

      // Create a temp structure with files
      const uploadDir = path.resolve(config.upload.dir);
      fs.mkdirSync(path.join(uploadDir, "subdir"), { recursive: true });
      fs.writeFileSync(path.join(uploadDir, "testfile.bin"), Buffer.alloc(1024));
      fs.writeFileSync(path.join(uploadDir, "subdir", "nested.bin"), Buffer.alloc(512));

      const result = await systemService.getDiskSpace();
      expect(result.used).toBeGreaterThanOrEqual(1536);

      // Cleanup
      fs.unlinkSync(path.join(uploadDir, "testfile.bin"));
      fs.unlinkSync(path.join(uploadDir, "subdir", "nested.bin"));
      fs.rmdirSync(path.join(uploadDir, "subdir"));
    });

    it("should return critical status when percentage >= 90", async () => {
      const fs = require("fs");
      const originalReaddir = fs.readdirSync;
      const originalStat = fs.statSync;

      // Mock to simulate huge used space in first dir only
      let callCount = 0;
      fs.readdirSync = jest.fn(() => {
        callCount++;
        if (callCount === 1) return ["bigfile"];
        return [];
      });
      fs.statSync = jest.fn((p) => ({
        isDirectory: () => false,
        size: 475 * 1024 * 1024 * 1024, // 475GB — 95%
      }));

      const result = await systemService.getDiskSpace();
      expect(result.percentage).toBeGreaterThanOrEqual(90);
      expect(result.status).toBe("critical");

      fs.readdirSync = originalReaddir;
      fs.statSync = originalStat;
    });

    it("should return warning status when percentage >= 70 and < 90", async () => {
      const fs = require("fs");
      const originalReaddir = fs.readdirSync;
      const originalStat = fs.statSync;

      // Mock to simulate 75% usage in first dir only
      let callCount = 0;
      fs.readdirSync = jest.fn(() => {
        callCount++;
        if (callCount === 1) return ["bigfile"];
        return [];
      });
      fs.statSync = jest.fn((p) => ({
        isDirectory: () => false,
        size: 375 * 1024 * 1024 * 1024, // 375GB — 75%
      }));

      const result = await systemService.getDiskSpace();
      expect(result.percentage).toBeGreaterThanOrEqual(70);
      expect(result.percentage).toBeLessThan(90);
      expect(result.status).toBe("warning");

      fs.readdirSync = originalReaddir;
      fs.statSync = originalStat;
    });
  });
});

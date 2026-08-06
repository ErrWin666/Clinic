const fs = require("fs");
const os = require("os");
const path = require("path");

const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "clinic-uploads-"));
process.env.UPLOAD_DIR = uploadDir;

const { deleteUploadFile, isInside } = require("../../../src/utils/fileDelete");

describe("fileDelete", () => {
  afterAll(() => {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  describe("isInside", () => {
    it("returns true for a nested path", () => {
      expect(isInside("/root", path.resolve("/root", "a/b.txt"))).toBe(true);
    });

    it("returns false for the root itself", () => {
      expect(isInside("/root", path.resolve("/root"))).toBe(false);
    });

    it("returns false for a parent escape", () => {
      expect(isInside("/root", path.resolve("/root", "../evil.txt"))).toBe(false);
    });

    it("returns false for a sibling prefixed directory", () => {
      expect(isInside("/root", path.resolve("/root-evil/x.txt"))).toBe(false);
    });
  });

  describe("deleteUploadFile", () => {
    it("returns false for an empty path", () => {
      expect(deleteUploadFile("")).toBe(false);
      expect(deleteUploadFile(null)).toBe(false);
    });

    it("deletes a file inside the upload root", () => {
      const target = path.join(uploadDir, "keep.txt");
      fs.writeFileSync(target, "data");
      expect(deleteUploadFile("keep.txt")).toBe(true);
      expect(fs.existsSync(target)).toBe(false);
    });

    it("returns false when the file does not exist", () => {
      expect(deleteUploadFile("missing.txt")).toBe(false);
    });

    it("refuses to delete outside the upload root", () => {
      const outside = path.join(os.tmpdir(), `clinic-outside-${Date.now()}.txt`);
      fs.writeFileSync(outside, "secret");
      const relative = path.relative(uploadDir, outside);
      expect(deleteUploadFile(relative)).toBe(false);
      expect(fs.existsSync(outside)).toBe(true);
      fs.rmSync(outside, { force: true });
    });

    it("refuses absolute paths outside the upload root", () => {
      const outside = path.join(os.tmpdir(), `clinic-abs-${Date.now()}.txt`);
      fs.writeFileSync(outside, "secret");
      expect(deleteUploadFile(outside)).toBe(false);
      expect(fs.existsSync(outside)).toBe(true);
      fs.rmSync(outside, { force: true });
    });
  });
});

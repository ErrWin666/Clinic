const { upload, uploadImage, uploadClinicLogo, verifyMagicBytes } = require("../../../src/utils/fileUpload");
const CustomError = require("../../../src/utils/CustomError");
const fs = require("fs");
const path = require("path");

describe("fileUpload", () => {
  describe("upload (multer instance)", () => {
    it("should be a multer middleware instance", () => {
      expect(upload).toBeDefined();
      expect(upload.single).toBeDefined();
      expect(upload.array).toBeDefined();
      expect(upload.fields).toBeDefined();
    });
  });

  describe("uploadImage (multer instance)", () => {
    it("should be a multer middleware instance", () => {
      expect(uploadImage).toBeDefined();
      expect(uploadImage.single).toBeDefined();
    });
  });

  describe("fileFilter (via upload.fileFilter)", () => {
    const fileFilter = upload.fileFilter;

    it("should accept jpg files", () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: "photo.jpg", mimetype: "image/jpeg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept png files", () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: "image.png", mimetype: "image/png" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept pdf files", () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: "doc.pdf", mimetype: "application/pdf" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject exe files", () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: "virus.exe" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
      expect(cb.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should reject bat files", () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: "script.bat" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should reject files with no extension", () => {
      const cb = jest.fn();
      fileFilter({}, { originalname: "noextension" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("imageFilter (via uploadImage.fileFilter)", () => {
    const imageFilter = uploadImage.fileFilter;

    it("should accept jpg files", () => {
      const cb = jest.fn();
      imageFilter({}, { originalname: "avatar.jpg", mimetype: "image/jpeg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept png files", () => {
      const cb = jest.fn();
      imageFilter({}, { originalname: "avatar.png", mimetype: "image/png" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept gif files", () => {
      const cb = jest.fn();
      imageFilter({}, { originalname: "animation.gif", mimetype: "image/gif" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject pdf files (not an image)", () => {
      const cb = jest.fn();
      imageFilter({}, { originalname: "document.pdf" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
      expect(cb.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should reject doc files (not an image)", () => {
      const cb = jest.fn();
      imageFilter({}, { originalname: "document.doc" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("storage destination logic", () => {
    it("should resolve patient path when patientId is in params", () => {
      const cb = jest.fn();
      const storage = upload.storage;
      storage.getDestination({ params: { patientId: "5" } }, { originalname: "test.jpg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining("patients"));
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining("5"));
    });

    it("should resolve admin path when no patientId", () => {
      const cb = jest.fn();
      const storage = upload.storage;
      storage.getDestination({ params: {} }, { originalname: "test.jpg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining("admin"));
    });

    it("should resolve admin path when id is in params but patientId is not (no fallback)", () => {
      const cb = jest.fn();
      const storage = upload.storage;
      storage.getDestination({ params: { id: "10" } }, { originalname: "test.jpg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining("admin"));
    });
  });

  describe("storage filename logic", () => {
    it("should generate filename with timestamp and uuid", () => {
      const cb = jest.fn();
      const storage = upload.storage;
      storage.getFilename({}, { originalname: "photo.JPG" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^img-\d+-[a-f0-9]+\.jpg$/));
    });

    it("should preserve extension from original name", () => {
      const cb = jest.fn();
      const storage = upload.storage;
      storage.getFilename({}, { originalname: "doc.PDF" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/\.pdf$/));
    });
  });

  describe("checkMimeMatch (via fileFilter)", () => {
    it("should reject jpg with wrong mimetype", () => {
      const cb = jest.fn();
      upload.fileFilter({}, { originalname: "photo.jpg", mimetype: "application/octet-stream" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should reject png with wrong mimetype", () => {
      const cb = jest.fn();
      upload.fileFilter({}, { originalname: "image.png", mimetype: "text/plain" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should accept webp with correct mimetype", () => {
      const cb = jest.fn();
      upload.fileFilter({}, { originalname: "img.webp", mimetype: "image/webp" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept docx with correct mimetype", () => {
      const cb = jest.fn();
      upload.fileFilter({}, { originalname: "doc.docx", mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept xlsx with correct mimetype", () => {
      const cb = jest.fn();
      upload.fileFilter({}, { originalname: "sheet.xlsx", mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });

  describe("imageFilter MIME mismatch", () => {
    it("should reject jpg image with wrong mimetype", () => {
      const cb = jest.fn();
      uploadImage.fileFilter({}, { originalname: "avatar.jpg", mimetype: "application/octet-stream" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should accept webp image with correct mimetype", () => {
      const cb = jest.fn();
      uploadImage.fileFilter({}, { originalname: "avatar.webp", mimetype: "image/webp" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });

  describe("uploadClinicLogo", () => {
    it("should be a multer middleware instance", () => {
      expect(uploadClinicLogo).toBeDefined();
      expect(uploadClinicLogo.single).toBeDefined();
    });

    it("should accept png images", () => {
      const cb = jest.fn();
      uploadClinicLogo.fileFilter({}, { originalname: "logo.png", mimetype: "image/png" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject pdf files", () => {
      const cb = jest.fn();
      uploadClinicLogo.fileFilter({}, { originalname: "doc.pdf", mimetype: "application/pdf" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("should generate logo filename with timestamp", () => {
      const cb = jest.fn();
      uploadClinicLogo.storage.getFilename({}, { originalname: "logo.PNG" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^logo-\d+-[a-f0-9]+\.png$/));
    });

    it("should resolve clinic directory for destination", () => {
      const cb = jest.fn();
      uploadClinicLogo.storage.getDestination({}, { originalname: "logo.png" }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining("clinic"));
    });
  });

  describe("verifyMagicBytes", () => {
    it("should call next() when no files", () => {
      const next = jest.fn();
      verifyMagicBytes({ files: undefined, file: undefined }, {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next() for file types without magic bytes", () => {
      const next = jest.fn();
      const req = { file: { originalname: "file.txt", path: "/tmp/test.txt" } };
      verifyMagicBytes(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should call next() when file has valid magic bytes", () => {
      const next = jest.fn();
      const tmpPath = path.join(require("os").tmpdir(), "test_magic.png");
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
      fs.writeFileSync(tmpPath, pngBuffer);
      const req = { file: { originalname: "test.png", path: tmpPath } };
      verifyMagicBytes(req, {}, next);
      expect(next).toHaveBeenCalledWith();
      try { fs.unlinkSync(tmpPath); } catch {}
    });

    it("should reject file with invalid magic bytes", () => {
      const next = jest.fn();
      const tmpPath = path.join(require("os").tmpdir(), "test_bad.png");
      fs.writeFileSync(tmpPath, Buffer.from([0x00, 0x00, 0x00, 0x00]));
      const req = { file: { originalname: "fake.png", path: tmpPath } };
      verifyMagicBytes(req, {}, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it("should handle multiple files via req.files", () => {
      const next = jest.fn();
      const os = require("os");
      const tmpPath1 = path.join(os.tmpdir(), "test_multi1.txt");
      const tmpPath2 = path.join(os.tmpdir(), "test_multi2.txt");
      fs.writeFileSync(tmpPath1, Buffer.from("test1"));
      fs.writeFileSync(tmpPath2, Buffer.from("test2"));
      const req = {
        files: {
          field1: [{ originalname: "file1.txt", path: tmpPath1 }],
          field2: [{ originalname: "file2.txt", path: tmpPath2 }],
        },
      };
      verifyMagicBytes(req, {}, next);
      expect(next).toHaveBeenCalledWith();
      try { fs.unlinkSync(tmpPath1); } catch {}
      try { fs.unlinkSync(tmpPath2); } catch {}
    });

    it("should skip when file read fails", () => {
      const next = jest.fn();
      const req = { file: { originalname: "test.png", path: "/nonexistent/path/file.png" } };
      verifyMagicBytes(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it("should reject when file is too small for magic bytes", () => {
      const next = jest.fn();
      const tmpPath = path.join(require("os").tmpdir(), "test_small.png");
      fs.writeFileSync(tmpPath, Buffer.from([0x89]));
      const req = { file: { originalname: "small.png", path: tmpPath } };
      verifyMagicBytes(req, {}, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      try { fs.unlinkSync(tmpPath); } catch {}
    });
  });
});

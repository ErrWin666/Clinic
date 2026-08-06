const multer = require("multer");
const path = require("path");
const config = require("../config");
const ENUMS = require("../constants/enums");
const CustomError = require("./CustomError");
const MESSAGES = require("../constants/messages");

const MAGIC_BYTES = {
  jpg: [0xFF, 0xD8, 0xFF],
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  pdf: [0x25, 0x50, 0x44, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46],
  docx: [0x50, 0x4B, 0x03, 0x04],
  xlsx: [0x50, 0x4B, 0x03, 0x04],
};

function checkMagicBytes(file, ext) {
  const expected = MAGIC_BYTES[ext];
  if (!expected) return true;
  if (!file.buffer || file.buffer.length < expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (file.buffer[i] !== expected[i]) return false;
  }
  return true;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const patientId = req.params.patientId;
    const uploadPath = patientId
      ? path.resolve(config.upload.dir, "patients", String(patientId))
      : path.resolve(config.upload.dir, "admin");
    const fs = require("fs");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const { v4: uuidv4 } = require("uuid");
    const shortId = uuidv4().split("-")[0];
    const baseName = `img-${Date.now()}-${shortId}`;
    cb(null, `${baseName}${ext}`);
  },
});

const MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  webp: "image/webp",
};

function checkMimeMatch(file, ext) {
  const expectedMime = MIME_MAP[ext];
  if (expectedMime && file.mimetype !== expectedMime) {
    return false;
  }
  return true;
}

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const allowed = ENUMS.ALLOWED_FILE_TYPES;
  if (!allowed.includes(ext)) {
    return cb(new CustomError(MESSAGES.FILE.INVALID_TYPE, "INVALID_FILE_TYPE", 400));
  }
  if (!checkMimeMatch(file, ext)) {
    return cb(new CustomError(MESSAGES.FILE.INVALID_TYPE, "INVALID_FILE_TYPE", 400));
  }
  cb(null, true);
}

function imageFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const allowed = ENUMS.ALLOWED_IMAGE_TYPES;
  if (!allowed.includes(ext)) {
    return cb(new CustomError(MESSAGES.FILE.INVALID_TYPE, "INVALID_FILE_TYPE", 400));
  }
  if (!checkMimeMatch(file, ext)) {
    return cb(new CustomError(MESSAGES.FILE.INVALID_TYPE, "INVALID_FILE_TYPE", 400));
  }
  cb(null, true);
}

function verifyMagicBytes(req, res, next) {
  const files = req.files ? Object.values(req.files).flat() : req.file ? [req.file] : [];
  const fs = require("fs");
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const expected = MAGIC_BYTES[ext];
    if (!expected) continue;
    try {
      const fd = fs.openSync(file.path, "r");
      const buf = Buffer.alloc(expected.length);
      fs.readSync(fd, buf, 0, expected.length, 0);
      fs.closeSync(fd);
      for (let i = 0; i < expected.length; i++) {
        if (buf[i] !== expected[i]) {
          fs.unlinkSync(file.path);
          return next(new CustomError(MESSAGES.FILE.INVALID_TYPE, "INVALID_FILE_TYPE", 400));
        }
      }
    } catch {
      // File read error — skip magic bytes check
    }
  }
  next();
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: ENUMS.MAX_FILE_SIZE },
});

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: ENUMS.MAX_IMAGE_SIZE },
});

// Clinic logo storage — saves to uploads/clinic/ directory
const clinicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require("fs");
    const dir = path.resolve(config.upload.dir, "clinic");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const { v4: uuidv4 } = require("uuid");
    const shortId = uuidv4().split("-")[0];
    cb(null, `logo-${Date.now()}-${shortId}${ext}`);
  },
});

const uploadClinicLogo = multer({
  storage: clinicStorage,
  fileFilter: imageFilter,
  limits: { fileSize: ENUMS.MAX_IMAGE_SIZE },
});

module.exports = { upload, uploadImage, uploadClinicLogo, verifyMagicBytes };

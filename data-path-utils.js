const fs = require("fs");
const path = require("path");
const os = require("os");
const log = require("electron-log");

const MIN_FREE_SPACE_BYTES = 100 * 1024 * 1024; // 100 MB

const UNSAFE_PATHS = [
  "C:\\Windows",
  "C:\\Program Files",
  "C:\\Program Files (x86)",
  "C:\\ProgramData",
];

function isPathSafe(dirPath) {
  const resolved = path.resolve(dirPath);
  for (const unsafe of UNSAFE_PATHS) {
    if (resolved.toLowerCase().startsWith(unsafe.toLowerCase())) {
      return false;
    }
  }
  // Reject root of drive (e.g. C:\, D:\)
  if (/^[A-Za-z]:\\$/.test(resolved)) {
    return false;
  }
  return true;
}

function checkDiskSpace(dirPath) {
  try {
    const stat = fs.statfsSync(dirPath);
    return {
      free: stat.bavail * stat.bsize,
      total: stat.blocks * stat.bsize,
    };
  } catch {
    return { free: 0, total: 0 };
  }
}

function getFilesystemType(dirPath) {
  try {
    const stat = fs.statfsSync(dirPath);
    // Common type values on Windows: 0 = unknown, 1 = NTFS, 2 = FAT32, etc.
    // On Linux/macOS this varies. We return a best-effort string.
    if (process.platform === "win32") {
      // fs.statfsSync on Windows doesn't expose filesystem name directly.
      // We use a heuristic: if path starts with a drive letter, check via fs
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

function isWritable(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

function getDataSize(dirPath) {
  let totalSize = 0;
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          totalSize += fs.statSync(fullPath).size;
        } catch {
          // skip
        }
      }
    }
  }
  walk(dirPath);
  return totalSize;
}

function validateDataPath(dirPath) {
  if (!dirPath || typeof dirPath !== "string") {
    return { valid: false, error: "Invalid path" };
  }

  const resolved = path.resolve(dirPath);

  if (!isPathSafe(resolved)) {
    return { valid: false, error: "This location is not safe for data storage" };
  }

  // Check if path exists (if it's a file, reject)
  if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) {
    return { valid: false, error: "Path is a file, not a directory" };
  }

  // Check writability
  if (!isWritable(resolved)) {
    return { valid: false, error: "This location is not writable" };
  }

  // Check disk space
  const space = checkDiskSpace(resolved);
  if (space.free > 0 && space.free < MIN_FREE_SPACE_BYTES) {
    return {
      valid: false,
      error: "Not enough space on this drive (minimum 100 MB required)",
      freeSpace: space.free,
    };
  }

  return {
    valid: true,
    freeSpace: space.free,
    totalSpace: space.total,
  };
}

module.exports = {
  validateDataPath,
  isPathSafe,
  isWritable,
  checkDiskSpace,
  getFilesystemType,
  getDataSize,
  MIN_FREE_SPACE_BYTES,
};

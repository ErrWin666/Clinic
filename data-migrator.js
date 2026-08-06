const fs = require("fs");
const path = require("path");
const log = require("electron-log");
const { validateDataPath, getDataSize, checkDiskSpace } = require("./data-path-utils");

const DATA_SUBDIRS = ["uploads", "backups", "logs"];
const DB_FILES = ["database.sqlite", "database.sqlite-wal", "database.sqlite-shm"];

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function countFiles(dirPath) {
  let count = 0;
  if (!fs.existsSync(dirPath)) return 0;
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        count++;
      }
    }
  }
  walk(dirPath);
  return count;
}

async function migrateData(currentPath, newPath, options = {}) {
  const { onProgress } = options;
  const resolvedNew = path.resolve(newPath);

  log.info(`Starting data migration from ${currentPath} to ${resolvedNew}`);

  // 1. Validate new path
  const validation = validateDataPath(resolvedNew);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 2. Check disk space vs data size
  const dataSize = getDataSize(currentPath);
  const space = checkDiskSpace(resolvedNew);
  if (space.free > 0 && dataSize > space.free) {
    return {
      success: false,
      error: `Not enough space. Data size: ${(dataSize / 1024 / 1024).toFixed(1)} MB, Free: ${(space.free / 1024 / 1024).toFixed(1)} MB`,
    };
  }

  // 3. Create subdirectories in new path
  for (const sub of DATA_SUBDIRS) {
    fs.mkdirSync(path.join(resolvedNew, sub), { recursive: true });
  }

  // 4. Copy database files
  if (onProgress) onProgress(10, "Copying database...");
  for (const dbFile of DB_FILES) {
    const src = path.join(currentPath, dbFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(resolvedNew, dbFile));
    }
  }

  // 5. Copy subdirectories
  let copiedDirs = 0;
  for (const sub of DATA_SUBDIRS) {
    const src = path.join(currentPath, sub);
    if (fs.existsSync(src)) {
      if (onProgress) onProgress(10 + Math.round((copiedDirs / DATA_SUBDIRS.length) * 70), `Copying ${sub}...`);
      copyDirRecursive(src, path.join(resolvedNew, sub));
    }
    copiedDirs++;
  }

  // 6. Verify file counts
  if (onProgress) onProgress(85, "Verifying...");
  for (const sub of DATA_SUBDIRS) {
    const src = path.join(currentPath, sub);
    const dest = path.join(resolvedNew, sub);
    if (fs.existsSync(src)) {
      const srcCount = countFiles(src);
      const destCount = countFiles(dest);
      if (srcCount !== destCount) {
        log.error(`Verification failed for ${sub}: ${srcCount} vs ${destCount} files`);
        return { success: false, error: `Verification failed: ${sub} directory file count mismatch` };
      }
    }
  }

  // 7. Verify database files
  for (const dbFile of DB_FILES) {
    const src = path.join(currentPath, dbFile);
    const dest = path.join(resolvedNew, dbFile);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      return { success: false, error: `Verification failed: ${dbFile} missing in destination` };
    }
  }

  if (onProgress) onProgress(100, "Migration complete");
  log.info("Data migration completed and verified successfully");

  return { success: true, newPath: resolvedNew };
}

function cleanupOldData(oldPath) {
  for (const sub of DATA_SUBDIRS) {
    const dir = path.join(oldPath, sub);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  for (const dbFile of DB_FILES) {
    const file = path.join(oldPath, dbFile);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
  log.info(`Old data cleaned up at ${oldPath}`);
}

module.exports = { migrateData, cleanupOldData };

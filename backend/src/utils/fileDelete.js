const fs = require("fs");
const path = require("path");
const config = require("../config");
const logger = require("./logger");

function isInside(root, target) {
  const rel = path.relative(root, target);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function deleteUploadFile(relativePath) {
  if (!relativePath) return false;
  const uploadRoot = path.resolve(config.upload.dir);
  const filePath = path.resolve(uploadRoot, relativePath);
  if (!isInside(uploadRoot, filePath)) {
    logger.warn({ message: "Blocked upload delete outside upload root", relativePath });
    return false;
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

module.exports = { deleteUploadFile, isInside };

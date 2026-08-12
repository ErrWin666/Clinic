const path = require("path");
const config = require("../config");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { isInside } = require("../utils/fileDelete");
const { hasPermission } = require("./rbac");

const uploadRoot = path.resolve(config.upload.dir);

function uploadAuth(req, res, next) {
  try {
    const requestedPath = decodeURIComponent(req.path).replace(/^[/\\]+/, "");
    const fullPath = path.resolve(uploadRoot, requestedPath);

    if (!isInside(uploadRoot, fullPath)) {
      throw new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403);
    }

    const relPath = path.relative(uploadRoot, fullPath);
    const parts = relPath.split(path.sep);

    if (parts[0] === "admin") {
      if (req.user.role !== "admin") {
        throw new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403);
      }
      return next();
    }

    // Clinic-wide assets (e.g. clinic logo) — readable by any authenticated user
    if (parts[0] === "clinic") {
      return next();
    }

    // Clinic notes attachments — readable by any authenticated user with notes access
    if (parts[0] === "clinic-notes") {
      if (!hasPermission(req.user.role, "notes:read")) {
        throw new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403);
      }
      return next();
    }

    // Patient files — require files:read permission
    if (parts[0] === "patients" && /^\d+$/.test(parts[1] || "")) {
      if (!hasPermission(req.user.role, "files:read")) {
        throw new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403);
      }
      return next();
    }

    throw new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403);
  } catch (error) {
    if (error instanceof CustomError) {
      return next(error);
    }
    next(new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403));
  }
}

module.exports = uploadAuth;

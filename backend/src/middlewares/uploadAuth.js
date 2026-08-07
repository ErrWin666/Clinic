const path = require("path");
const config = require("../config");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { isInside } = require("../utils/fileDelete");

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
      return next();
    }

    // TODO: bind patient file access to an explicit per-patient permission
    // once the business rule is defined. Today any authenticated user may
    // read patient attachments, which matches the current product behaviour.
    if (parts[0] === "patients" && /^\d+$/.test(parts[1] || "")) {
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

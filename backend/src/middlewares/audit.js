const { AuditLog } = require("../models");
const logger = require("../utils/logger");

const SENSITIVE_FIELDS = ["password", "currentPassword", "newPassword", "confirmPassword"];

function sanitizeBody(body) {
  const sanitized = { ...body };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
}

function auditLog(action) {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entity = req.baseUrl.replace("/api/", "").split("/")[0];
        const entityId = req.params.id ? parseInt(req.params.id, 10) : null;

        AuditLog.create({
          userId: req.user ? req.user.id : null,
          action,
          entity,
          entityId,
          changes: req.method !== "GET" ? JSON.stringify(sanitizeBody(req.body || {})) : null,
          ipAddress: req.ip,
        }).catch((err) => {
          logger.error({ message: "Failed to create audit log", error: err.message });
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

module.exports = auditLog;

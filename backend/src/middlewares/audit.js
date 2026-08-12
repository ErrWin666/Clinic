const { AuditLog } = require("../models");
const logger = require("../utils/logger");

const SENSITIVE_FIELDS = [
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "token",
  "secret",
  "apiKey",
  "botToken",
  "accessToken",
  "clientSecret",
  "apiSecret",
];

const SENSITIVE_PATTERNS = [/token/i, /secret/i, /password/i, /apikey/i];

function isSensitiveKey(key) {
  if (SENSITIVE_FIELDS.includes(key)) return true;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeBody(body) {
  const sanitized = { ...body };
  for (const field of Object.keys(sanitized)) {
    if (isSensitiveKey(field)) {
      sanitized[field] = "[REDACTED]";
    }
  }
  if (Array.isArray(sanitized.settings)) {
    sanitized.settings = sanitized.settings.map((item) => {
      if (item && typeof item.key === "string" && isSensitiveKey(item.key)) {
        return { ...item, value: "[REDACTED]" };
      }
      return item;
    });
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

const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");

const PERMISSIONS = {
  admin: ["*"],
  doctor: [
    "patients:read", "patients:write",
    "appointments:read", "appointments:write",
    "examinations:read", "examinations:write",
    "invoices:read",
    "files:read", "files:write",
    "dashboard:read",
    "reports:read",
    "inventory:read",
    "inventory:dispense",
    "notes:read", "notes:write",
  ],
  receptionist: [
    "patients:read", "patients:write",
    "appointments:read", "appointments:write",
    "invoices:read", "invoices:write",
    "files:read",
    "dashboard:read",
    "inventory:read",
    "inventory:write",
    "inventory:purchase",
    "inventory:finance",
    "notes:read", "notes:write",
  ],
  viewer: [
    "patients:read",
    "appointments:read",
    "examinations:read",
    "invoices:read",
    "files:read",
    "dashboard:read",
    "reports:read",
    "inventory:read",
    "notes:read",
  ],
};

function hasPermission(role, permission) {
  const perms = PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new CustomError(MESSAGES.COMMON.UNAUTHORIZED, "UNAUTHORIZED", 401));
    }
    if (!hasPermission(req.user.role, permission)) {
      return next(new CustomError(MESSAGES.COMMON.FORBIDDEN, "FORBIDDEN", 403));
    }
    next();
  };
}

module.exports = { requirePermission, hasPermission, PERMISSIONS };

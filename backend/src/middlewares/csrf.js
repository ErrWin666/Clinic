const config = require("../config");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function isSameOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  if (allowedOrigins === true) return true;
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.includes(origin);
  }
  return origin === allowedOrigins;
}

function csrfCheck(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Skip CSRF in test environment
  if (config.server.isTest) {
    return next();
  }

  // Telegram webhook is protected by its own secret token check
  if (req.path === "/telegram/webhook") {
    return next();
  }

  const isElectron = process.env.ELECTRON_APP === "true";
  if (isElectron) {
    return next();
  }

  const origin = req.headers["origin"];
  const referer = req.headers["referer"];

  const serverConfig = require("../config/server");
  const allowedOrigins = serverConfig.cors.origin;

  // If CORS is disabled (false), only same-origin requests are allowed.
  // Accept requests with no Origin header (same-origin browsers don't always send it)
  // or requests where Origin matches the Host header.
  if (allowedOrigins === false) {
    if (!origin) {
      return next();
    }
    const host = req.headers["host"];
    if (host && origin === `${req.protocol}://${host}`) {
      return next();
    }
    if (config.server.isDev) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: { code: "CSRF_DENIED", message: "Cross-origin request blocked" },
    });
  }

  if (allowedOrigins === true) {
    return next();
  }

  if (origin && isSameOrigin(origin, allowedOrigins)) {
    return next();
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isSameOrigin(refererOrigin, allowedOrigins)) {
        return next();
      }
    } catch {
      // Invalid referer URL — fall through to rejection
    }
  }

  if (config.server.isDev) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: { code: "CSRF_DENIED", message: "Cross-origin request blocked" },
  });
}

module.exports = csrfCheck;

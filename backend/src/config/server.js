const config = require("./index");

// CORS_ORIGIN accepts a comma-separated list, "*" to reflect any origin, or is
// omitted to keep the historical behaviour (any origin in dev, the local
// Vite dev server otherwise).
function resolveCorsOrigin() {
  const raw = config.server.corsOrigin;
  if (!raw) return config.server.isDev ? true : false;
  if (raw.trim() === "*") return true;
  const origins = raw.split(",").map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

module.exports = {
  port: config.server.port,
  cors: {
    origin: resolveCorsOrigin(),
    credentials: true,
  },
  bodyLimit: "10mb",
  rateLimit: {
    windowMs: config.security.loginRateLimitWindow,
    max: config.security.loginRateLimitMax,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: { code: "TOO_MANY_REQUESTS", message: "Too many login attempts, try again later" },
    },
  },
};

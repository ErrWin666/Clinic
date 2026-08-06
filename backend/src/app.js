const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const config = require("./config");
const serverConfig = require("./config/server");
const routes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middlewares/error");
const auth = require("./middlewares/auth");
const uploadAuth = require("./middlewares/uploadAuth");
const { apiLimiter } = require("./middlewares/rateLimit");
const sanitizeInput = require("./middlewares/sanitize");
const logger = require("./utils/logger");

const app = express();

app.set("trust proxy", config.server.trustProxy);

for (const warning of config.warnings) {
  logger.warn(warning);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(serverConfig.cors));
app.use(compression());
app.use(express.json({ limit: serverConfig.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: serverConfig.bodyLimit }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.path !== "/health" && req.path !== "/api/health") {
    logger[config.server.isDev ? "info" : "debug"](`${req.method} ${req.path}`);
  }
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiLimiter, sanitizeInput, routes);

app.use("/uploads", auth, uploadAuth, express.static(config.upload.dir));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

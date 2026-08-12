require("dotenv").config();
const crypto = require("crypto");

const isDev = (process.env.NODE_ENV || "development") === "development";
const isTest = process.env.NODE_ENV === "test";

// Warnings are collected here because logger depends on this module and
// requiring it back would create a circular dependency.
const warnings = [];

function requiredSecret(envVar) {
  const value = process.env[envVar];
  if (value) return value;
  if (!isDev && !isTest) {
    throw new Error(`${envVar} environment variable is required in production`);
  }
  // A per-process random secret keeps development usable while making sure a
  // well-known fallback can never be relied upon or leak into production.
  warnings.push(`${envVar} is not set; using an ephemeral random secret. Sessions reset on restart. Set it in .env.`);
  return crypto.randomBytes(48).toString("hex");
}

function parseTrustProxy(raw) {
  if (raw === undefined || raw === "") return false;
  if (raw === "true") return true;
  if (raw === "false") return false;
  const asNumber = Number(raw);
  return Number.isInteger(asNumber) ? asNumber : raw;
}

const config = {
  server: {
    port: parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    isDev,
    isTest,
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    corsOrigin: process.env.CORS_ORIGIN,
  },
  database: {
    dialect: process.env.DB_DIALECT || "sqlite",
    storage: process.env.DB_STORAGE || "./database.sqlite",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    migrate: process.env.DB_MIGRATE || "auto",
  },
  auth: {
    jwtSecret: requiredSecret("JWT_SECRET"),
    jwtRefreshSecret: requiredSecret("JWT_REFRESH_SECRET"),
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
  },
  security: {
    loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "5", 10),
    loginRateLimitWindow: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || "900000", 10),
  },
  app: {
    clinicName: process.env.CLINIC_NAME || "Eye Examination Clinic",
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "ar",
    defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    dir: process.env.LOG_DIR || "./logs",
  },
  upload: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  },
  backup: {
    dir: process.env.BACKUP_DIR || "./backups",
    scheduleDays: parseInt(process.env.BACKUP_SCHEDULE_DAYS || "7", 10),
  },
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED !== "false",
    lockDriver: process.env.SCHEDULER_LOCK_DRIVER || "db",
    lockTtlMs: parseInt(process.env.SCHEDULER_LOCK_TTL_MS || "600000", 10),
  },
  recovery: {
    tokenPath: process.env.RECOVERY_TOKEN_PATH || "./data/recovery-token.txt",
  },
  whatsappCloud: {
    apiVersion: process.env.WHATSAPP_CLOUD_API_VERSION || "v18.0",
    phoneNumberId: process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || "",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    apiBase: process.env.TELEGRAM_API_BASE || "https://api.telegram.org",
    pollingTimeout: parseInt(process.env.TELEGRAM_POLLING_TIMEOUT || "30", 10),
    pollingEnabled: process.env.TELEGRAM_POLLING_ENABLED !== "false",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  },
  smsMobileApi: {
    url: process.env.SMS_MOBILE_API_URL || "",
    apiKey: process.env.SMS_MOBILE_API_API_KEY || "",
    enabled: process.env.SMS_MOBILE_API_ENABLED === "true",
  },
  warnings,
};

module.exports = config;

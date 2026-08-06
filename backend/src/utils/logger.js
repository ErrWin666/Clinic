const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const config = require("../config");

const logDir = path.resolve(config.logging.dir);
const isTest = config.server.isTest;

const transports = [];
if (!isTest) {
  transports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      maxSize: "10m",
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: "error-%DATE%.log",
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      maxSize: "10m",
    })
  );
} else {
  // In test mode, add a silent transport so winston doesn't warn about
  // "no transports" — the real file transports would open handles that
  // prevent Jest from exiting cleanly.
  transports.push(new winston.transports.Console({ silent: true }));
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

if (config.server.isDev) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;

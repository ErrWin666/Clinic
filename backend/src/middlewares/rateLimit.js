const rateLimit = require("express-rate-limit");
const serverConfig = require("../config/server");
const ApiResponse = require("../utils/ApiResponse");

const isTest = process.env.NODE_ENV === "test";

// Tests drive the limiters with bare request stubs that have no Express app
// attached, which makes the built-in validations report false positives.
const validate = !isTest;

const loginLimiter = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: isTest ? 1000 : serverConfig.rateLimit.max,
  skipSuccessfulRequests: true,
  validate,
  handler: (req, res) => {
    return res.status(429).json(
      ApiResponse.error("TOO_MANY_REQUESTS", "Too many login attempts, try again later")
    );
  },
});

const refreshTokenLimiter = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: isTest ? 1000 : 30,
  skipSuccessfulRequests: true,
  validate,
  handler: (req, res) => {
    return res.status(429).json(
      ApiResponse.error("TOO_MANY_REQUESTS", "Too many token refresh attempts, try again later")
    );
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 200,
  validate,
  handler: (req, res) => {
    return res.status(429).json(
      ApiResponse.error("TOO_MANY_REQUESTS", "Too many requests, please slow down")
    );
  },
});

const recoverLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTest ? 1000 : 3,
  skipSuccessfulRequests: true,
  validate,
  handler: (req, res) => {
    return res.status(429).json(
      ApiResponse.error("TOO_MANY_REQUESTS", "Too many recovery attempts, try again later")
    );
  },
});

module.exports = { loginLimiter, refreshTokenLimiter, apiLimiter, recoverLimiter };

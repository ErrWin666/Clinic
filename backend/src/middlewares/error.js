const ApiResponse = require("../utils/ApiResponse");
const logger = require("../utils/logger");
const config = require("../config");

function errorHandler(err, req, res, next) {
  if (err.statusCode && err.isOperational) {
    return res.status(err.statusCode).json(ApiResponse.error(err.code, err.message, err.details || null));
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const message = config.server.isDev ? err.message : "Internal server error";
  return res.status(500).json(ApiResponse.error("INTERNAL_ERROR", message));
}

function notFoundHandler(req, res) {
  const message = config.server.isDev ? `Route ${req.method} ${req.path} not found` : "Resource not found";
  return res.status(404).json(ApiResponse.error("NOT_FOUND", message));
}

module.exports = { errorHandler, notFoundHandler };

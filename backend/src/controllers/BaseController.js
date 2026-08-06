const ApiResponse = require("../utils/ApiResponse");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const logger = require("../utils/logger");

class BaseController {
  static async executeOperation(fn, errorMessage = "Operation failed") {
    try {
      return await fn();
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      logger.error({ message: errorMessage, error: error.message, stack: error.stack });
      throw new CustomError(errorMessage, "INTERNAL_ERROR", 500);
    }
  }

  validateId(id) {
    return BaseController.validateId(id);
  }

  static validateId(id) {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
    }
    return parsed;
  }

  validateRequired(obj, field) {
    return BaseController.validateRequired(obj, field);
  }

  static validateRequired(obj, field) {
    return (
      obj != null &&
      Object.prototype.hasOwnProperty.call(obj, field) &&
      obj[field] !== undefined &&
      obj[field] !== null &&
      obj[field] !== ""
    );
  }

  sendSuccess(res, data, message, status = 200) {
    return BaseController.sendSuccess(res, data, message, status);
  }

  static sendSuccess(res, data, message, status = 200) {
    return res.status(status).json(ApiResponse.success(data, message));
  }

  sendPaginated(res, data, pagination, message) {
    return BaseController.sendPaginated(res, data, pagination, message);
  }

  static sendPaginated(res, data, pagination, message) {
    return res.status(200).json(ApiResponse.paginated(data, pagination, message));
  }
}

module.exports = BaseController;

const CustomError = require("../utils/CustomError");
const logger = require("../utils/logger");

class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async executeOperation(fn, errorMessage = "Operation failed", errorCode = "INTERNAL_ERROR") {
    try {
      return await fn();
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new CustomError("Duplicate entry already exists", "DUPLICATE_ENTRY", 409);
      }
      logger.error({ message: errorMessage, error: error.message, stack: error.stack });
      throw new CustomError(errorMessage, errorCode, 500);
    }
  }
}

module.exports = BaseService;

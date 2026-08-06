const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const authConfig = require("../config/auth");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const logger = require("../utils/logger");

async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new CustomError(MESSAGES.COMMON.UNAUTHORIZED, "UNAUTHORIZED", 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, authConfig.jwtSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new CustomError(MESSAGES.AUTH.TOKEN_EXPIRED, "TOKEN_EXPIRED", 401);
      }
      throw new CustomError(MESSAGES.COMMON.UNAUTHORIZED, "UNAUTHORIZED", 401);
    }

    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;

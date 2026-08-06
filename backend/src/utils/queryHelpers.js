const { Op } = require("sequelize");
const config = require("../config");

/**
 * Returns the case-insensitive LIKE operator for the active dialect.
 *
 * - SQLite: `Op.like` is already case-insensitive for ASCII.
 * - PostgreSQL: `Op.iLike` is the case-insensitive variant.
 *
 * Using this helper keeps search behaviour consistent across local (SQLite)
 * and cloud (PostgreSQL) deployments.
 */
function likeOp() {
  return config.database.dialect === "postgres" ? Op.iLike : Op.like;
}

/**
 * Escapes the SQL LIKE wildcards (`%`, `_`) and the backslash in a user-provided
 * search string so that literal characters are matched as-is. The caller is
 * still expected to wrap the result in `%…%` for a substring match.
 */
function escapeLike(value) {
  if (value === null || value === undefined) return value;
  return String(value).replace(/[%_\\]/g, "\\$&");
}

module.exports = { likeOp, escapeLike };

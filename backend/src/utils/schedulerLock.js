const { sequelize } = require("../database");
const { DataTypes } = require("sequelize");
const logger = require("./logger");
const config = require("../config");

// A simple, dialect-agnostic advisory lock backed by a Sequelize model.
// Works on SQLite (local) and PostgreSQL (cloud) without any extra dependency.
// The "redis" driver is a documented extension point for the future.
const SchedulerLock = sequelize.define(
  "SchedulerLock",
  {
    jobName: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    lockedAt: { type: DataTypes.DATE, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    owner: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "SchedulerLocks", timestamps: false }
);

async function ensureSchema() {
  await SchedulerLock.sync();
}

/**
 * Attempt to acquire a lock for `jobName`. Returns a handle if successful or
 * `null` if another runner currently holds the lock. Expired locks are
 * reclaimed automatically.
 *
 * @param {string} jobName  Unique name for the scheduled job.
 * @param {number} ttlMs    Lock time-to-live in milliseconds.
 * @returns {Promise<{release: () => Promise<void>} | null>}
 */
async function acquire(jobName, ttlMs = config.scheduler.lockTtlMs) {
  await ensureSchema();
  const now = new Date();
  const owner = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    // Reclaim any expired lock first.
    await SchedulerLock.destroy({ where: { jobName, expiresAt: { [require("sequelize").Op.lt]: now } } });
    await SchedulerLock.create({ jobName, lockedAt: now, expiresAt, owner });
    return {
      release: async () => {
        try {
          await SchedulerLock.destroy({ where: { jobName, owner } });
        } catch (error) {
          logger.warn({ message: `Failed to release scheduler lock for ${jobName}`, error: error.message });
        }
      },
    };
  } catch (error) {
    // Unique constraint violation means another runner holds the lock.
    logger.debug({ message: `Scheduler lock for ${jobName} held by another runner` });
    return null;
  }
}

/**
 * Run `fn` only if the lock for `jobName` can be acquired. The lock is always
 * released when `fn` settles.
 *
 * @returns {Promise<boolean>} `true` if `fn` ran, `false` if the lock was held.
 */
async function withLock(jobName, fn, ttlMs) {
  const handle = await acquire(jobName, ttlMs);
  if (!handle) return false;
  try {
    await fn();
    return true;
  } finally {
    await handle.release();
  }
}

module.exports = { SchedulerLock, acquire, withLock };

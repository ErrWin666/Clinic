const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");
const config = require("../config");
const logger = require("../utils/logger");

/**
 * RecoveryService — admin password recovery, 100% local, no external sending.
 *
 * Layer 1: Recovery Code (20-char random, stored as bcrypt hash, rotates after
 *          each successful recovery).
 * Layer 2: Server File Auto-Recovery (token file on disk, read automatically by
 *          the backend, restricted to localhost requests, rotates after each
 *          successful recovery).
 */
class RecoveryService {
  /**
   * Generate a human-friendly 20-char recovery code in the form
   * `XXXX-XXXX-XXXX-XXXX-XXXX` (uppercase A-Z0-9).
   */
  generateRecoveryCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    const segments = [];
    for (let s = 0; s < 5; s++) {
      let seg = "";
      for (let i = 0; i < 4; i++) {
        seg += alphabet[crypto.randomInt(0, alphabet.length)];
      }
      segments.push(seg);
    }
    return segments.join("-");
  }

  async hashRecoveryCode(code) {
    return bcrypt.hash(code, 10);
  }

  async verifyRecoveryCode(code, hash) {
    if (!hash) return false;
    try {
      return bcrypt.compare(code, hash);
    } catch (err) {
      logger.error("RecoveryService.verifyRecoveryCode error:", err.message);
      return false;
    }
  }

  /**
   * Generate a 64-char hex token for the server file.
   */
  generateFileToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  _tokenPath() {
    return path.resolve(config.recovery.tokenPath);
  }

  async writeTokenFile(token) {
    const filePath = this._tokenPath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const content = `RECOVERY_TOKEN=${token}\nGENERATED_AT=${new Date().toISOString()}\n`;
    await fs.writeFile(filePath, content, { mode: 0o600 });
    logger.info("Recovery token file written:", filePath);
  }

  async readTokenFile() {
    try {
      const content = await fs.readFile(this._tokenPath(), "utf8");
      const match = content.match(/^RECOVERY_TOKEN=([^\s]+)/m);
      return match ? match[1] : null;
    } catch (err) {
      if (err.code === "ENOENT") return null;
      logger.error("RecoveryService.readTokenFile error:", err.message);
      return null;
    }
  }

  async rotateTokenFile() {
    const newToken = this.generateFileToken();
    await this.writeTokenFile(newToken);
    return newToken;
  }
}

module.exports = RecoveryService;

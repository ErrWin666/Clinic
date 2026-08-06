const { Settings } = require("../models");
const config = require("../config");
const logger = require("../utils/logger");
const MESSAGES = require("../constants/messages");

/**
 * SmsMobileApiService — Layer 3 of the message cascade.
 * Uses an Android phone on the local network as an SMS gateway via the
 * SMSMobileAPI app. Cheaper than Twilio (~0.05 EGP/msg vs ~$0.05).
 *
 * The phone must be on the same network and reachable at the configured URL.
 * A short timeout (5s) ensures fast failure so the cascade can fall through
 * to the next layer (Twilio).
 */
class SmsMobileApiService {
  async getSettings() {
    const rows = await Settings.findAll({ where: { category: "sms_mobile_api" } });
    const settings = {};
    for (const row of rows) {
      const key = row.key.replace(/^sms_mobile_api\./, "");
      try {
        settings[key] = JSON.parse(row.value);
      } catch {
        settings[key] = row.value;
      }
    }
    return settings;
  }

  async updateSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
      const fullKey = `sms_mobile_api.${key}`;
      const existing = await Settings.findOne({ where: { key: fullKey } });
      const storedValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      if (existing) {
        await existing.update({ value: storedValue });
      } else {
        await Settings.create({ key: fullKey, value: storedValue, category: "sms_mobile_api" });
      }
    }
    return this.getSettings();
  }

  isEnabled() {
    return !!(config.smsMobileApi.enabled && config.smsMobileApi.url);
  }

  _headers() {
    const headers = { "Content-Type": "application/json" };
    if (config.smsMobileApi.apiKey) {
      headers["Authorization"] = `Bearer ${config.smsMobileApi.apiKey}`;
    }
    return headers;
  }

  /**
   * Send an SMS via the local Android phone.
   * Short timeout (5s) for fast cascade fallback.
   */
  async sendMessage(to, text) {
    if (!this.isEnabled()) {
      return { success: false, reason: "not_configured" };
    }

    try {
      const url = `${config.smsMobileApi.url}/send`;
      const response = await fetch(url, {
        method: "POST",
        headers: this._headers(),
        body: JSON.stringify({ to, text }),
        signal: AbortSignal.timeout(5000),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("SMSMobileAPI send failed:", result.message || result);
        return { success: false, error: result.message || "Send failed" };
      }

      logger.info(`SMSMobileAPI sent to ${to}`);
      return { success: true, messageId: result.messageId || result.id };
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        logger.warn("SMSMobileAPI timeout — phone may be unreachable");
        return { success: false, error: "timeout", reason: "phone_unreachable" };
      }
      if (error.code === "ECONNREFUSED") {
        logger.warn("SMSMobileAPI connection refused — phone is offline");
        return { success: false, error: "connection_refused", reason: "phone_unreachable" };
      }
      logger.error("SMSMobileAPI error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if the phone is reachable and get its status.
   */
  async checkStatus() {
    if (!config.smsMobileApi.url) {
      return { success: false, reason: "not_configured" };
    }

    try {
      const url = `${config.smsMobileApi.url}/status`;
      const response = await fetch(url, {
        headers: this._headers(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      return { success: true, ...result };
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return { success: false, error: "timeout", reason: "phone_unreachable" };
      }
      return { success: false, error: error.message };
    }
  }
}

module.exports = SmsMobileApiService;

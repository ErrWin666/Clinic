const { Settings } = require("../models");
const config = require("../config");
const logger = require("../utils/logger");
const MESSAGES = require("../constants/messages");
const { maskSecrets } = require("../utils/maskSecrets");

/**
 * WhatsAppCloudService — Layer 1 of the message cascade.
 * Integrates with the WhatsApp Business Cloud API (Meta Graph API).
 * Free up to 1000 conversations/month.
 */
class WhatsAppCloudService {
  /**
   * Normalize a phone number to international format without "+" or spaces.
   * WhatsApp Cloud API expects digits only (e.g. "201234567890").
   */
  normalizePhone(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s+\-()]/g, "");
    // Convert Egyptian local numbers starting with 0 to international 20
    if (cleaned.startsWith("0")) {
      cleaned = "20" + cleaned.slice(1);
    }
    if (!/^\d{6,15}$/.test(cleaned)) return null;
    return cleaned;
  }

  async _getRawSettings() {
    const rows = await Settings.findAll({ where: { category: "whatsapp_cloud" } });
    const settings = {};
    for (const row of rows) {
      const key = row.key.replace(/^whatsapp_cloud\./, "");
      try {
        settings[key] = JSON.parse(row.value);
      } catch {
        settings[key] = row.value;
      }
    }
    return settings;
  }

  async getSettings() {
    return maskSecrets(await this._getRawSettings());
  }

  async updateSettings(updates) {
    for (const [key, value] of Object.entries(updates)) {
      const fullKey = `whatsapp_cloud.${key}`;
      const existing = await Settings.findOne({ where: { key: fullKey } });
      const storedValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      if (existing) {
        await existing.update({ value: storedValue });
      } else {
        await Settings.create({ key: fullKey, value: storedValue, category: "whatsapp_cloud" });
      }
    }
    return this.getSettings();
  }

  isEnabled() {
    return !!(config.whatsappCloud.phoneNumberId && config.whatsappCloud.accessToken);
  }

  _apiUrl() {
    const { apiVersion, phoneNumberId } = config.whatsappCloud;
    return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  }

  /**
   * Send a template message (pre-approved by Meta).
   * @param {string} to - Phone number (will be normalized)
   * @param {string} templateName - e.g. "appointment_reminder"
   * @param {string} language - e.g. "ar" or "en"
   * @param {string[]} params - body parameters
   */
  async sendTemplateMessage(to, templateName, language = "ar", params = []) {
    if (!this.isEnabled()) {
      return { success: false, reason: "not_configured" };
    }

    const normalizedTo = this.normalizePhone(to);
    if (!normalizedTo) {
      return { success: false, reason: "invalid_phone" };
    }

    try {
      const body = {
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components: [
            {
              type: "body",
              parameters: params.map((p) => ({ type: "text", text: String(p) })),
            },
          ],
        },
      };

      const response = await fetch(this._apiUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.whatsappCloud.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("WhatsApp Cloud send failed:", result.error?.message || result);
        return { success: false, error: result.error?.message || "Send failed" };
      }

      await this._incrementMonthlyCount();
      logger.info(`WhatsApp Cloud sent to ${normalizedTo}: ${result.messages?.[0]?.id}`);
      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
      logger.error("WhatsApp Cloud error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a free-form text message (only allowed within 24h window after
   * the user has initiated a conversation).
   */
  async sendTextMessage(to, text) {
    if (!this.isEnabled()) {
      return { success: false, reason: "not_configured" };
    }

    const normalizedTo = this.normalizePhone(to);
    if (!normalizedTo) {
      return { success: false, reason: "invalid_phone" };
    }

    try {
      const body = {
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: { body: text },
      };

      const response = await fetch(this._apiUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.whatsappCloud.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("WhatsApp Cloud text send failed:", result.error?.message || result);
        return { success: false, error: result.error?.message || "Send failed" };
      }

      await this._incrementMonthlyCount();
      logger.info(`WhatsApp Cloud text sent to ${normalizedTo}`);
      return { success: true, messageId: result.messages?.[0]?.id };
    } catch (error) {
      logger.error("WhatsApp Cloud error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track monthly message count for the 1000/month free limit.
   */
  async _incrementMonthlyCount() {
    try {
      const settings = await this.getSettings();
      const monthKey = new Date().toISOString().slice(0, 7); // "2026-08"
      const currentMonth = settings.monthlyCountMonth || "";
      let count = settings.monthlyCount || 0;

      if (currentMonth !== monthKey) {
        // Reset for new month
        count = 0;
        await this.updateSettings({
          monthlyCountMonth: monthKey,
          monthlyCount: 1,
        });
      } else {
        count = (typeof count === "number" ? count : parseInt(count, 10) || 0) + 1;
        await this.updateSettings({ monthlyCount: count });
      }

      if (count >= 900) {
        logger.warn(`WhatsApp Cloud monthly limit approaching: ${count}/1000`);
      }
      return count;
    } catch (err) {
      logger.error("Failed to track WhatsApp monthly count:", err.message);
      return 0;
    }
  }

  async getMonthlyCount() {
    const settings = await this.getSettings();
    const monthKey = new Date().toISOString().slice(0, 7);
    if (settings.monthlyCountMonth !== monthKey) return 0;
    return typeof settings.monthlyCount === "number" ? settings.monthlyCount : parseInt(settings.monthlyCount || "0", 10);
  }
}

module.exports = WhatsAppCloudService;

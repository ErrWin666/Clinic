const crypto = require("crypto");
const { Settings, Patient } = require("../models");
const config = require("../config");
const logger = require("../utils/logger");
const MESSAGES = require("../constants/messages");
const { maskSecrets } = require("../utils/maskSecrets");

/**
 * TelegramBotService — Layer 2 of the message cascade.
 * 100% free, no limits. Uses long polling (local-first compatible).
 */
class TelegramBotService {
  constructor() {
    this._offset = 0;
    this._polling = false;
    this._abortController = null;
  }

  async _getRawSettings() {
    const rows = await Settings.findAll({ where: { category: "telegram" } });
    const settings = {};
    for (const row of rows) {
      const key = row.key.replace(/^telegram\./, "");
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
      const fullKey = `telegram.${key}`;
      const existing = await Settings.findOne({ where: { key: fullKey } });
      const storedValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      if (existing) {
        await existing.update({ value: storedValue });
      } else {
        await Settings.create({ key: fullKey, value: storedValue, category: "telegram" });
      }
    }
    return this.getSettings();
  }

  isEnabled() {
    return !!config.telegram.botToken;
  }

  _apiUrl(method) {
    return `${config.telegram.apiBase}/bot${config.telegram.botToken}/${method}`;
  }

  /**
   * Start the long-polling loop. Runs until stopPolling() is called.
   */
  async startPolling() {
    if (!this.isEnabled()) {
      logger.info("Telegram bot not configured, skipping polling");
      return;
    }
    if (this._polling) return;
    this._polling = true;
    logger.info(MESSAGES.TELEGRAM.POLLING_STARTED);

    this._pollLoop();
  }

  async _pollLoop() {
    while (this._polling) {
      try {
        this._abortController = new AbortController();
        const url = `${this._apiUrl("getUpdates")}?offset=${this._offset}&timeout=${config.telegram.pollingTimeout}`;
        const response = await fetch(url, { signal: this._abortController.signal });
        const data = await response.json();

        if (data.ok && data.result) {
          for (const update of data.result) {
            this._offset = update.update_id + 1;
            try {
              await this.handleUpdate(update);
            } catch (err) {
              logger.error("Telegram handleUpdate error:", err.message);
            }
          }
        }
        // Small delay to prevent tight loop when mock/test resolves instantly
        if (data.result && data.result.length === 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        if (err.name === "AbortError") break;
        logger.error("Telegram polling error:", err.message);
        // Wait before retrying to avoid tight loop on persistent errors
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    logger.info(MESSAGES.TELEGRAM.POLLING_STOPPED);
  }

  stopPolling() {
    this._polling = false;
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  /**
   * Handle an incoming update from Telegram.
   */
  async handleUpdate(update) {
    const message = update.message || update.callback_query?.message;
    if (!message) return;

    const chatId = message.chat?.id;
    const text = update.message?.text || "";

    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const token = parts[1];

      if (token) {
        // Patient linking via invite token
        const result = await this.linkPatient(token, String(chatId));
        if (result.success) {
          await this.sendMessage(chatId, "تم تفعيل التذكيرات بنجاح ✓\nستصلك تذكيرات المواعيد والفواتير عبر Telegram.");
        } else {
          await this.sendMessage(chatId, "تعذر ربط حسابك. يرجى التواصل مع العيادة للحصول على رابط جديد.");
        }
      } else {
        // Plain /start without token
        await this.sendMessage(chatId, "مرحباً! هذا البوت يرسل تذكيرات من العيادة. يرجى استخدام الرابط المرسل إليك عبر SMS للتفعيل.");
      }
    } else if (text === "/help") {
      await this.sendMessage(chatId, "هذا البوت يرسل تذكيرات المواعيد والفواتير تلقائياً. لا حاجة لأي أمر إضافي.");
    } else {
      await this.sendMessage(chatId, "لتفعيل التذكيرات، يرجى استخدام الرابط المرسل إليك عبر SMS من العيادة.");
    }
  }

  /**
   * Send a message to a Telegram chat.
   */
  async sendMessage(chatId, text, parseMode = null) {
    if (!this.isEnabled()) {
      return { success: false, reason: "not_configured" };
    }

    try {
      const body = {
        chat_id: chatId,
        text: text,
      };
      if (parseMode) body.parse_mode = parseMode;

      const response = await fetch(this._apiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.ok) {
        logger.error("Telegram send failed:", result.description || result);
        return { success: false, error: result.description || "Send failed" };
      }

      return { success: true, messageId: result.result?.message_id };
    } catch (error) {
      logger.error("Telegram error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a formatted reminder message.
   */
  async sendReminder(chatId, type, data) {
    const messages = {
      appointment_reminder: `🔔 <b>تذكير موعد</b>\n\nعزيزي ${data.patientName || ""}،\nلديك موعد في عيادة ${data.clinicName || ""} بتاريخ ${data.date || ""} الساعة ${data.time || ""}.`,
      overdue_invoice: `📄 <b>تذكير فاتورة</b>\n\nعزيزي ${data.patientName || ""}،\nفاتورتك رقم ${data.invoiceId || ""} بقيمة ${data.amount || ""} ${data.currency || ""} مستحقة الدفع.`,
      follow_up_due: `🏥 <b>تذكير متابعة</b>\n\nعزيزي ${data.patientName || ""}،\nحان موعد المتابعة. آخر زيارة كانت في ${data.lastVisitDate || ""}. يرجى حجز موعد.`,
    };

    const text = messages[type] || `تذكير من العيادة: ${data.message || ""}`;
    return this.sendMessage(chatId, text, "HTML");
  }

  /**
   * Link a patient to their Telegram chat using the invite token.
   */
  async linkPatient(token, chatId) {
    try {
      const patient = await Patient.findOne({ where: { telegramLinkToken: token } });
      if (!patient) {
        return { success: false, reason: "invalid_token" };
      }
      await patient.update({
        telegramChatId: String(chatId),
        telegramLinkToken: null,
      });
      logger.info(`Patient ${patient.id} linked to Telegram chat ${chatId}`);
      return { success: true, patientId: patient.id };
    } catch (err) {
      logger.error("Telegram linkPatient error:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate a one-time invite link for a patient.
   * Stores the token on the patient and returns the full t.me link.
   */
  async generateInviteLink(patientId) {
    const token = crypto.randomBytes(16).toString("hex"); // 32 chars
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return { success: false, reason: "patient_not_found" };
    }
    await patient.update({ telegramLinkToken: token });

    // Get bot username from settings or config
    const settings = await this.getSettings();
    const botUsername = settings.botUsername || "ClinicEyeBot";
    const link = `https://t.me/${botUsername}?start=${token}`;

    return { success: true, link, token };
  }
}

module.exports = TelegramBotService;

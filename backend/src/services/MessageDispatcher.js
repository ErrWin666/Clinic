const WhatsAppCloudService = require("./WhatsAppCloudService");
const TelegramBotService = require("./TelegramBotService");
const SmsMobileApiService = require("./SmsMobileApiService");
const SmsService = require("./SmsService");
const MessageTemplateService = require("./messaging");
const { Settings } = require("../models");
const logger = require("../utils/logger");
const MESSAGES = require("../constants/messages");

/**
 * MessageDispatcher — the cascade coordinator.
 *
 * Tries each layer in order until one succeeds:
 *   1. WhatsApp Cloud API (free, 1000/month)
 *   2. Telegram Bot (free, no limits)
 *   3. SMSMobileAPI (local SIM, cheap)
 *   4. Twilio SMS (paid, last resort)
 *
 * Respects patient.preferredContactMethod when set (non-auto).
 * Updates notification.dispatchChannel / dispatchedAt / dispatchError.
 *
 * Uses MessageTemplateService for centralized template rendering with
 * real data extracted from Appointment / Invoice / EyeExamination entities
 * and clinic info loaded from Settings.
 */
class MessageDispatcher {
  constructor() {
    this.whatsappCloud = new WhatsAppCloudService();
    this.telegram = new TelegramBotService();
    this.smsMobileApi = new SmsMobileApiService();
    this.sms = new SmsService();
    this.templates = new MessageTemplateService();
  }

  /**
   * Dispatch a notification through the cascade.
   * @param {object} notification - Notification record
   * @param {object} patient - Patient record
   * @param {string} type - notification type
   * @returns {Promise<{success: boolean, channel: string}>}
   */
  async dispatch(notification, patient, type) {
    if (!patient) {
      logger.info("MessageDispatcher: no patient, skipping dispatch");
      return { success: false, channel: "none", reason: "no_patient" };
    }

    // Load clinic info from Settings (name, phone, address, currency, language)
    const clinicInfo = await this.templates.getClinicInfo();

    // Render the plain-text message via the template service
    const message = await this.templates.renderText(type, notification, patient, clinicInfo);

    // Render the HTML message (for Telegram)
    const htmlMessage = await this.templates.renderHtml(type, notification, patient, clinicInfo);

    // Build structured reminder data (backward compat for TelegramBotService.sendReminder)
    const reminderData = await this.templates.buildReminderData(type, notification, patient, clinicInfo);

    // Get WhatsApp Cloud template params (real values from entities)
    const whatsappParams = await this.templates.getWhatsAppCloudParams(type, notification, patient, clinicInfo);
    const whatsappTemplateName = this.templates.getWhatsAppTemplateName(type);

    const preferred = patient.preferredContactMethod || "auto";

    // If patient has a specific preference, try that first
    if (preferred !== "auto") {
      const result = await this._tryPreferred(preferred, patient, message, htmlMessage, reminderData, notification, type, whatsappTemplateName, whatsappParams, clinicInfo.language);
      if (result.success) return result;
      // If preferred failed, fall through to auto cascade
      logger.info(`Preferred channel "${preferred}" failed, falling back to auto cascade`);
    }

    // Auto cascade: try each layer in order
    const wa = await this.tryWhatsApp(patient, message, notification, type, whatsappTemplateName, whatsappParams, clinicInfo.language);
    if (wa.success) return wa;

    const tg = await this.tryTelegram(patient, htmlMessage, reminderData, notification, type);
    if (tg.success) return tg;

    const smsMobile = await this.trySmsMobile(patient, message, notification);
    if (smsMobile.success) return smsMobile;

    const sms = await this.trySms(patient, message, notification);
    if (sms.success) return sms;

    // All channels failed
    await this._recordDispatch(notification, "none", "All channels failed or disabled");
    return { success: false, channel: "none", reason: "all_channels_failed" };
  }

  async _tryPreferred(method, patient, message, htmlMessage, reminderData, notification, type, waTemplateName, waParams, language) {
    switch (method) {
      case "whatsapp":
        return this.tryWhatsApp(patient, message, notification, type, waTemplateName, waParams, language);
      case "telegram":
        return this.tryTelegram(patient, htmlMessage, reminderData, notification, type);
      case "sms_mobile":
        return this.trySmsMobile(patient, message, notification);
      case "sms":
        return this.trySms(patient, message, notification);
      default:
        return { success: false, channel: "none" };
    }
  }

  async tryWhatsApp(patient, message, notification, type, templateName, templateParams, language = "ar") {
    if (!patient.phoneNumber || !this.whatsappCloud.isEnabled()) {
      return { success: false, channel: "whatsapp", reason: "skipped" };
    }
    if (patient.whatsappOptIn === false) {
      return { success: false, channel: "whatsapp", reason: "opted_out" };
    }
    // Some notification types (general, medication_reminder) have no matching WhatsApp template.
    // Skip WhatsApp for those — they will fall through to Telegram/SMS which can send free text.
    if (!templateName) {
      return { success: false, channel: "whatsapp", reason: "no_template" };
    }

    const result = await this.whatsappCloud.sendTemplateMessage(
      patient.phoneNumber,
      templateName,
      language,
      templateParams
    );

    if (result.success) {
      await this._recordDispatch(notification, "whatsapp");
      logger.info(`Dispatched via WhatsApp to patient ${patient.id}`);
      return { success: true, channel: "whatsapp" };
    }

    logger.info(`WhatsApp failed for patient ${patient.id}:`, result.error || result.reason);
    return { success: false, channel: "whatsapp", reason: result.error || result.reason };
  }

  async tryTelegram(patient, htmlMessage, reminderData, notification, type) {
    if (!patient.telegramChatId || !this.telegram.isEnabled()) {
      return { success: false, channel: "telegram", reason: "skipped" };
    }

    // Send the pre-rendered HTML message directly (template service already formatted it)
    const result = await this.telegram.sendMessage(patient.telegramChatId, htmlMessage, "HTML");

    if (result.success) {
      await this._recordDispatch(notification, "telegram");
      logger.info(`Dispatched via Telegram to patient ${patient.id}`);
      return { success: true, channel: "telegram" };
    }

    logger.info(`Telegram failed for patient ${patient.id}:`, result.error || result.reason);
    return { success: false, channel: "telegram", reason: result.error || result.reason };
  }

  async trySmsMobile(patient, message, notification) {
    if (!patient.phoneNumber || !this.smsMobileApi.isEnabled()) {
      return { success: false, channel: "sms_mobile", reason: "skipped" };
    }

    const result = await this.smsMobileApi.sendMessage(patient.phoneNumber, message);

    if (result.success) {
      await this._recordDispatch(notification, "sms_mobile");
      logger.info(`Dispatched via SMSMobileAPI to patient ${patient.id}`);
      return { success: true, channel: "sms_mobile" };
    }

    logger.info(`SMSMobileAPI failed for patient ${patient.id}:`, result.error || result.reason);
    return { success: false, channel: "sms_mobile", reason: result.error || result.reason };
  }

  async trySms(patient, message, notification) {
    if (!patient.phoneNumber) {
      return { success: false, channel: "sms", reason: "skipped" };
    }

    const result = await this.sms.sendMessage(patient.phoneNumber, message);

    if (result.success) {
      await this._recordDispatch(notification, result.channel || "sms");
      logger.info(`Dispatched via SMS (${result.channel || "twilio"}) to patient ${patient.id}`);
      return { success: true, channel: result.channel || "sms" };
    }

    logger.info(`SMS failed for patient ${patient.id}:`, result.error || result.reason);
    return { success: false, channel: "sms", reason: result.error || result.reason };
  }

  async _recordDispatch(notification, channel, error = null) {
    if (!notification || !notification.update) return;
    try {
      await notification.update({
        dispatchChannel: channel,
        dispatchedAt: new Date(),
        dispatchError: error,
      });
    } catch (err) {
      logger.error("Failed to record dispatch:", err.message);
    }
  }

  /**
   * Get dispatch statistics for the dashboard.
   */
  async getStats() {
    const { Notification } = require("../models");
    const { Op } = require("sequelize");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      whatsapp: 0,
      telegram: 0,
      sms_mobile: 0,
      sms: 0,
      none: 0,
      total: 0,
    };

    const notifications = await Notification.findAll({
      where: {
        dispatchedAt: { [Op.gte]: today },
      },
      attributes: ["dispatchChannel"],
    });

    for (const n of notifications) {
      const ch = n.dispatchChannel || "none";
      stats[ch] = (stats[ch] || 0) + 1;
      stats.total++;
    }

    return stats;
  }
}

module.exports = MessageDispatcher;

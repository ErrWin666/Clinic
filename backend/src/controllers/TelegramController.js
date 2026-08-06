const BaseController = require("./BaseController");
const TelegramBotService = require("../services/TelegramBotService");
const SmsService = require("../services/SmsService");
const { Patient, Settings } = require("../models");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const logger = require("../utils/logger");

class TelegramController extends BaseController {
  constructor() {
    super();
    this.telegramService = new TelegramBotService();
    this.smsService = new SmsService();
  }

  async getSettings(req, res, next) {
    try {
      const settings = await this.telegramService.getSettings();
      return this.sendSuccess(res, settings, "Telegram settings retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await this.telegramService.updateSettings(req.body);
      return this.sendSuccess(res, settings, "Telegram settings updated");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook endpoint (alternative to polling — for cloud deployments).
   */
  async handleWebhook(req, res, next) {
    try {
      // Respond immediately — Telegram expects a fast 200
      res.status(200).json({ ok: true });
      // Process the update asynchronously
      this.telegramService.handleUpdate(req.body).catch((err) => {
        logger.error("Telegram webhook handleUpdate error:", err.message);
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a Telegram invite link to a patient via SMS.
   */
  async sendInviteLink(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        throw new CustomError("Patient not found", "NOT_FOUND", 404);
      }
      if (!patient.phoneNumber) {
        throw new CustomError("Patient has no phone number", "VALIDATION_ERROR", 400);
      }

      const inviteResult = await this.telegramService.generateInviteLink(patientId);
      if (!inviteResult.success) {
        throw new CustomError(MESSAGES.TELEGRAM.INVITE_FAILED, "TELEGRAM_INVITE_ERROR", 500);
      }

      // Send the invite link via SMS (SmsMobileApi or Twilio)
      const smsText = `لتفعيل التذكيرات المجانية عبر Telegram، اضغط: ${inviteResult.link}`;
      const smsResult = await this.smsService.sendMessage(patient.phoneNumber, smsText);

      return this.sendSuccess(res, {
        inviteLink: inviteResult.link,
        smsSent: smsResult.success,
        smsChannel: smsResult.channel || "sms",
      }, smsResult.success ? MESSAGES.TELEGRAM.INVITE_SENT : MESSAGES.TELEGRAM.INVITE_FAILED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test the bot connection by sending a test message to the admin's chat.
   */
  async testConnection(req, res, next) {
    try {
      const { chatId } = req.body;
      if (!chatId) {
        throw new CustomError("chatId is required for test", "VALIDATION_ERROR", 400);
      }
      const result = await this.telegramService.sendMessage(chatId, "✅ Test message from Clinic Eye");
      return this.sendSuccess(res, result, result.success ? "Test sent" : "Test failed");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TelegramController;

const WhatsAppService = require("./WhatsAppService");
const SmsMobileApiService = require("./SmsMobileApiService");
const logger = require("../utils/logger");

/**
 * SmsService — Layer 4 of the message cascade (Twilio, the existing service).
 * This is a thin wrapper around the existing WhatsAppService (which actually
 * sends SMS via Twilio) to make the cascade code clearer.
 *
 * The sendInvite path also tries SmsMobileApi first (Layer 3) before falling
 * back to Twilio, so the invite SMS is as cheap as possible.
 */
class SmsService {
  constructor() {
    this.twilioService = new WhatsAppService();
    this.smsMobileApiService = new SmsMobileApiService();
  }

  /**
   * Send an SMS. Tries SmsMobileApi (local, cheap) first, then Twilio.
   * Returns the channel that succeeded.
   */
  async sendMessage(to, text) {
    // Try SMSMobileAPI first (cheaper — local SIM)
    if (this.smsMobileApiService.isEnabled()) {
      const result = await this.smsMobileApiService.sendMessage(to, text);
      if (result.success) {
        return { ...result, channel: "sms_mobile" };
      }
      logger.info("SMSMobileAPI failed, falling back to Twilio:", result.error || result.reason);
    }

    // Fall back to Twilio
    const twilioResult = await this.twilioService.sendMessage(to, text);
    return { ...twilioResult, channel: "sms" };
  }
}

module.exports = SmsService;

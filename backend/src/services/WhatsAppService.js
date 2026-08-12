const { Settings } = require("../models");
const logger = require("../utils/logger");
const MessageTemplateService = require("./messaging");
const { maskSecrets } = require("../utils/maskSecrets");

class WhatsAppService {
  constructor() {
    this.templates = new MessageTemplateService();
  }

  async _getRawSettings() {
    const rows = await Settings.findAll({ where: { category: "whatsapp" } });
    const settings = {};
    for (const row of rows) {
      const key = row.key.replace(/^whatsapp\./, "");
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
      const fullKey = `whatsapp.${key}`;
      const existing = await Settings.findOne({ where: { key: fullKey } });
      const storedValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      if (existing) {
        await existing.update({ value: storedValue });
      } else {
        await Settings.create({ key: fullKey, value: storedValue, category: "whatsapp" });
      }
    }
    return this.getSettings();
  }

  async sendMessage(to, message) {
    const settings = await this._getRawSettings();
    if (!settings.enabled) {
      logger.info("WhatsApp/SMS disabled, skipping message");
      return { success: false, reason: "disabled" };
    }

    if (!settings.accountSid || !settings.authToken) {
      logger.warn("WhatsApp/SMS not configured — missing credentials");
      return { success: false, reason: "not_configured" };
    }

    try {
      const from = settings.fromNumber || "";
      const url = `https://api.twilio.com/2010-04-01/Accounts/${settings.accountSid}/Messages.json`;
      const auth = Buffer.from(`${settings.accountSid}:${settings.authToken}`).toString("base64");

      const body = new URLSearchParams();
      body.append("From", from);
      body.append("To", to);
      body.append("Body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("WhatsApp/SMS send failed:", result.message || result);
        return { success: false, error: result.message || "Send failed" };
      }

      logger.info(`WhatsApp/SMS sent to ${to}: ${result.sid}`);
      return { success: true, sid: result.sid, channel: "sms" };
    } catch (error) {
      logger.error("WhatsApp/SMS error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an appointment reminder using the centralized MessageTemplateService.
   * Custom templates from Settings (whatsapp.appointmentTemplate) override the
   * default if set — preserving backward compatibility.
   */
  async sendAppointmentReminder(appointment, patient, clinicName) {
    if (!patient.phoneNumber) {
      return { success: false, reason: "no_phone" };
    }

    const settings = await this._getRawSettings();
    const clinicInfo = await this.templates.getClinicInfo();
    // Use custom template from Settings if set, otherwise use centralized template
    if (settings.appointmentTemplate) {
      const message = settings.appointmentTemplate
        .replace(/{{patientName}}/g, patient.fullName || "")
        .replace(/{{clinicName}}/g, clinicName || clinicInfo.name)
        .replace(/{{date}}/g, appointment.appointmentDate || "")
        .replace(/{{time}}/g, appointment.startTime || "");
      return this.sendMessage(patient.phoneNumber, message);
    }

    // Use centralized template service
    const notification = { entityId: appointment.id, entityType: "Appointment", message: "" };
    const message = await this.templates.renderText("appointment_reminder", notification, patient, clinicInfo);
    return this.sendMessage(patient.phoneNumber, message);
  }

  async sendInvoiceNotification(invoice, patient, clinicName) {
    if (!patient.phoneNumber) {
      return { success: false, reason: "no_phone" };
    }

    const settings = await this._getRawSettings();
    const clinicInfo = await this.templates.getClinicInfo();
    if (settings.invoiceTemplate) {
      const message = settings.invoiceTemplate
        .replace(/{{patientName}}/g, patient.fullName || "")
        .replace(/{{clinicName}}/g, clinicName || clinicInfo.name)
        .replace(/{{invoiceId}}/g, invoice.displayId || "")
        .replace(/{{amount}}/g, String(invoice.totalAmount || 0))
        .replace(/{{currency}}/g, invoice.currency || clinicInfo.currency || "");
      return this.sendMessage(patient.phoneNumber, message);
    }

    const notification = { entityId: invoice.id, entityType: "Invoice", message: "" };
    const message = await this.templates.renderText("overdue_invoice", notification, patient, clinicInfo);
    return this.sendMessage(patient.phoneNumber, message);
  }

  async sendFollowUpReminder(patient, clinicName, lastVisitDate) {
    if (!patient.phoneNumber) {
      return { success: false, reason: "no_phone" };
    }

    const settings = await this._getRawSettings();
    const clinicInfo = await this.templates.getClinicInfo();
    if (settings.followUpTemplate) {
      const message = settings.followUpTemplate
        .replace(/{{patientName}}/g, patient.fullName || "")
        .replace(/{{clinicName}}/g, clinicName || clinicInfo.name)
        .replace(/{{lastVisitDate}}/g, lastVisitDate || "");
      return this.sendMessage(patient.phoneNumber, message);
    }

    // Use centralized template with a synthetic notification
    const notification = {
      message: `Follow-up reminder. Last visit: ${lastVisitDate}`,
      entityId: null,
      entityType: null,
    };
    const message = await this.templates.renderText("follow_up_due", notification, patient, clinicInfo);
    return this.sendMessage(patient.phoneNumber, message);
  }
}

module.exports = WhatsAppService;

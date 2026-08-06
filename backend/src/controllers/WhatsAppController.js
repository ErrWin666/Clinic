const BaseController = require("./BaseController");
const WhatsAppService = require("../services/WhatsAppService");
const WhatsAppCloudService = require("../services/WhatsAppCloudService");
const SmsMobileApiService = require("../services/SmsMobileApiService");
const { Patient, Appointment, Invoice, Settings } = require("../models");
const CustomError = require("../utils/CustomError");

class WhatsAppController extends BaseController {
  constructor() {
    super();
    this.whatsappService = new WhatsAppService();
    this.whatsappCloudService = new WhatsAppCloudService();
    this.smsMobileApiService = new SmsMobileApiService();
  }

  async getSettings(req, res, next) {
    try {
      const settings = await this.whatsappService.getSettings();
      return this.sendSuccess(res, settings, "WhatsApp settings retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await this.whatsappService.updateSettings(req.body);
      return this.sendSuccess(res, settings, "WhatsApp settings updated");
    } catch (error) {
      next(error);
    }
  }

  async sendAppointmentReminder(req, res, next) {
    try {
      const appointmentId = this.validateId(req.params.id);
      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) {
        throw new CustomError("Appointment not found", "NOT_FOUND", 404);
      }
      const patient = await Patient.findByPk(appointment.patientId);
      if (!patient) {
        throw new CustomError("Patient not found", "NOT_FOUND", 404);
      }
      const clinicRows = await Settings.findAll({ where: { key: "clinic.name" } });
      const clinicName = clinicRows.length > 0 ? JSON.parse(clinicRows[0].value) : "Clinic";
      const result = await this.whatsappService.sendAppointmentReminder(appointment, patient, clinicName);
      return this.sendSuccess(res, result, result.success ? "Reminder sent" : "Reminder not sent");
    } catch (error) {
      next(error);
    }
  }

  async sendInvoiceNotification(req, res, next) {
    try {
      const invoiceId = this.validateId(req.params.id);
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        throw new CustomError("Invoice not found", "NOT_FOUND", 404);
      }
      const patient = await Patient.findByPk(invoice.patientId);
      if (!patient) {
        throw new CustomError("Patient not found", "NOT_FOUND", 404);
      }
      const clinicRows = await Settings.findAll({ where: { key: "clinic.name" } });
      const clinicName = clinicRows.length > 0 ? JSON.parse(clinicRows[0].value) : "Clinic";
      const result = await this.whatsappService.sendInvoiceNotification(invoice, patient, clinicName);
      return this.sendSuccess(res, result, result.success ? "Invoice notification sent" : "Notification not sent");
    } catch (error) {
      next(error);
    }
  }

  async sendFollowUpReminder(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        throw new CustomError("Patient not found", "NOT_FOUND", 404);
      }
      const clinicRows = await Settings.findAll({ where: { key: "clinic.name" } });
      const clinicName = clinicRows.length > 0 ? JSON.parse(clinicRows[0].value) : "Clinic";
      const lastVisitDate = req.body.lastVisitDate || "";
      const result = await this.whatsappService.sendFollowUpReminder(patient, clinicName, lastVisitDate);
      return this.sendSuccess(res, result, result.success ? "Follow-up reminder sent" : "Reminder not sent");
    } catch (error) {
      next(error);
    }
  }

  async testMessage(req, res, next) {
    try {
      const { to } = req.body;
      if (!to) {
        throw new CustomError("Phone number required", "VALIDATION_ERROR", 400);
      }
      const result = await this.whatsappService.sendMessage(to, "Test message from Clinic Eye");
      return this.sendSuccess(res, result, result.success ? "Test message sent" : "Test message failed");
    } catch (error) {
      next(error);
    }
  }

  // --- WhatsApp Cloud API settings (Layer 1) ---
  async getCloudSettings(req, res, next) {
    try {
      const settings = await this.whatsappCloudService.getSettings();
      const monthlyCount = await this.whatsappCloudService.getMonthlyCount();
      return this.sendSuccess(res, { ...settings, monthlyCount }, "WhatsApp Cloud settings retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateCloudSettings(req, res, next) {
    try {
      const settings = await this.whatsappCloudService.updateSettings(req.body);
      return this.sendSuccess(res, settings, "WhatsApp Cloud settings updated");
    } catch (error) {
      next(error);
    }
  }

  // --- SMSMobileAPI settings (Layer 3) ---
  async getSmsMobileSettings(req, res, next) {
    try {
      const settings = await this.smsMobileApiService.getSettings();
      return this.sendSuccess(res, settings, "SMSMobileAPI settings retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateSmsMobileSettings(req, res, next) {
    try {
      const settings = await this.smsMobileApiService.updateSettings(req.body);
      // Also update config in-memory so isEnabled() reflects the change
      const config = require("../config");
      if (req.body.url !== undefined) config.smsMobileApi.url = req.body.url;
      if (req.body.apiKey !== undefined) config.smsMobileApi.apiKey = req.body.apiKey;
      if (req.body.enabled !== undefined) config.smsMobileApi.enabled = req.body.enabled === true || req.body.enabled === "true";
      return this.sendSuccess(res, settings, "SMSMobileAPI settings updated");
    } catch (error) {
      next(error);
    }
  }

  async testSmsMobileConnection(req, res, next) {
    try {
      const result = await this.smsMobileApiService.checkStatus();
      return this.sendSuccess(res, result, result.success ? "Phone connected" : "Phone not reachable");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WhatsAppController;

const { Settings, Appointment, Invoice, EyeExamination } = require("../../models");
const logger = require("../../utils/logger");
const { DEFAULT_TEMPLATES_AR, DEFAULT_TEMPLATES_EN, WHATSAPP_CLOUD_TEMPLATES_AR, WHATSAPP_CLOUD_TEMPLATES_EN } = require("./MessageTemplates");

class MessageTemplateService {
  async getClinicInfo() {
    try {
      const rows = await Settings.findAll({ where: { category: "clinic" } });
      const info = {};
      for (const row of rows) {
        const key = row.key.replace(/^clinic\./, "");
        try {
          info[key] = JSON.parse(row.value);
        } catch {
          info[key] = row.value;
        }
      }
      return {
        name: info.name || "العيادة",
        phone: info.phone || "",
        address: info.address || "",
        email: info.email || "",
        currency: info.currency || "EGP",
        language: info.language || "ar",
      };
    } catch (err) {
      logger.error("Failed to load clinic info:", err.message);
      return { name: "العيادة", phone: "", address: "", email: "", currency: "EGP", language: "ar" };
    }
  }

  async getCustomTemplates() {
    try {
      const rows = await Settings.findAll({ where: { category: "message_templates" } });
      const custom = {};
      for (const row of rows) {
        try {
          custom[row.key] = JSON.parse(row.value);
        } catch {
          custom[row.key] = row.value;
        }
      }
      return custom;
    } catch {
      return {};
    }
  }

  async getTemplates(lang = "ar") {
    const defaults = lang === "en" ? DEFAULT_TEMPLATES_EN : DEFAULT_TEMPLATES_AR;
    const custom = await this.getCustomTemplates();
    const merged = {};
    for (const key of Object.keys(defaults)) {
      merged[key] = custom[key] ? { ...defaults[key], ...custom[key] } : defaults[key];
    }
    return merged;
  }

  render(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = vars[key];
      return value !== undefined && value !== null ? String(value) : "";
    });
  }

  async buildVariables(type, notification, patient, clinicInfo) {
    const vars = {
      patientName: patient?.fullName || "",
      clinicName: clinicInfo.name || "العيادة",
      clinicPhone: clinicInfo.phone || "",
      clinicAddress: clinicInfo.address || "",
      clinicEmail: clinicInfo.email || "",
      currency: clinicInfo.currency || "EGP",
      message: notification?.message || "",
      date: "",
      time: "",
      appointmentType: "",
      invoiceId: "",
      amount: "",
      dueDate: "",
      lastVisitDate: "",
    };

    const entityId = notification?.entityId;
    const entityType = notification?.entityType;

    if (!entityId || !entityType) return vars;

    try {
      if (type === "appointment_reminder" || type === "appointment_confirmation" || type === "appointment_cancellation" || type === "appointment_rescheduled" || type === "appointment_missed") {
        if (entityType === "Appointment") {
          const apt = await Appointment.findByPk(entityId);
          if (apt) {
            vars.date = apt.appointmentDate || "";
            vars.time = apt.startTime || "";
            vars.appointmentType = apt.appointmentType || "";
          }
        }
      } else if (type === "overdue_invoice" || type === "invoice_due_soon" || type === "invoice_ready" || type === "invoice_paid") {
        if (entityType === "Invoice") {
          const inv = await Invoice.findByPk(entityId);
          if (inv) {
            vars.invoiceId = inv.displayId || "";
            vars.amount = inv.totalAmount != null ? String(inv.totalAmount) : "";
            vars.currency = inv.currency || clinicInfo.currency || "EGP";
            vars.dueDate = inv.dueDate || "";
          }
        }
      } else if (type === "follow_up_due") {
        if (entityType === "EyeExamination") {
          const exam = await EyeExamination.findByPk(entityId);
          if (exam) {
            vars.lastVisitDate = exam.examDate || "";
          }
        }
      }
    } catch (err) {
      logger.error("Failed to load entity for template variables:", err.message);
    }

    return vars;
  }

  async renderText(type, notification, patient, clinicInfo) {
    const templates = await this.getTemplates(clinicInfo.language);
    const tpl = templates[type] || templates.general;
    const vars = await this.buildVariables(type, notification, patient, clinicInfo);
    return this.render(tpl.text, vars);
  }

  async renderHtml(type, notification, patient, clinicInfo) {
    const templates = await this.getTemplates(clinicInfo.language);
    const tpl = templates[type] || templates.general;
    const vars = await this.buildVariables(type, notification, patient, clinicInfo);
    return this.render(tpl.html, vars);
  }

  async buildReminderData(type, notification, patient, clinicInfo) {
    const vars = await this.buildVariables(type, notification, patient, clinicInfo);
    return vars;
  }

  async getWhatsAppCloudParams(type, notification, patient, clinicInfo) {
    const templates = await this.getTemplates(clinicInfo.language);
    const tpl = templates[type] || templates.general;
    const vars = await this.buildVariables(type, notification, patient, clinicInfo);
    const paramNames = tpl.whatsappParams || [];
    return paramNames.map((p) => {
      const key = p.replace(/\{\{|\}\}/g, "");
      return vars[key] !== undefined ? String(vars[key]) : "";
    });
  }

  getWhatsAppTemplateName(type) {
    const map = {
      appointment_reminder: "appointment_reminder",
      appointment_confirmation: "appointment_confirmation",
      appointment_cancellation: "appointment_cancellation",
      appointment_rescheduled: "appointment_rescheduled",
      appointment_missed: "appointment_missed",
      overdue_invoice: "invoice_notification",
      invoice_due_soon: "invoice_notification",
      invoice_ready: "invoice_notification",
      invoice_paid: "invoice_paid",
      follow_up_due: "follow_up_reminder",
      welcome: "welcome_message",
      thank_you_visit: "thank_you_visit",
      medication_reminder: null,
      general: null,
    };
    return map[type] || null;
  }

  getWhatsAppCloudTemplateDefinitions(lang = "ar") {
    return lang === "en" ? WHATSAPP_CLOUD_TEMPLATES_EN : WHATSAPP_CLOUD_TEMPLATES_AR;
  }

  listTemplateTypes() {
    return Object.keys(DEFAULT_TEMPLATES_AR);
  }
}

module.exports = MessageTemplateService;

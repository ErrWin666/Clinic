const NotificationService = require("./NotificationService");
const SettingsRepository = require("../repositories/SettingsRepository");
const { Appointment, Invoice, EyeExamination, Notification } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

class NotificationScheduler extends NotificationService {
  constructor() {
    super();
    this._settingsRepository = null;
  }

  _getSettingsRepo() {
    if (!this._settingsRepository) {
      this._settingsRepository = new SettingsRepository();
    }
    return this._settingsRepository;
  }

  async checkAndCreateNotifications() {
    try {
      await this.checkAppointmentReminders();
      await this.checkUpcomingInvoiceDue();
      await this.checkOverdueInvoices();
      await this.checkFollowUpExams();
      await this.checkStockAlerts();
    } catch (error) {
      logger.error({ message: "Notification check failed", error: error.message, stack: error.stack });
      throw error;
    }
  }

  async checkAppointmentReminders() {
    const settingsRepo = this._getSettingsRepo();
    const reminderDaysSetting = await settingsRepo.findByKey("notification.appointmentReminderDays");
    const reminderDays = reminderDaysSetting ? Number(safeJsonParse(reminderDaysSetting.value)) : 2;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const futureDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: { [Op.gte]: todayStr, [Op.lte]: futureDateStr },
        status: { [Op.in]: ["upcoming", "confirmed"] },
      },
      include: [{ association: "patient", attributes: ["id", "fullName", "phoneNumber", "telegramChatId", "whatsappOptIn", "preferredContactMethod"] }],
    });

    for (const apt of appointments) {
      const existing = await Notification.findOne({
        where: {
          type: "appointment_reminder",
          entityId: apt.id,
          entityType: "Appointment",
        },
      });
      if (!existing) {
        const patientName = apt.patient ? apt.patient.fullName : apt.quickName || "Unknown";
        const notification = await this.repository.create({
          type: "appointment_reminder",
          title: "Appointment Reminder",
          message: `Appointment with ${patientName} at ${apt.startTime} on ${apt.appointmentDate}`,
          entityId: apt.id,
          entityType: "Appointment",
        });
        await this._dispatchNotification(notification, apt.patientId, "appointment_reminder");
      }
    }
  }

  async markNoShowAppointments() {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const appointments = await Appointment.findAll({
      where: {
        status: { [Op.in]: ["upcoming", "confirmed"] },
        appointmentDate: { [Op.lte]: today },
        endTime: { [Op.lt]: nowTime },
      },
      include: [{ association: "patient", attributes: ["id", "fullName", "phoneNumber", "telegramChatId", "whatsappOptIn", "preferredContactMethod"] }],
    });

    let count = 0;
    for (const apt of appointments) {
      await apt.update({ status: "no-show" });
      count++;

      if (apt.patientId) {
        this.notifyEvent({
          type: "appointment_missed",
          title: "Appointment Missed",
          message: `Appointment on ${apt.appointmentDate} at ${apt.startTime} was marked as no-show. Please contact the clinic to reschedule.`,
          patientId: apt.patientId,
          entityId: apt.id,
          entityType: "Appointment",
        }).catch((err) => logger.error("No-show notification failed:", err.message));
      }
    }

    if (count > 0) {
      logger.info(`Marked ${count} appointments as no-show`);
    }
    return count;
  }

  async checkUpcomingInvoiceDue() {
    const settingsRepo = this._getSettingsRepo();
    const reminderDaysSetting = await settingsRepo.findByKey("notification.invoiceReminderDays");
    const reminderDays = reminderDaysSetting ? Number(safeJsonParse(reminderDaysSetting.value)) : 3;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const futureDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const invoices = await Invoice.findAll({
      where: {
        invoiceStatus: "unpaid",
        dueDate: { [Op.ne]: null, [Op.gte]: todayStr, [Op.lte]: futureDateStr },
      },
      include: [{ association: "patient", attributes: ["id", "fullName", "phoneNumber", "telegramChatId", "whatsappOptIn", "preferredContactMethod"] }],
    });

    for (const inv of invoices) {
      const existing = await Notification.findOne({
        where: {
          type: "invoice_due_soon",
          entityId: inv.id,
          entityType: "Invoice",
        },
      });
      if (!existing) {
        const patientName = inv.patient ? inv.patient.fullName : inv.customerName || "Unknown";
        const notification = await this.repository.create({
          type: "invoice_due_soon",
          title: "Invoice Due Soon",
          message: `Invoice ${inv.displayId} for ${patientName} is due on ${inv.dueDate}`,
          entityId: inv.id,
          entityType: "Invoice",
        });
        await this._dispatchNotification(notification, inv.patientId, "invoice_due_soon");
      }
    }
  }

  async checkOverdueInvoices() {
    const today = new Date().toISOString().split("T")[0];

    const invoices = await Invoice.findAll({
      where: {
        invoiceStatus: "unpaid",
        dueDate: { [Op.lt]: today },
      },
      include: [{ association: "patient", attributes: ["id", "fullName", "phoneNumber", "telegramChatId", "whatsappOptIn", "preferredContactMethod"] }],
    });

    for (const inv of invoices) {
      const existing = await Notification.findOne({
        where: {
          type: "overdue_invoice",
          entityId: inv.id,
          entityType: "Invoice",
        },
      });
      if (!existing) {
        const patientName = inv.patient ? inv.patient.fullName : inv.customerName || "Unknown";
        const notification = await this.repository.create({
          type: "overdue_invoice",
          title: "Overdue Invoice",
          message: `Invoice ${inv.displayId} for ${patientName} is overdue`,
          entityId: inv.id,
          entityType: "Invoice",
        });
        await this._dispatchNotification(notification, inv.patientId, "overdue_invoice");
      }
    }
  }

  async checkFollowUpExams() {
    const settingsRepo = this._getSettingsRepo();
    const followUpDaysSetting = await settingsRepo.findByKey("notification.followUpDays");
    const followUpDays = followUpDaysSetting ? Number(safeJsonParse(followUpDaysSetting.value)) : 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - followUpDays);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const exams = await EyeExamination.findAll({
      where: {
        examDate: { [Op.lte]: cutoffDateStr },
        followUpInstructions: { [Op.ne]: null, [Op.ne]: "" },
      },
      include: [{ association: "patient", attributes: ["id", "fullName", "phoneNumber", "telegramChatId", "whatsappOptIn", "preferredContactMethod"] }],
      order: [["examDate", "DESC"]],
    });

    const seenPatientIds = new Set();
    for (const exam of exams) {
      if (seenPatientIds.has(exam.patientId)) continue;
      seenPatientIds.add(exam.patientId);

      const existing = await Notification.findOne({
        where: {
          type: "follow_up_due",
          entityId: exam.id,
          entityType: "EyeExamination",
        },
      });
      if (!existing) {
        const patientName = exam.patient ? exam.patient.fullName : "Unknown";
        const notification = await this.repository.create({
          type: "follow_up_due",
          title: "Follow-up Examination Due",
          message: `Follow-up examination for ${patientName} is due (last exam: ${exam.examDate})`,
          entityId: exam.id,
          entityType: "EyeExamination",
        });
        await this._dispatchNotification(notification, exam.patientId, "follow_up_due");
      }
    }
  }

  /**
   * Check inventory alerts (low stock, out of stock, expiring soon, expired)
   * and create in-app notifications for each new alert.
   */
  async checkStockAlerts() {
    try {
      const StockService = require("./stock");
      const stockService = new StockService();
      const alerts = await stockService.checkAlerts(30);

      const allAlerts = [
        ...alerts.lowStock.map((a) => ({ ...a, type: "low_stock" })),
        ...alerts.outOfStock.map((a) => ({ ...a, type: "out_of_stock" })),
        ...alerts.expiring.map((a) => ({ ...a, type: "expiring_soon" })),
        ...alerts.expired.map((a) => ({ ...a, type: "expired" })),
      ];

      for (const alert of allAlerts) {
        // Use variantId + batchId + type as uniqueness key to avoid duplicate alerts
        const entityId = alert.batchId || alert.variantId;
        const existing = await Notification.findOne({
          where: {
            type: alert.type,
            entityId,
            entityType: "ProductVariant",
          },
        });
        if (!existing) {
          const productName = alert.productName || "Unknown";
          const variantName = alert.variantName || "";
          let title = "";
          let message = "";
          switch (alert.type) {
            case "low_stock":
              title = "Low Stock Alert";
              message = `${productName} (${variantName}) is low on stock: ${alert.quantity} remaining (min: ${alert.minQuantity})`;
              break;
            case "out_of_stock":
              title = "Out of Stock Alert";
              message = `${productName} (${variantName}) is out of stock`;
              break;
            case "expiring_soon":
              title = "Expiring Soon Alert";
              message = `${productName} (${variantName}) batch ${alert.batchNumber} expires in ${alert.daysUntilExpiry} days`;
              break;
            case "expired":
              title = "Expired Stock Alert";
              message = `${productName} (${variantName}) batch ${alert.batchNumber} has expired`;
              break;
            default:
              continue;
          }
          await this.repository.create({
            type: alert.type,
            title,
            message,
            entityId,
            entityType: "ProductVariant",
          });
        }
      }
    } catch (error) {
      logger.error(`Stock alerts check failed: ${error.message}`);
    }
  }
}

module.exports = NotificationScheduler;

const BaseController = require("./BaseController");
const NotificationService = require("../services/NotificationService");
const MessageTemplateService = require("../services/messaging");
const { Settings } = require("../models");
const MESSAGES = require("../constants/messages");
const logger = require("../utils/logger");

// Cap concurrent SSE connections to avoid unbounded resource usage.
const MAX_SSE_CONNECTIONS = 50;
let activeSseConnections = 0;

class NotificationController extends BaseController {
  constructor() {
    super();
    this.notificationService = new NotificationService();
    this.templates = new MessageTemplateService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.notificationService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.NOTIFICATION.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const notification = await this.notificationService.markRead(id);
      return this.sendSuccess(res, notification, MESSAGES.NOTIFICATION.MARKED_READ);
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      await this.notificationService.markAllRead();
      return this.sendSuccess(res, null, MESSAGES.NOTIFICATION.MARKED_ALL_READ);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.notificationService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.NOTIFICATION.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async stream(req, res, next) {
    try {
      if (activeSseConnections >= MAX_SSE_CONNECTIONS) {
        return res.status(503).json({ success: false, error: { code: "SSE_BUSY", message: "Too many concurrent connections" } });
      }
      activeSseConnections++;

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const cleanup = () => {
        clearInterval(interval);
        clearTimeout(heartbeatTimer);
        activeSseConnections = Math.max(0, activeSseConnections - 1);
        res.end();
      };

      // Heartbeat: send a comment every 15s to keep proxies from closing idle connections.
      let heartbeatTimer;
      const scheduleHeartbeat = () => {
        heartbeatTimer = setTimeout(() => {
          res.write(": ping\n\n");
          scheduleHeartbeat();
        }, 15000);
      };
      scheduleHeartbeat();

      const interval = setInterval(async () => {
        try {
          const unread = await this.notificationService.list({ isRead: false, page: 1, pageSize: 1 });
          res.write(`data: ${JSON.stringify({ unreadCount: unread.pagination.totalItems })}\n\n`);
        } catch (error) {
          logger.error({ message: "SSE poll failed", error: error.message });
        }
      }, 30000);

      res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

      req.on("close", cleanup);
    } catch (error) {
      next(error);
    }
  }

  // --- Reminder settings ---
  async getReminderSettings(req, res, next) {
    try {
      const keys = [
        "notification.appointmentReminderDays",
        "notification.invoiceReminderDays",
        "notification.followUpDays",
      ];
      const rows = await Settings.findAll({ where: { key: keys } });
      const settings = {};
      for (const row of rows) {
        const key = row.key.replace(/^notification\./, "");
        try {
          settings[key] = JSON.parse(row.value);
        } catch {
          settings[key] = row.value;
        }
      }
      // Defaults
      return this.sendSuccess(res, {
        appointmentReminderDays: settings.appointmentReminderDays ?? 2,
        invoiceReminderDays: settings.invoiceReminderDays ?? 3,
        followUpDays: settings.followUpDays ?? 30,
      }, "Reminder settings retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateReminderSettings(req, res, next) {
    try {
      const { appointmentReminderDays, invoiceReminderDays, followUpDays } = req.body;
      const updates = [
        { key: "notification.appointmentReminderDays", value: JSON.stringify(Number(appointmentReminderDays) || 2), category: "notification" },
        { key: "notification.invoiceReminderDays", value: JSON.stringify(Number(invoiceReminderDays) || 3), category: "notification" },
        { key: "notification.followUpDays", value: JSON.stringify(Number(followUpDays) || 30), category: "notification" },
      ];
      for (const u of updates) {
        const existing = await Settings.findOne({ where: { key: u.key } });
        if (existing) {
          await existing.update({ value: u.value });
        } else {
          await Settings.create(u);
        }
      }
      return this.sendSuccess(res, {
        appointmentReminderDays: Number(appointmentReminderDays) || 2,
        invoiceReminderDays: Number(invoiceReminderDays) || 3,
        followUpDays: Number(followUpDays) || 30,
      }, "Reminder settings updated");
    } catch (error) {
      next(error);
    }
  }

  // --- Message templates ---
  async getTemplates(req, res, next) {
    try {
      const clinicInfo = await this.templates.getClinicInfo();
      const templates = await this.templates.getTemplates(clinicInfo.language);
      const types = this.templates.listTemplateTypes();
      const waDefs = this.templates.getWhatsAppCloudTemplateDefinitions(clinicInfo.language);
      return this.sendSuccess(res, { templates, types, whatsappCloudDefinitions: waDefs, language: clinicInfo.language }, "Templates retrieved");
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req, res, next) {
    try {
      const { type } = req.params;
      const { text, html } = req.body;
      const clinicInfo = await this.templates.getClinicInfo();
      const lang = clinicInfo.language || "ar";
      const key = `message_template.${type}`;
      const value = JSON.stringify({ text, html, lang });
      const existing = await Settings.findOne({ where: { key } });
      if (existing) {
        await existing.update({ value, category: "message_templates" });
      } else {
        await Settings.create({ key, value, category: "message_templates" });
      }
      return this.sendSuccess(res, { type, text, html }, "Template updated");
    } catch (error) {
      next(error);
    }
  }

  async resetTemplate(req, res, next) {
    try {
      const { type } = req.params;
      await Settings.destroy({ where: { key: `message_template.${type}` } });
      return this.sendSuccess(res, { type }, "Template reset to default");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;

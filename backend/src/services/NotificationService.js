const BaseService = require("./BaseService");
const NotificationRepository = require("../repositories/NotificationRepository");
const SettingsRepository = require("../repositories/SettingsRepository");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Notification, Patient } = require("../models");
const { Op } = require("sequelize");
const MESSAGES = require("../constants/messages");
const logger = require("../utils/logger");

class NotificationService extends BaseService {
  constructor() {
    super(new NotificationRepository());
    this.settingsRepository = new SettingsRepository();
    this._dispatcher = null;
  }

  /**
   * Lazily instantiate the MessageDispatcher to avoid circular require issues
   * and to keep tests that don't need dispatch fast.
   */
  _getDispatcher() {
    if (!this._dispatcher) {
      const MessageDispatcher = require("./MessageDispatcher");
      this._dispatcher = new MessageDispatcher();
    }
    return this._dispatcher;
  }

  /**
   * Best-effort dispatch of a notification through the message cascade.
   * Failures are logged but never thrown — the in-app notification is
   * already created and that is the primary delivery channel.
   */
  async _dispatchNotification(notification, patientId, type) {
    try {
      if (!patientId) return;
      const patient = await Patient.findByPk(patientId);
      if (!patient) return;
      await this._getDispatcher().dispatch(notification, patient, type);
    } catch (err) {
      logger.error("Message dispatch failed (best-effort):", err.message);
    }
  }

  /**
   * Create an event-driven notification + dispatch it immediately.
   * Used for: appointment_confirmation, appointment_cancellation,
   * invoice_ready, thank_you_visit, welcome, etc.
   *
   * @param {object} params - { type, title, message, patientId, entityId, entityType }
   * @returns {Promise<object|null>} the created notification or null on failure
   */
  async notifyEvent({ type, title, message, patientId, entityId, entityType }) {
    try {
      if (!patientId) return null;
      // De-duplicate: only block if the SAME type+entity was notified in the last hour.
      // This allows distinct events on the same entity (e.g. create then confirm).
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recent = await Notification.findOne({
        where: {
          type,
          entityId: entityId || null,
          entityType: entityType || null,
          createdAt: { [Op.gte]: oneHourAgo },
        },
      });
      if (recent) return recent;

      const notification = await this.repository.create({
        type,
        title,
        message,
        entityId: entityId || null,
        entityType: entityType || null,
      });
      await this._dispatchNotification(notification, patientId, type);
      return notification;
    } catch (err) {
      logger.error(`notifyEvent failed (${type}):`, err.message);
      return null;
    }
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = {};
      if (query.isRead !== undefined) where.isRead = query.isRead;
      if (query.type) where.type = query.type;

      const { rows, count } = await this.repository.findAndCountAll({
        where, offset, limit, order: [["createdAt", "DESC"]],
      });
      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.NOTIFICATION.RETRIEVED, "NOTIFICATION_LIST_ERROR");
  }

  async markRead(id) {
    return this.executeOperation(async () => {
      return this.repository.markAsRead(id);
    }, MESSAGES.NOTIFICATION.MARKED_READ, "NOTIFICATION_MARK_ERROR");
  }

  async markAllRead() {
    return this.executeOperation(async () => {
      return this.repository.markAllAsRead();
    }, MESSAGES.NOTIFICATION.MARKED_ALL_READ, "NOTIFICATION_MARK_ALL_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      await this.repository.delete(id);
      return true;
    }, MESSAGES.NOTIFICATION.DELETED, "NOTIFICATION_DELETE_ERROR");
  }

  async create(data) {
    return this.repository.create(data);
  }

}

module.exports = NotificationService;

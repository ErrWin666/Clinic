const BaseController = require("./BaseController");
const MessageDispatcher = require("../services/MessageDispatcher");
const { Notification, Patient } = require("../models");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");

class MessageDispatcherController extends BaseController {
  constructor() {
    super();
    this.dispatcher = new MessageDispatcher();
  }

  /**
   * Manually dispatch a notification through the cascade.
   */
  async dispatchNotification(req, res, next) {
    try {
      const notificationId = this.validateId(req.params.notificationId);
      const notification = await Notification.findByPk(notificationId);
      if (!notification) {
        throw new CustomError("Notification not found", "NOT_FOUND", 404);
      }

      // Find the patient via entityId/entityType
      let patient = null;
      if (notification.entityType === "patient" && notification.entityId) {
        patient = await Patient.findByPk(notification.entityId);
      }

      const result = await this.dispatcher.dispatch(notification, patient, notification.type);
      return this.sendSuccess(res, result, result.success ? MESSAGES.MESSAGE.DISPATCHED : MESSAGES.MESSAGE.DISPATCH_FAILED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the dispatch status of a notification.
   */
  async getDispatchStatus(req, res, next) {
    try {
      const notificationId = this.validateId(req.params.notificationId);
      const notification = await Notification.findByPk(notificationId, {
        attributes: ["id", "type", "dispatchChannel", "dispatchedAt", "dispatchError"],
      });
      if (!notification) {
        throw new CustomError("Notification not found", "NOT_FOUND", 404);
      }
      return this.sendSuccess(res, notification, "Dispatch status retrieved");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get aggregate dispatch statistics (today's counts per channel).
   */
  async getDispatchStats(req, res, next) {
    try {
      const stats = await this.dispatcher.getStats();
      return this.sendSuccess(res, stats, MESSAGES.MESSAGE.STATS_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MessageDispatcherController;

const BaseController = require("./BaseController");
const { Invoice, Payment } = require("../models");
const { sequelize } = require("../database");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const logger = require("../utils/logger");

class PaymentController extends BaseController {
  constructor() {
    super();
    this._notificationService = null;
  }

  _getNotificationService() {
    if (!this._notificationService) {
      const NotificationService = require("../services/NotificationService");
      this._notificationService = new NotificationService();
    }
    return this._notificationService;
  }

  async list(req, res, next) {
    try {
      const invoiceId = this.validateId(req.params.invoiceId);
      const payments = await Payment.findAll({
        where: { invoiceId },
        order: [["paymentDate", "DESC"], ["createdAt", "DESC"]],
      });
      return this.sendSuccess(res, payments, MESSAGES.PAYMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const invoiceId = this.validateId(req.params.invoiceId);
      const { amount, paymentDate, paymentMethod, note } = req.body;

      const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
      if (!invoice) {
        await t.rollback();
        throw new CustomError(MESSAGES.COMMON.NOT_FOUND, "NOT_FOUND", 404);
      }

      // Block payments on cancelled invoices
      if (invoice.invoiceStatus === "cancelled") {
        await t.rollback();
        throw new CustomError(MESSAGES.INVOICE.CANCELLED, "INVOICE_CANCELLED", 400);
      }

      if (Number(amount) <= 0) {
        await t.rollback();
        throw new CustomError(MESSAGES.PAYMENT.AMOUNT_MUST_BE_POSITIVE, "VALIDATION_ERROR", 400);
      }

      const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
      if (newPaidAmount > Number(invoice.totalAmount)) {
        await t.rollback();
        throw new CustomError(MESSAGES.PAYMENT.EXCEEDS_TOTAL, "PAYMENT_EXCEEDS_TOTAL", 400);
      }

      const payment = await Payment.create(
        { invoiceId, amount, paymentDate: paymentDate || new Date().toISOString().split("T")[0], paymentMethod: paymentMethod || "cash", note },
        { transaction: t }
      );

      let newStatus = invoice.invoiceStatus;
      if (newPaidAmount >= Number(invoice.totalAmount)) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partially-paid";
      }

      await invoice.update({ paidAmount: newPaidAmount, invoiceStatus: newStatus }, { transaction: t });

      await t.commit();

      // Event-driven: notify patient about payment received
      if (invoice.patientId) {
        this._getNotificationService().notifyEvent({
          type: "invoice_paid",
          title: "Payment Received",
          message: `Payment of ${amount} received for invoice ${invoice.displayId}`,
          patientId: invoice.patientId,
          entityId: invoice.id,
          entityType: "Invoice",
        }).catch((e) => logger.error("Payment notification failed:", e.message));
      }

      return this.sendSuccess(res, payment, MESSAGES.PAYMENT.RECORDED, 201);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  async delete(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const paymentId = this.validateId(req.params.id);
      const payment = await Payment.findByPk(paymentId, { transaction: t });
      if (!payment) {
        await t.rollback();
        throw new CustomError(MESSAGES.PAYMENT.NOT_FOUND, "NOT_FOUND", 404);
      }

      const invoice = await Invoice.findByPk(payment.invoiceId, { transaction: t });
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
        let newStatus = "unpaid";
        if (newPaidAmount >= Number(invoice.totalAmount)) {
          newStatus = "paid";
        } else if (newPaidAmount > 0) {
          newStatus = "partially-paid";
        }
        await invoice.update({ paidAmount: newPaidAmount, invoiceStatus: newStatus }, { transaction: t });
      }

      await payment.destroy({ transaction: t });
      await t.commit();
      return this.sendSuccess(res, null, MESSAGES.PAYMENT.DELETED);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
}

module.exports = PaymentController;

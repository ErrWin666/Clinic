const BaseService = require("./BaseService");
const InvoiceRepository = require("../repositories/InvoiceRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { sequelize } = require("../database");
const { InvoiceItem, Invoice, Payment } = require("../models");
const { generateInvoiceDisplayId } = require("../utils/displayId");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");
const dayjs = require("dayjs");
const logger = require("../utils/logger");
const { generateInvoicePDF } = require("../utils/pdf");
const { multiplyQtyPrice, sumMoney, computeInvoiceTotal } = require("../utils/money");

// Allowed status transitions. "overdue" is a DERIVED status (unpaid + dueDate < today)
// and cannot be set manually — it is never stored in the DB, so it's not a key here.
const VALID_INVOICE_TRANSITIONS = {
  unpaid: ["partially-paid", "paid", "cancelled"],
  "partially-paid": ["paid", "unpaid", "cancelled"],
  paid: ["partially-paid", "cancelled"],
  cancelled: [],
};

const TERMINAL_STATUSES = ["paid", "cancelled"];

class InvoiceService extends BaseService {
  constructor() {
    super(new InvoiceRepository());
    this._notificationService = null;
    this._stockService = null;
  }

  _getNotificationService() {
    if (!this._notificationService) {
      const NotificationService = require("./NotificationService");
      this._notificationService = new NotificationService();
    }
    return this._notificationService;
  }

  _getStockService() {
    if (!this._stockService) {
      const StockService = require("./stock");
      this._stockService = new StockService();
    }
    return this._stockService;
  }

  /**
   * Build the Sequelize `where` clause from list/filter query params.
   * Shared by list() and getStats() to ensure consistent filtering.
   */
  _buildWhere(query) {
    const where = {};
    if (query.status) {
      // "overdue" is a derived status (unpaid + dueDate < today), not stored in DB.
      // Translate it to the equivalent DB-level filter so list/stats return correct rows.
      if (query.status === "overdue") {
        const today = dayjs().format("YYYY-MM-DD");
        where.invoiceStatus = "unpaid";
        where.dueDate = { [Op.ne]: null, [Op.lt]: today };
      } else {
        where.invoiceStatus = query.status;
      }
    }
    if (query.patientId) where.patientId = query.patientId;
    if (query.invoiceType === "patient") where.patientId = { [Op.ne]: null };
    if (query.invoiceType === "customer") where.patientId = { [Op.is]: null };
    if (query.startDate && query.endDate) {
      where.invoiceDate = { [Op.between]: [query.startDate, query.endDate] };
    }

    if (query.search) {
      const term = `%${escapeLike(query.search)}%`;
      const LIKE = likeOp();
      where[Op.or] = [
        { displayId: { [LIKE]: term } },
        { customerName: { [LIKE]: term } },
        { "$patient.fullName$": { [LIKE]: term } },
      ];
    }

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.totalAmount = {};
      if (query.minAmount !== undefined) where.totalAmount[Op.gte] = query.minAmount;
      if (query.maxAmount !== undefined) where.totalAmount[Op.lte] = query.maxAmount;
    }

    return where;
  }

  async create(data) {
    return this.executeOperation(async () => {
      const transaction = await sequelize.transaction();
      try {
        const itemTotals = data.items.map((item) => multiplyQtyPrice(item.quantity, item.unitPrice));
        const totalAmount = computeInvoiceTotal(itemTotals, data.taxAmount, data.discountAmount);
        const displayId = await generateInvoiceDisplayId(Invoice, { transaction });

        // If invoice is created as "paid", set paidAmount = totalAmount
        const createData = { ...data, totalAmount, displayId };
        if (data.invoiceStatus === "paid") {
          createData.paidAmount = totalAmount;
        }

        const invoice = await this.repository.create(
          createData,
          { transaction }
        );

        for (const [index, item] of data.items.entries()) {
          await InvoiceItem.create(
            { ...item, invoiceId: invoice.id, total: itemTotals[index] },
            { transaction }
          );
        }

        // If invoice is created as "paid", deduct stock for items with productVariantId
        if (data.invoiceStatus === "paid") {
          // Fail transaction if stock is insufficient — no silent swallowing
          await this._getStockService().processInvoiceSale(invoice.id, transaction);
        }

        await transaction.commit();
        const result = await this.repository.findByIdWithItems(invoice.id);

        // Event-driven: notify patient that invoice is ready
        if (invoice.patientId) {
          this._getNotificationService().notifyEvent({
            type: "invoice_ready",
            title: "Invoice Ready",
            message: `Invoice ${invoice.displayId} for ${invoice.totalAmount} is ready`,
            patientId: invoice.patientId,
            entityId: invoice.id,
            entityType: "Invoice",
          }).catch((e) => logger.error("Invoice create notification failed:", e.message));
        }

        return result;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.INVOICE.CREATED, "INVOICE_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const invoice = await this.repository.findByIdWithItems(id);
      // Block edits on paid invoices outright
      if (invoice.invoiceStatus === "paid") {
        throw new CustomError(MESSAGES.INVOICE.PAID, "INVOICE_PAID", 400);
      }
      // Block edits on partially-paid invoices — they have recorded payments
      // and modifying items/totals could create inconsistencies.
      if (invoice.invoiceStatus === "partially-paid") {
        throw new CustomError(MESSAGES.INVOICE.HAS_PAYMENTS, "INVOICE_HAS_PAYMENTS", 400);
      }

      // If invoice has payments, prevent reducing totalAmount below paidAmount
      const paidAmount = Number(invoice.paidAmount) || 0;
      if (paidAmount > 0 && data.items) {
        const itemTotals = data.items.map((item) => multiplyQtyPrice(item.quantity, item.unitPrice));
        const taxAmount = data.taxAmount !== undefined ? data.taxAmount : invoice.taxAmount;
        const discountAmount = data.discountAmount !== undefined ? data.discountAmount : invoice.discountAmount;
        const newTotal = computeInvoiceTotal(itemTotals, taxAmount, discountAmount);
        if (newTotal < paidAmount) {
          throw new CustomError(
            MESSAGES.INVOICE.PAYMENT_EXCEEDS_TOTAL,
            "PAYMENT_EXCEEDS_TOTAL",
            400
          );
        }
      }

      const transaction = await sequelize.transaction();
      try {
        let totalAmount = invoice.totalAmount;
        if (data.items) {
          await InvoiceItem.destroy({ where: { invoiceId: id }, transaction });
          const itemTotals = [];
          for (const item of data.items) {
            const lineTotal = multiplyQtyPrice(item.quantity, item.unitPrice);
            itemTotals.push(lineTotal);
            await InvoiceItem.create(
              { ...item, invoiceId: id, total: lineTotal },
              { transaction }
            );
          }
          const taxAmount = data.taxAmount !== undefined ? data.taxAmount : invoice.taxAmount;
          const discountAmount = data.discountAmount !== undefined ? data.discountAmount : invoice.discountAmount;
          totalAmount = computeInvoiceTotal(itemTotals, taxAmount, discountAmount);
        }

        await invoice.update({ ...data, totalAmount }, { transaction });
        await transaction.commit();
        return this.repository.findByIdWithItems(id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.INVOICE.UPDATED, "INVOICE_UPDATE_ERROR");
  }

  async changeStatus(id, status) {
    return this.executeOperation(async () => {
      const invoice = await this.repository.findById(id);

      // "overdue" is a derived status — cannot be set manually
      if (status === "overdue") {
        throw new CustomError(MESSAGES.INVOICE.OVERDUE_DERIVED, "INVALID_STATUS_TRANSITION", 400);
      }

      const allowed = VALID_INVOICE_TRANSITIONS[invoice.invoiceStatus] ?? [];
      if (!allowed.includes(status)) {
        throw new CustomError(MESSAGES.INVOICE.INVALID_TRANSITION, "INVALID_STATUS_TRANSITION", 400);
      }

      const updateData = { invoiceStatus: status };

      // If reverting to "unpaid", zero out paidAmount (unless payments exist — then block)
      if (status === "unpaid") {
        const paymentCount = await Payment.count({ where: { invoiceId: id } });
        if (paymentCount > 0) {
          throw new CustomError(MESSAGES.INVOICE.HAS_PAYMENTS, "INVOICE_HAS_PAYMENTS", 400);
        }
        updateData.paidAmount = 0;
      }

      // If marking as "paid" but paidAmount < totalAmount, set paidAmount = totalAmount
      if (status === "paid" && Number(invoice.paidAmount) < Number(invoice.totalAmount)) {
        updateData.paidAmount = invoice.totalAmount;
      }

      // Capture old status BEFORE update (Sequelize modifies instance in place)
      const oldStatus = invoice.invoiceStatus;

      const transaction = await sequelize.transaction();
      try {
        const updated = await invoice.update(updateData, { transaction });

        // === Stock integration ===
        // Deduct stock when invoice becomes "paid" (and wasn't already paid)
        if (status === "paid" && oldStatus !== "paid") {
          // Fail transaction if stock is insufficient — no silent swallowing
          await this._getStockService().processInvoiceSale(invoice.id, transaction);
        }

        // Return stock when a "paid" invoice is cancelled
        if (status === "cancelled" && oldStatus === "paid") {
          await this._getStockService().processInvoiceReturn(invoice.id, transaction);
        }

        await transaction.commit();

        // Event-driven: notify patient about payment confirmation
        if (updated.patientId && status === "paid") {
          this._getNotificationService().notifyEvent({
            type: "invoice_paid",
            title: "Payment Confirmed",
            message: `Payment confirmed for invoice ${updated.displayId}`,
            patientId: updated.patientId,
            entityId: updated.id,
            entityType: "Invoice",
          }).catch((e) => logger.error("Invoice status notification failed:", e.message));
        }

        return updated;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.INVOICE.STATUS_UPDATED, "INVOICE_STATUS_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const invoice = await this.repository.findByIdWithItems(id);
      if (invoice.invoiceStatus === "paid") {
        throw new CustomError(MESSAGES.INVOICE.PAID, "INVOICE_PAID", 400);
      }
      // Block deletion if invoice has recorded payments
      const paymentCount = await Payment.count({ where: { invoiceId: id } });
      if (paymentCount > 0) {
        throw new CustomError(MESSAGES.INVOICE.HAS_PAYMENTS, "INVOICE_HAS_PAYMENTS", 400);
      }
      await invoice.destroy();
      return true;
    }, MESSAGES.INVOICE.DELETED, "INVOICE_DELETE_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      return this.repository.findByIdWithPatient(id);
    }, MESSAGES.INVOICE.RETRIEVED_ONE, "INVOICE_GET_ERROR");
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = this._buildWhere(query);

      const include = [{
        association: "patient",
        attributes: ["id", "displayId", "fullName"],
      }];

      const { rows, count } = await this.repository.searchWithFilters({ where, offset, limit, include });
      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.INVOICE.RETRIEVED, "INVOICE_LIST_ERROR");
  }

  /**
   * Compute summary statistics across ALL invoices matching the filter
   * (ignoring pagination). Used by the stats cards on the invoices page.
   */
  async getStats(query) {
    return this.executeOperation(async () => {
      const where = this._buildWhere(query);
      const include = [{ association: "patient", attributes: [] }];

      // Aggregate counts and sums grouped by invoiceStatus
      const grouped = await Invoice.findAll({
        where,
        include,
        attributes: [
          "invoiceStatus",
          [sequelize.fn("COUNT", sequelize.col("Invoice.id")), "count"],
          [sequelize.fn("SUM", sequelize.col("Invoice.totalAmount")), "totalAmount"],
          [sequelize.fn("SUM", sequelize.col("Invoice.paidAmount")), "paidAmount"],
        ],
        group: ["Invoice.invoiceStatus"],
        raw: true,
      });

      let unpaidCount = 0;
      let unpaidTotal = 0;
      let paidCount = 0;
      let paidTotal = 0;
      let partiallyPaidCount = 0;
      let partiallyPaidTotal = 0;
      let partiallyPaidPaidAmount = 0;

      for (const row of grouped) {
        if (row.invoiceStatus === "paid") {
          paidCount = Number(row.count);
          paidTotal = Number(row.totalAmount) || 0;
        } else if (row.invoiceStatus === "unpaid") {
          unpaidCount = Number(row.count);
          unpaidTotal = Number(row.totalAmount) || 0;
        } else if (row.invoiceStatus === "partially-paid") {
          partiallyPaidCount = Number(row.count);
          partiallyPaidTotal = Number(row.totalAmount) || 0;
          partiallyPaidPaidAmount = Number(row.paidAmount) || 0;
        }
      }

      // Overdue: unpaid invoices with dueDate before today
      const today = dayjs().format("YYYY-MM-DD");
      const overdueRows = await Invoice.findAll({
        where: {
          ...where,
          invoiceStatus: "unpaid",
          dueDate: { [Op.ne]: null, [Op.lt]: today },
        },
        include,
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("Invoice.id")), "count"],
          [sequelize.fn("SUM", sequelize.col("Invoice.totalAmount")), "totalAmount"],
        ],
        raw: true,
      });
      const overdueCount = Number(overdueRows[0]?.count) || 0;
      const overdueTotal = Number(overdueRows[0]?.totalAmount) || 0;

      const totalCount = unpaidCount + paidCount + partiallyPaidCount;
      const totalPaidAmount = paidTotal + partiallyPaidPaidAmount;
      const totalOutstanding = unpaidTotal + (partiallyPaidTotal - partiallyPaidPaidAmount);

      return {
        unpaidCount,
        unpaidTotal,
        paidCount,
        paidTotal,
        partiallyPaidCount,
        partiallyPaidTotal,
        partiallyPaidPaidAmount,
        overdueCount,
        overdueTotal,
        totalCount,
        totalPaidAmount,
        totalOutstanding,
      };
    }, MESSAGES.INVOICE.RETRIEVED, "INVOICE_STATS_ERROR");
  }

  async generateInvoicePDFDoc(id, clinicSettings) {
    const invoice = await this.getById(id);
    return generateInvoicePDF(invoice, clinicSettings);
  }
}

module.exports = InvoiceService;

const BaseService = require("./BaseService");
const SupplierRepository = require("../repositories/SupplierRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Supplier, PurchaseOrder, SupplierPayment } = require("../models");
const { generateDisplayId } = require("../utils/displayId");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class SupplierService extends BaseService {
  constructor() {
    super(new SupplierRepository());
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      const where = { isActive: true };
      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { name: { [LIKE]: term } },
          { displayId: { [LIKE]: term } },
          { phone: { [LIKE]: term } },
          { contactPerson: { [LIKE]: term } },
        ];
      }

      const { rows, count } = await this.repository.searchWithFilters({
        where,
        offset,
        limit,
      });

      // Attach balance to each supplier
      const suppliersWithBalance = await Promise.all(
        rows.map(async (supplier) => {
          const balance = await this.getBalance(supplier.id);
          return { ...supplier.toJSON(), balance };
        })
      );

      return {
        rows: suppliersWithBalance,
        pagination: buildPaginationResponse(count, page, pageSize),
      };
    }, MESSAGES.SUPPLIER.RETRIEVED, "SUPPLIER_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const supplier = await this.repository.findByIdWithAll(id);
      if (!supplier) {
        throw new CustomError(MESSAGES.SUPPLIER.NOT_FOUND, "SUPPLIER_NOT_FOUND", 404);
      }
      const balance = await this.getBalance(id);
      return { ...supplier.toJSON(), balance };
    }, MESSAGES.SUPPLIER.RETRIEVED_ONE, "SUPPLIER_GET_ERROR");
  }

  async create(data) {
    return this.executeOperation(async () => {
      const displayId = await generateDisplayId(Supplier, "SUP");
      return this.repository.create({ ...data, displayId });
    }, MESSAGES.SUPPLIER.CREATED, "SUPPLIER_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const supplier = await this.repository.findById(id);
      return supplier.update(data);
    }, MESSAGES.SUPPLIER.UPDATED, "SUPPLIER_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const balance = await this.getBalance(id);
      if (Math.abs(balance) > 0.01) {
        throw new CustomError(MESSAGES.SUPPLIER.HAS_OUTSTANDING_BALANCE, "SUPPLIER_HAS_BALANCE", 400);
      }
      const supplier = await this.repository.findById(id);
      return supplier.update({ isActive: false });
    }, MESSAGES.SUPPLIER.DELETED, "SUPPLIER_DELETE_ERROR");
  }

  /**
   * Calculate supplier balance: openingBalance + received POs total - payments total
   */
  async getBalance(supplierId) {
    const supplier = await this.repository.findById(supplierId);
    if (!supplier) return 0;

    const receivedTotal = await this.repository.sumReceivedPOsTotal(supplierId);
    const paymentsTotal = await this.repository.sumPaymentsTotal(supplierId);

    return Number(supplier.openingBalance) + Number(receivedTotal) - Number(paymentsTotal);
  }

  /**
   * Get supplier statement (kashf hesab): POs + payments sorted by date
   */
  async getStatement(supplierId, startDate, endDate) {
    return this.executeOperation(async () => {
      const supplier = await this.repository.findById(supplierId);
      if (!supplier) {
        throw new CustomError(MESSAGES.SUPPLIER.NOT_FOUND, "SUPPLIER_NOT_FOUND", 404);
      }

      const poWhere = { supplierId, status: "received" };
      if (startDate && endDate) {
        poWhere.receivedDate = { [Op.gte]: startDate, [Op.lte]: endDate };
      }
      const purchaseOrders = await PurchaseOrder.findAll({
        where: poWhere,
        order: [["receivedDate", "ASC"]],
      });

      const paymentWhere = { supplierId };
      if (startDate && endDate) {
        paymentWhere.paymentDate = { [Op.gte]: startDate, [Op.lte]: endDate };
      }
      const payments = await SupplierPayment.findAll({
        where: paymentWhere,
        order: [["paymentDate", "ASC"]],
      });

      // Merge into a single statement
      const transactions = [
        ...purchaseOrders.map((po) => ({
          date: po.receivedDate,
          type: "purchase_order",
          displayId: po.displayId,
          referenceId: po.id,
          debit: Number(po.totalAmount),
          credit: 0,
          note: po.note,
        })),
        ...payments.map((p) => ({
          date: p.paymentDate,
          type: "payment",
          displayId: p.displayId,
          referenceId: p.id,
          debit: 0,
          credit: Number(p.amount),
          note: p.note,
        })),
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate running balance
      let runningBalance = Number(supplier.openingBalance);
      const statement = transactions.map((t) => {
        runningBalance += t.debit - t.credit;
        return { ...t, balance: Number(runningBalance.toFixed(2)) };
      });

      const currentBalance = await this.getBalance(supplierId);

      return {
        supplier: supplier.toJSON(),
        openingBalance: Number(supplier.openingBalance),
        currentBalance,
        transactions: statement,
      };
    }, MESSAGES.SUPPLIER.STATEMENT_RETRIEVED, "SUPPLIER_STATEMENT_ERROR");
  }
}

module.exports = SupplierService;

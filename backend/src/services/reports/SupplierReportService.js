const BaseService = require("../BaseService");
const { Supplier, PurchaseOrder, SupplierPayment } = require("../../models");
const { Op } = require("sequelize");
const { sequelize } = require("../../database");
const { likeOp, escapeLike } = require("../../utils/queryHelpers");
const MESSAGES = require("../../constants/messages");

class SupplierReportService extends BaseService {
  constructor() {
    super(null);
  }

  async exportSuppliers(query) {
    return this.executeOperation(async () => {
      const where = { isActive: true };
      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { name: { [LIKE]: term } },
          { displayId: { [LIKE]: term } },
          { phone: { [LIKE]: term } },
        ];
      }

      const suppliers = await Supplier.findAll({
        where,
        order: [["createdAt", "DESC"]],
      });

      // Calculate balances
      const supplierIds = suppliers.map((s) => s.id);
      const poTotals = await PurchaseOrder.findAll({
        where: { supplierId: { [Op.in]: supplierIds }, status: "received" },
        attributes: [
          "supplierId",
          [sequelize.fn("SUM", sequelize.col("totalAmount")), "total"],
        ],
        group: ["supplierId"],
        raw: true,
      });
      const paymentTotals = await SupplierPayment.findAll({
        where: { supplierId: { [Op.in]: supplierIds } },
        attributes: [
          "supplierId",
          [sequelize.fn("SUM", sequelize.col("amount")), "total"],
        ],
        group: ["supplierId"],
        raw: true,
      });

      const poMap = {};
      poTotals.forEach((p) => { poMap[p.supplierId] = Number(p.total) || 0; });
      const payMap = {};
      paymentTotals.forEach((p) => { payMap[p.supplierId] = Number(p.total) || 0; });

      const headers = [
        "DisplayID", "Name", "Phone", "Email", "ContactPerson",
        "OpeningBalance", "Balance",
      ];
      const rows = suppliers.map((s) => {
        const balance = Number(s.openingBalance) + (poMap[s.id] || 0) - (payMap[s.id] || 0);
        return [
          s.displayId,
          s.name,
          s.phone || "",
          s.email || "",
          s.contactPerson || "",
          s.openingBalance,
          Number(balance.toFixed(2)),
        ];
      });

      return { headers, rows };
    }, MESSAGES.REPORT.SUPPLIERS_EXPORTED, "REPORT_SUPPLIERS_ERROR");
  }

  async exportPurchaseOrders(query) {
    return this.executeOperation(async () => {
      const where = {};
      if (query.supplierId) where.supplierId = query.supplierId;
      if (query.status) where.status = query.status;
      if (query.startDate && query.endDate) {
        where.orderDate = { [Op.between]: [query.startDate, query.endDate] };
      }

      const pos = await PurchaseOrder.findAll({
        where,
        order: [["orderDate", "DESC"]],
        include: [{ association: "supplier", attributes: ["name", "displayId"] }],
      });

      const headers = [
        "DisplayID", "Supplier", "Status", "TotalAmount",
        "OrderDate", "ReceivedDate", "Note",
      ];
      const rows = pos.map((po) => [
        po.displayId,
        po.supplier?.name || "",
        po.status,
        po.totalAmount,
        po.orderDate,
        po.receivedDate || "",
        po.note || "",
      ]);

      return { headers, rows };
    }, MESSAGES.REPORT.PURCHASE_ORDERS_EXPORTED, "REPORT_PO_ERROR");
  }

  async exportSupplierStatement(supplierId, query) {
    return this.executeOperation(async () => {
      const supplier = await Supplier.findByPk(supplierId);
      if (!supplier) {
        const CustomError = require("../../utils/CustomError");
        throw new CustomError("Supplier not found", "SUPPLIER_NOT_FOUND", 404);
      }

      const poWhere = { supplierId, status: "received" };
      if (query.startDate && query.endDate) {
        poWhere.receivedDate = { [Op.between]: [query.startDate, query.endDate] };
      }
      const purchaseOrders = await PurchaseOrder.findAll({
        where: poWhere,
        order: [["receivedDate", "ASC"]],
      });

      const paymentWhere = { supplierId };
      if (query.startDate && query.endDate) {
        paymentWhere.paymentDate = { [Op.between]: [query.startDate, query.endDate] };
      }
      const payments = await SupplierPayment.findAll({
        where: paymentWhere,
        order: [["paymentDate", "ASC"]],
      });

      const headers = ["Date", "Type", "Reference", "Debit", "Credit", "Balance", "Note"];
      let runningBalance = Number(supplier.openingBalance);
      const rows = [];

      // Opening balance row
      rows.push(["", "Opening Balance", "", "", "", Number(runningBalance.toFixed(2)), ""]);

      for (const po of purchaseOrders) {
        runningBalance += Number(po.totalAmount);
        rows.push([
          po.receivedDate,
          "Purchase Order",
          po.displayId,
          po.totalAmount,
          "",
          Number(runningBalance.toFixed(2)),
          po.note || "",
        ]);
      }

      for (const p of payments) {
        runningBalance -= Number(p.amount);
        rows.push([
          p.paymentDate,
          "Payment",
          p.displayId,
          "",
          p.amount,
          Number(runningBalance.toFixed(2)),
          p.note || "",
        ]);
      }

      return { headers, rows };
    }, MESSAGES.REPORT.SUPPLIER_STATEMENT_EXPORTED, "REPORT_STATEMENT_ERROR");
  }
}

module.exports = SupplierReportService;

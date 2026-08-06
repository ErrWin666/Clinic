const BaseService = require("./BaseService");
const { Patient, Appointment, Invoice, EyeExamination, ProductVariant, Batch } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../database");
const MESSAGES = require("../constants/messages");
const config = require("../config");

const isSQLite = config.database.dialect === "sqlite";
const monthExpr = isSQLite
  ? (col) => sequelize.literal(`strftime('%b', ${col})`)
  : (col) => sequelize.literal(`TO_CHAR(${col}, 'Mon')`);
const monthSortExpr = isSQLite
  ? (col) => sequelize.literal(`strftime('%Y-%m', ${col})`)
  : (col) => sequelize.literal(`TO_CHAR(${col}, 'YYYY-MM')`);

class DashboardService extends BaseService {
  constructor() {
    super(null);
  }

  async getStats(startDate, endDate) {
    return this.executeOperation(async () => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];

      const dateFilter = {};
      if (startDate) dateFilter[Op.gte] = startDate;
      if (endDate) dateFilter[Op.lte] = endDate;

      const totalPatients = await Patient.count();
      const todayAppointments = await Appointment.count({
        where: { appointmentDate: today, status: { [Op.ne]: "cancelled" } },
      });

      const unpaidCount = await Invoice.count({
        where: { invoiceStatus: "unpaid" },
      });
      const unpaidTotal = await Invoice.sum("totalAmount", {
        where: { invoiceStatus: "unpaid" },
      });
      const unpaidInvoices = {
        count: unpaidCount,
        totalAmount: Number(unpaidTotal) || 0,
      };

      const monthlyRevenueResult = await Invoice.sum("paidAmount", {
        where: {
          invoiceStatus: "paid",
          invoiceDate: { [Op.gte]: currentMonthStart },
        },
      });
      const monthlyRevenue = Number(monthlyRevenueResult) || 0;

      const appointmentWhere = { appointmentDate: { [Op.gte]: sixMonthsAgoStr } };
      if (startDate || endDate) {
        appointmentWhere.appointmentDate = { ...dateFilter };
      }

      const appointmentsChart = await Appointment.findAll({
        where: appointmentWhere,
        attributes: [
          [monthExpr("appointmentDate"), "month"],
          [sequelize.fn("count", sequelize.col("id")), "count"],
        ],
        group: ["month"],
        order: [[monthSortExpr("appointmentDate"), "ASC"]],
        raw: true,
      });

      const invoiceWhere = {
        invoiceStatus: "paid",
        invoiceDate: { [Op.gte]: sixMonthsAgoStr },
      };
      if (startDate || endDate) {
        invoiceWhere.invoiceDate = { ...dateFilter };
      }

      const revenueChart = await Invoice.findAll({
        where: invoiceWhere,
        attributes: [
          [monthExpr("invoiceDate"), "month"],
          [sequelize.fn("sum", sequelize.col("paidAmount")), "amount"],
        ],
        group: ["month"],
        order: [[monthSortExpr("invoiceDate"), "ASC"]],
        raw: true,
      });

      const recentAppointments = await Appointment.findAll({
        where: { status: { [Op.ne]: "cancelled" } },
        include: [{ association: "patient", attributes: ["id", "displayId", "fullName"] }],
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      const recentExaminations = await EyeExamination.findAll({
        include: [{ association: "patient", attributes: ["id", "displayId", "fullName"] }],
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      // Patient demographics
      const genderDistribution = await Patient.findAll({
        attributes: [
          "gender",
          [sequelize.fn("count", sequelize.col("id")), "count"],
        ],
        group: ["gender"],
        raw: true,
      });

      const patientTypeDistribution = await Patient.findAll({
        attributes: [
          "patientType",
          [sequelize.fn("count", sequelize.col("id")), "count"],
        ],
        group: ["patientType"],
        raw: true,
      });

      // === Inventory stats ===
      const todayPlus30 = new Date();
      todayPlus30.setDate(todayPlus30.getDate() + 30);
      const todayPlus30Str = todayPlus30.toISOString().split("T")[0];

      // Total inventory value: SUM(batch.quantity * batch.unitCost)
      const activeBatches = await Batch.findAll({
        where: { isActive: true },
        attributes: ["quantity", "unitCost"],
        raw: true,
      });
      const inventoryValue = activeBatches.reduce(
        (sum, b) => sum + Number(b.quantity) * Number(b.unitCost),
        0
      );

      // Low stock: quantity <= minQuantity AND quantity > 0
      const lowStockVariants = await ProductVariant.findAll({
        where: {
          isActive: true,
          quantity: { [Op.gt]: 0 },
        },
        attributes: ["quantity", "minQuantity"],
        raw: true,
      });
      const lowStockCount = lowStockVariants.filter(
        (v) => v.quantity <= v.minQuantity
      ).length;

      // Out of stock
      const outOfStockCount = await ProductVariant.count({
        where: { isActive: true, quantity: 0 },
      });

      // Expiring soon (within 30 days)
      const expiringCount = await Batch.count({
        where: {
          isActive: true,
          expiryDate: { [Op.gte]: today, [Op.lt]: todayPlus30Str },
        },
      });

      // Expired
      const expiredCount = await Batch.count({
        where: {
          isActive: true,
          expiryDate: { [Op.lt]: today },
        },
      });

      return {
        totalPatients,
        todayAppointments,
        unpaidInvoices,
        monthlyRevenue,
        appointmentsChart: appointmentsChart.map((item) => ({
          month: item.month,
          count: Number(item.count),
        })),
        revenueChart: revenueChart.map((item) => ({
          month: item.month,
          amount: Number(item.amount),
        })),
        recentAppointments,
        recentExaminations,
        demographics: {
          gender: genderDistribution.map((item) => ({
            label: item.gender,
            count: Number(item.count),
          })),
          patientType: patientTypeDistribution.map((item) => ({
            label: item.patientType,
            count: Number(item.count),
          })),
        },
        inventory: {
          totalValue: Number(inventoryValue.toFixed(2)),
          lowStockCount,
          outOfStockCount,
          expiringCount,
          expiredCount,
        },
      };
    }, MESSAGES.DASHBOARD.STATS_RETRIEVED, "DASHBOARD_ERROR");
  }
}

module.exports = DashboardService;

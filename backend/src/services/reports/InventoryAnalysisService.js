const BaseService = require("../BaseService");
const {
  ProductVariant, Batch, StockMovement, Invoice,
} = require("../../models");
const { Op } = require("sequelize");
const MESSAGES = require("../../constants/messages");
const dayjs = require("dayjs");
const { roundTo2, multiplyQtyPrice, sumMoney, calculateMargin } = require("../../utils/money");

class InventoryAnalysisService extends BaseService {
  constructor() {
    super(null);
  }

  async getInventoryValuationReport() {
    return this.executeOperation(async () => {
      const variants = await ProductVariant.findAll({
        where: { isActive: true, quantity: { [Op.gt]: 0 } },
        include: [
          { association: "product", attributes: ["name", "displayId", "costingMethod"] },
          { association: "batches", where: { isActive: true }, required: false },
        ],
      });

      const items = variants.map((v) => {
        const batches = v.batches || [];
        const totalCost = sumMoney(batches.map((b) => multiplyQtyPrice(b.quantity, b.unitCost)));
        const avgCost = v.quantity > 0 ? roundTo2(totalCost / v.quantity) : 0;
        const sellValue = multiplyQtyPrice(v.quantity, v.sellPrice);
        return {
          displayId: v.product?.displayId,
          productName: v.product?.name,
          variantName: v.name,
          sku: v.sku,
          quantity: v.quantity,
          avgCost,
          totalCost: roundTo2(totalCost),
          sellPrice: Number(v.sellPrice),
          potentialProfit: roundTo2(sellValue - totalCost),
        };
      });

      const grandTotalCost = sumMoney(items.map((i) => i.totalCost));
      const grandTotalSell = sumMoney(items.map((i) => multiplyQtyPrice(i.quantity, i.sellPrice)));

      return {
        items,
        summary: {
          totalVariants: items.length,
          totalCostValue: roundTo2(grandTotalCost),
          totalSellValue: roundTo2(grandTotalSell),
          potentialProfit: roundTo2(grandTotalSell - grandTotalCost),
        },
      };
    }, MESSAGES.REPORT.INVENTORY_VALUATION_RETRIEVED, "REPORT_VALUATION_ERROR");
  }

  async getProfitLossReport(startDate, endDate) {
    return this.executeOperation(async () => {
      const paidInvoices = await Invoice.findAll({
        where: {
          invoiceStatus: "paid",
          invoiceDate: { [Op.between]: [startDate, endDate] },
        },
        include: [{ association: "items" }],
      });

      const revenueValues = [];
      const cogsValues = [];
      const soldItems = [];

      for (const inv of paidInvoices) {
        for (const item of inv.items) {
          const lineTotal = multiplyQtyPrice(item.quantity, item.unitPrice);
          revenueValues.push(lineTotal);
          const costAmount = Number(item.costAmount) || 0;
          if (item.productVariantId && costAmount) {
            cogsValues.push(costAmount);
          }
          soldItems.push({
            invoiceDisplayId: inv.displayId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            lineTotal: roundTo2(lineTotal),
            costAmount,
            profit: roundTo2(lineTotal - costAmount),
          });
        }
      }

      const revenue = sumMoney(revenueValues);
      const cogs = sumMoney(cogsValues);
      const grossProfit = roundTo2(revenue - cogs);

      // Losses from damage and expiry (from StockMovements in the date range)
      const lossMovements = await StockMovement.findAll({
        where: {
          type: "out",
          reason: { [Op.in]: ["damage", "expiry"] },
          movementDate: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        raw: true,
      });
      const damageValues = [];
      const expiryValues = [];
      for (const m of lossMovements) {
        const loss = multiplyQtyPrice(Math.abs(m.quantity), Number(m.unitCost));
        if (m.reason === "damage") damageValues.push(loss);
        else if (m.reason === "expiry") expiryValues.push(loss);
      }
      const damageLoss = sumMoney(damageValues);
      const expiryLoss = sumMoney(expiryValues);
      const netProfit = roundTo2(grossProfit - damageLoss - expiryLoss);

      return {
        startDate,
        endDate,
        revenue: roundTo2(revenue),
        cogs: roundTo2(cogs),
        grossProfit,
        grossMargin: calculateMargin(revenue, cogs),
        damageLoss: roundTo2(damageLoss),
        expiryLoss: roundTo2(expiryLoss),
        netProfit,
        items: soldItems,
      };
    }, MESSAGES.REPORT.PROFIT_LOSS_RETRIEVED, "REPORT_PROFIT_LOSS_ERROR");
  }

  async getLowStockReport() {
    return this.executeOperation(async () => {
      const variants = await ProductVariant.findAll({
        where: {
          isActive: true,
          quantity: { [Op.gt]: 0 },
        },
        include: [{ association: "product", attributes: ["name", "displayId"] }],
      });

      const lowStock = variants
        .filter((v) => v.quantity <= v.minQuantity)
        .map((v) => ({
          displayId: v.product?.displayId,
          productName: v.product?.name,
          variantName: v.name,
          sku: v.sku,
          quantity: v.quantity,
          minQuantity: v.minQuantity,
          shortfall: v.minQuantity - v.quantity,
        }));

      return {
        items: lowStock,
        count: lowStock.length,
      };
    }, MESSAGES.REPORT.LOW_STOCK_RETRIEVED, "REPORT_LOW_STOCK_ERROR");
  }

  async getExpiryReport(days = 30) {
    return this.executeOperation(async () => {
      const today = dayjs().format("YYYY-MM-DD");
      const futureDate = dayjs().add(days, "day").format("YYYY-MM-DD");

      const batchInclude = [
        {
          association: "variant",
          attributes: ["name", "sku"],
          include: [{ association: "product", attributes: ["name", "displayId"] }],
        },
      ];

      const expiringBatches = await Batch.findAll({
        where: {
          isActive: true,
          expiryDate: { [Op.gte]: today, [Op.lte]: futureDate },
        },
        include: batchInclude,
        order: [["expiryDate", "ASC"]],
      });

      const expiredBatches = await Batch.findAll({
        where: {
          isActive: true,
          expiryDate: { [Op.lt]: today },
        },
        include: batchInclude,
        order: [["expiryDate", "ASC"]],
      });

      return {
        expiringSoon: expiringBatches.map((b) => ({
          batchNumber: b.batchNumber,
          productName: b.variant?.product?.name,
          variantName: b.variant?.name,
          sku: b.variant?.sku,
          quantity: b.quantity,
          expiryDate: b.expiryDate,
          unitCost: Number(b.unitCost),
          daysUntilExpiry: dayjs(b.expiryDate).diff(dayjs(today), "day"),
        })),
        expired: expiredBatches.map((b) => ({
          batchNumber: b.batchNumber,
          productName: b.variant?.product?.name,
          variantName: b.variant?.name,
          sku: b.variant?.sku,
          quantity: b.quantity,
          expiryDate: b.expiryDate,
          unitCost: Number(b.unitCost),
          daysExpired: dayjs(today).diff(dayjs(b.expiryDate), "day"),
        })),
      };
    }, MESSAGES.REPORT.EXPIRY_REPORT_RETRIEVED, "REPORT_EXPIRY_ERROR");
  }

  async getDeadStockReport(months = 3) {
    return this.executeOperation(async () => {
      const cutoffDate = dayjs().subtract(months, "month").format("YYYY-MM-DD");

      const variants = await ProductVariant.findAll({
        where: { isActive: true, quantity: { [Op.gt]: 0 } },
        include: [{ association: "product", attributes: ["name", "displayId"] }],
      });

      const deadStockItems = [];
      for (const v of variants) {
        const recentOutMovements = await StockMovement.count({
          where: {
            productVariantId: v.id,
            type: "out",
            movementDate: { [Op.gte]: cutoffDate },
          },
        });
        if (recentOutMovements === 0) {
          const batches = await Batch.findAll({
            where: { productVariantId: v.id, isActive: true },
            attributes: ["quantity", "unitCost"],
            raw: true,
          });
          const totalCost = sumMoney(batches.map((b) => multiplyQtyPrice(b.quantity, b.unitCost)));
          deadStockItems.push({
            displayId: v.product?.displayId,
            productName: v.product?.name,
            variantName: v.name,
            sku: v.sku,
            quantity: v.quantity,
            totalCost: roundTo2(totalCost),
            inactiveMonths: months,
          });
        }
      }

      return {
        items: deadStockItems,
        count: deadStockItems.length,
        totalValue: sumMoney(deadStockItems.map((i) => i.totalCost)),
      };
    }, MESSAGES.REPORT.DEAD_STOCK_RETRIEVED, "REPORT_DEAD_STOCK_ERROR");
  }

  async getMovementsSummaryReport(startDate, endDate) {
    return this.executeOperation(async () => {
      const where = {};
      if (startDate && endDate) {
        where.movementDate = { [Op.gte]: startDate, [Op.lte]: endDate };
      }

      const movements = await StockMovement.findAll({
        where,
        include: [{ association: "variant", include: [{ association: "product" }] }],
        raw: true,
        nest: true,
      });

      const byVariant = new Map();
      for (const m of movements) {
        const key = m.productVariantId;
        if (!byVariant.has(key)) {
          byVariant.set(key, {
            variantId: key,
            variantName: m.variant?.name,
            productName: m.variant?.product?.name,
            sku: m.variant?.sku,
            inQuantity: 0,
            outQuantity: 0,
            inValue: 0,
            outValue: 0,
            adjustments: 0,
          });
        }
        const entry = byVariant.get(key);
        const qty = Number(m.quantity);
        const value = qty * Number(m.unitCost || 0);
        if (m.type === "in") {
          entry.inQuantity += qty;
          entry.inValue += value;
        } else if (m.type === "out") {
          entry.outQuantity += qty;
          entry.outValue += value;
        } else if (m.type === "adjust") {
          entry.adjustments += qty;
        }
      }

      const items = Array.from(byVariant.values()).map((e) => ({
        ...e,
        inValue: roundTo2(e.inValue),
        outValue: roundTo2(e.outValue),
        netQuantity: e.inQuantity - e.outQuantity,
      }));

      return {
        items,
        count: items.length,
        totalInValue: sumMoney(items.map((i) => i.inValue)),
        totalOutValue: sumMoney(items.map((i) => i.outValue)),
      };
    }, MESSAGES.REPORT.STOCK_MOVEMENTS_EXPORTED, "REPORT_MOVEMENTS_SUMMARY_ERROR");
  }

  async getStockAgingReport() {
    return this.executeOperation(async () => {
      const today = dayjs();
      const batches = await Batch.findAll({
        where: { isActive: true, quantity: { [Op.gt]: 0 } },
        include: [{ association: "variant", include: [{ association: "product" }] }],
      });

      const items = batches.map((b) => {
        const receivedDate = dayjs(b.receivedDate);
        const ageDays = today.diff(receivedDate, "day");
        let bucket = "0-30";
        if (ageDays > 90) bucket = "90+";
        else if (ageDays > 60) bucket = "61-90";
        else if (ageDays > 30) bucket = "31-60";

        return {
          batchId: b.id,
          batchNumber: b.batchNumber,
          variantId: b.productVariantId,
          variantName: b.variant?.name,
          productName: b.variant?.product?.name,
          quantity: b.quantity,
          unitCost: Number(b.unitCost),
          totalValue: multiplyQtyPrice(b.quantity, b.unitCost),
          receivedDate: b.receivedDate,
          ageDays,
          bucket,
          expiryDate: b.expiryDate,
        };
      });

      const buckets = ["0-30", "31-60", "61-90", "90+"];
      const summary = buckets.map((bucket) => {
        const bucketItems = items.filter((i) => i.bucket === bucket);
        return {
          bucket,
          count: bucketItems.length,
          totalValue: sumMoney(bucketItems.map((i) => i.totalValue)),
          totalQuantity: bucketItems.reduce((s, i) => s + i.quantity, 0),
        };
      });

      return {
        items,
        summary,
        totalValue: sumMoney(items.map((i) => i.totalValue)),
      };
    }, MESSAGES.REPORT.INVENTORY_VALUATION_RETRIEVED, "REPORT_AGING_ERROR");
  }
}

module.exports = InventoryAnalysisService;

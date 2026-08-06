const BaseService = require("../BaseService");
const { StockMovement, Batch, ProductVariant, Product } = require("../../models");
const { Op } = require("sequelize");
const { roundTo2, multiplyQtyPrice, sumMoney } = require("../../utils/money");

class StockAnalyticsService extends BaseService {
  constructor() {
    super(null);
  }

  async getInventoryStats() {
    const { sequelize } = require("../../database");

    const batches = await Batch.findAll({
      where: { isActive: true, quantity: { [Op.gt]: 0 } },
      attributes: ["quantity", "unitCost"],
      raw: true,
    });
    const totalValue = sumMoney(batches.map((b) => multiplyQtyPrice(b.quantity, b.unitCost)));

    const allVariants = await ProductVariant.findAll({
      where: { isActive: true },
      attributes: ["quantity", "minQuantity", "maxQuantity"],
      raw: true,
    });
    const lowStockCount = allVariants.filter((v) => v.quantity > 0 && v.quantity <= v.minQuantity).length;
    const outOfStockCount = allVariants.filter((v) => v.quantity === 0).length;
    const overstockCount = allVariants.filter((v) => v.maxQuantity > 0 && v.quantity > v.maxQuantity).length;

    const today = new Date().toISOString().split("T")[0];
    const future30 = new Date();
    future30.setDate(future30.getDate() + 30);
    const future30Str = future30.toISOString().split("T")[0];

    const expiringCount = await Batch.count({
      where: { isActive: true, quantity: { [Op.gt]: 0 }, expiryDate: { [Op.gte]: today, [Op.lt]: future30Str } },
    });
    const expiredCount = await Batch.count({
      where: { isActive: true, quantity: { [Op.gt]: 0 }, expiryDate: { [Op.lt]: today } },
    });

    return {
      totalValue: roundTo2(totalValue),
      lowStockCount,
      outOfStockCount,
      overstockCount,
      expiringCount,
      expiredCount,
    };
  }

  async checkAlerts(daysAhead = 30) {
    const today = new Date().toISOString().split("T")[0];
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    const futureStr = future.toISOString().split("T")[0];

    const variants = await ProductVariant.findAll({
      where: { isActive: true },
      include: [{ model: Product, as: "product" }],
    });
    const lowStock = variants
      .filter((v) => v.quantity > 0 && v.quantity <= v.minQuantity)
      .map((v) => ({
        type: "low_stock",
        variantId: v.id,
        variantName: v.name,
        sku: v.sku,
        productName: v.product?.name,
        quantity: v.quantity,
        minQuantity: v.minQuantity,
      }));
    const outOfStock = variants
      .filter((v) => v.quantity === 0)
      .map((v) => ({
        type: "out_of_stock",
        variantId: v.id,
        variantName: v.name,
        sku: v.sku,
        productName: v.product?.name,
        quantity: 0,
        minQuantity: v.minQuantity,
      }));

    const expiringBatches = await Batch.findAll({
      where: {
        isActive: true,
        quantity: { [Op.gt]: 0 },
        expiryDate: { [Op.gte]: today, [Op.lt]: futureStr },
      },
      include: [{ model: ProductVariant, as: "variant", include: [{ model: Product, as: "product" }] }],
    });
    const expiring = expiringBatches.map((b) => ({
      type: "expiring",
      batchId: b.id,
      batchNumber: b.batchNumber,
      variantId: b.productVariantId,
      variantName: b.variant?.name,
      productName: b.variant?.product?.name,
      quantity: b.quantity,
      expiryDate: b.expiryDate,
      daysUntilExpiry: Math.ceil(
        (new Date(b.expiryDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    const expiredBatches = await Batch.findAll({
      where: {
        isActive: true,
        quantity: { [Op.gt]: 0 },
        expiryDate: { [Op.lt]: today },
      },
      include: [{ model: ProductVariant, as: "variant", include: [{ model: Product, as: "product" }] }],
    });
    const expired = expiredBatches.map((b) => ({
      type: "expired",
      batchId: b.id,
      batchNumber: b.batchNumber,
      variantId: b.productVariantId,
      variantName: b.variant?.name,
      productName: b.variant?.product?.name,
      quantity: b.quantity,
      expiryDate: b.expiryDate,
      daysUntilExpiry: Math.ceil(
        (new Date(b.expiryDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return {
      lowStock,
      outOfStock,
      expiring,
      expired,
      summary: {
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        expiringCount: expiring.length,
        expiredCount: expired.length,
        total: lowStock.length + outOfStock.length + expiring.length + expired.length,
      },
    };
  }

  async getInventoryValuation() {
    const variants = await ProductVariant.findAll({
      where: { isActive: true },
      include: [{ model: Product, as: "product" }],
    });

    const result = [];
    for (const variant of variants) {
      const batches = await Batch.findAll({
        where: { productVariantId: variant.id, isActive: true, quantity: { [Op.gt]: 0 } },
        raw: true,
      });
      const value = sumMoney(batches.map((b) => multiplyQtyPrice(b.quantity, b.unitCost)));
      result.push({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        productName: variant.product?.name,
        quantity: variant.quantity,
        costPrice: Number(variant.costPrice),
        sellPrice: Number(variant.sellPrice),
        inventoryValue: roundTo2(value),
        potentialRevenue: multiplyQtyPrice(variant.quantity, variant.sellPrice),
      });
    }
    return result;
  }

  async getProfitLossReport(startDate, endDate) {
    // Use InvoiceItem.unitPrice (historical price at time of sale) instead of
    // variant.sellPrice (current price) for accurate revenue calculation.
    const { Invoice, InvoiceItem } = require("../../models");

    const paidInvoices = await Invoice.findAll({
      where: {
        invoiceStatus: "paid",
        invoiceDate: { [Op.gte]: startDate, [Op.lte]: endDate },
      },
      include: [{ association: "items" }],
    });

    const revenueValues = [];
    const cogsValues = [];

    for (const inv of paidInvoices) {
      for (const item of inv.items) {
        const lineTotal = multiplyQtyPrice(item.quantity, item.unitPrice);
        revenueValues.push(lineTotal);
        const costAmount = Number(item.costAmount) || 0;
        if (item.productVariantId && costAmount) {
          cogsValues.push(costAmount);
        }
      }
    }

    // Losses from damage and expiry
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

    const revenue = sumMoney(revenueValues);
    const cogs = sumMoney(cogsValues);
    const damageLoss = sumMoney(damageValues);
    const expiryLoss = sumMoney(expiryValues);
    const grossProfit = roundTo2(revenue - cogs);
    const netProfit = roundTo2(grossProfit - damageLoss - expiryLoss);
    const grossMargin = revenue > 0 ? roundTo2((grossProfit / revenue) * 100) : 0;

    return {
      revenue: roundTo2(revenue),
      cogs: roundTo2(cogs),
      grossProfit,
      grossMargin,
      damageLoss: roundTo2(damageLoss),
      expiryLoss: roundTo2(expiryLoss),
      netProfit,
    };
  }
}

module.exports = StockAnalyticsService;

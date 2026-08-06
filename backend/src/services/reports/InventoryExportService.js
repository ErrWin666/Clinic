const BaseService = require("../BaseService");
const { ProductVariant, StockMovement } = require("../../models");
const { Op } = require("sequelize");
const MESSAGES = require("../../constants/messages");

class InventoryExportService extends BaseService {
  constructor() {
    super(null);
  }

  async exportInventory(query) {
    return this.executeOperation(async () => {
      const variants = await ProductVariant.findAll({
        where: { isActive: true },
        include: [
          { association: "product", attributes: ["displayId", "name", "category"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      const headers = [
        "DisplayID", "Product", "Variant", "SKU", "Barcode",
        "Quantity", "CostPrice", "SellPrice", "Location", "MinQty", "MaxQty",
      ];
      const rows = variants.map((v) => [
        v.product?.displayId || "",
        v.product?.name || "",
        v.name,
        v.sku,
        v.barcode || "",
        v.quantity,
        v.costPrice || 0,
        v.sellPrice,
        v.location || "",
        v.minQuantity,
        v.maxQuantity,
      ]);

      return { headers, rows };
    }, MESSAGES.REPORT.INVENTORY_EXPORTED, "REPORT_INVENTORY_ERROR");
  }

  async exportStockMovements(query) {
    return this.executeOperation(async () => {
      const where = {};
      if (query.type) where.type = query.type;
      if (query.reason) where.reason = query.reason;
      if (query.productVariantId) where.productVariantId = query.productVariantId;
      if (query.startDate && query.endDate) {
        where.movementDate = { [Op.between]: [query.startDate, query.endDate] };
      }

      const movements = await StockMovement.findAll({
        where,
        order: [["movementDate", "DESC"], ["id", "DESC"]],
        include: [
          { association: "variant", attributes: ["name", "sku"] },
          { association: "batch", attributes: ["batchNumber"] },
        ],
        limit: 5000,
      });

      const headers = [
        "DisplayID", "Date", "Type", "Reason", "Variant", "SKU",
        "Batch", "Quantity", "UnitCost", "TotalCost", "Note",
      ];
      const rows = movements.map((m) => [
        m.displayId,
        m.movementDate,
        m.type,
        m.reason,
        m.variant?.name || "",
        m.variant?.sku || "",
        m.batch?.batchNumber || "",
        m.quantity,
        m.unitCost || 0,
        m.totalCost || 0,
        m.note || "",
      ]);

      return { headers, rows };
    }, MESSAGES.REPORT.STOCK_MOVEMENTS_EXPORTED, "REPORT_MOVEMENTS_ERROR");
  }
}

module.exports = InventoryExportService;

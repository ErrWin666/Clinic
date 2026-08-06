const BaseService = require("../BaseService");
const StockMovementRepository = require("../../repositories/StockMovementRepository");
const BatchRepository = require("../../repositories/BatchRepository");
const ProductVariantRepository = require("../../repositories/ProductVariantRepository");
const PackagingUnitRepository = require("../../repositories/PackagingUnitRepository");
const CustomError = require("../../utils/CustomError");
const MESSAGES = require("../../constants/messages");
const { StockMovement, Batch, ProductVariant } = require("../../models");
const { generateDisplayId } = require("../../utils/displayId");
const { Op } = require("sequelize");
const { roundTo2, multiplyQtyPrice, sumMoney } = require("../../utils/money");

class StockMovementService extends BaseService {
  constructor() {
    super(new StockMovementRepository());
    this._packagingRepository = new PackagingUnitRepository();
    this._batchRepository = new BatchRepository();
    this._variantRepository = new ProductVariantRepository();
  }

  async selectBatchesForSale(productVariantId, quantity, options = {}) {
    const transaction = options.transaction || undefined;
    const variant = await this._variantRepository.findByIdWithProduct(productVariantId, { transaction });
    if (!variant) {
      throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
    }

    const method = variant.product?.costingMethod || "fifo";

    if (method === "average") {
      const avgCost = await this.calculateWeightedAverage(productVariantId, { transaction });
      if (variant.quantity < quantity) {
        throw new CustomError(MESSAGES.STOCK_MOVEMENT.INSUFFICIENT_STOCK, "INSUFFICIENT_STOCK", 400);
      }
      const batches = await this._batchRepository.findActiveByVariantAverage(productVariantId, { transaction });
      return this._distributeAcrossBatches(batches, quantity, avgCost);
    }

    let batches;
    if (method === "fefo") {
      const withExpiry = await this._batchRepository.findActiveByVariantFEFO(productVariantId, { transaction });
      const noExpiry = await this._batchRepository.findActiveByVariantFIFO(productVariantId, { transaction });
      batches = [...withExpiry, ...noExpiry.filter((b) => !b.expiryDate)];
    } else {
      batches = await this._batchRepository.findActiveByVariantFIFO(productVariantId, { transaction });
    }

    return this._distributeAcrossBatches(batches, quantity);
  }

  _distributeAcrossBatches(batches, quantity, overrideCost = null) {
    const result = [];
    let remaining = quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      result.push({
        batchId: batch.id,
        quantity: take,
        unitCost: overrideCost !== null ? overrideCost : Number(batch.unitCost),
      });
      remaining -= take;
    }
    if (remaining > 0) {
      throw new CustomError(MESSAGES.STOCK_MOVEMENT.INSUFFICIENT_STOCK, "INSUFFICIENT_STOCK", 400);
    }
    return result;
  }

  async calculateWeightedAverage(productVariantId, options = {}) {
    const transaction = options.transaction || undefined;
    const batches = await this._batchRepository.findActiveByVariantAverage(productVariantId, { transaction });
    const values = batches.map((b) => multiplyQtyPrice(b.quantity, b.unitCost));
    const totalValue = sumMoney(values);
    const totalQty = batches.reduce((sum, b) => sum + Number(b.quantity), 0);
    return totalQty > 0 ? roundTo2(totalValue / totalQty) : 0;
  }

  async createMovement(data, transaction) {
    const { productVariantId, batchId, type, quantity, reason, unitCost, referenceType, referenceId, userId, note, movementDate } = data;

    const batch = await Batch.findByPk(batchId, { transaction });
    if (!batch) {
      throw new CustomError(MESSAGES.BATCH.NOT_FOUND, "BATCH_NOT_FOUND", 404);
    }
    if (!batch.isActive) {
      throw new CustomError(MESSAGES.BATCH.NOT_ACTIVE, "BATCH_NOT_ACTIVE", 400);
    }

    if (type === "out" || type === "adjust") {
      if (quantity < 0 && batch.quantity + quantity < 0) {
        throw new CustomError(MESSAGES.BATCH.INSUFFICIENT_QUANTITY, "INSUFFICIENT_QUANTITY", 400);
      }
    }

    const displayId = await generateDisplayId(StockMovement, "MOV", { transaction });

    const movement = await StockMovement.create(
      {
        displayId,
        productVariantId,
        batchId,
        type,
        quantity,
        reason,
        unitCost: unitCost || Number(batch.unitCost),
        referenceType: referenceType || "Manual",
        referenceId: referenceId || null,
        userId: userId || null,
        note: note || null,
        movementDate: movementDate || new Date().toISOString().split("T")[0],
      },
      { transaction }
    );

    const newBatchQty = batch.quantity + quantity;
    await batch.update(
      { quantity: newBatchQty, isActive: newBatchQty > 0 ? batch.isActive : false },
      { transaction }
    );

    await this._recalculateVariantQuantity(productVariantId, transaction);

    return movement;
  }

  async _recalculateVariantQuantity(productVariantId, transaction) {
    const { sequelize } = require("../../database");
    const result = await Batch.findOne({
      where: { productVariantId, isActive: true },
      attributes: [[sequelize.fn("SUM", sequelize.col("quantity")), "total"]],
      raw: true,
      transaction,
    });
    const total = Number(result?.total) || 0;
    await ProductVariant.update({ quantity: total }, { where: { id: productVariantId }, transaction });

    const avgCost = await this.calculateWeightedAverage(productVariantId, { transaction });
    await ProductVariant.update({ costPrice: avgCost }, { where: { id: productVariantId }, transaction });
  }

  async adjustStock(productVariantId, batchId, newQuantity, userId, note, transaction) {
    const batch = await Batch.findByPk(batchId, { transaction });
    if (!batch) throw new CustomError(MESSAGES.BATCH.NOT_FOUND, "BATCH_NOT_FOUND", 404);

    const difference = newQuantity - batch.quantity;
    if (difference === 0) return null;

    return this.createMovement(
      {
        productVariantId,
        batchId,
        type: "adjust",
        quantity: difference,
        reason: "adjustment",
        unitCost: Number(batch.unitCost),
        userId,
        note: note || "Stock adjustment",
      },
      transaction
    );
  }

  async recordDamage(batchId, quantity, userId, note, transaction) {
    const batch = await Batch.findByPk(batchId, { transaction });
    if (!batch) throw new CustomError(MESSAGES.BATCH.NOT_FOUND, "BATCH_NOT_FOUND", 404);
    if (quantity > batch.quantity) {
      throw new CustomError(MESSAGES.BATCH.INSUFFICIENT_QUANTITY, "INSUFFICIENT_QUANTITY", 400);
    }

    return this.createMovement(
      {
        productVariantId: batch.productVariantId,
        batchId,
        type: "out",
        quantity: -quantity,
        reason: "damage",
        unitCost: Number(batch.unitCost),
        userId,
        note: note || "Damaged stock",
      },
      transaction
    );
  }

  async recordExpiry(batchId, userId, note, transaction) {
    const batch = await Batch.findByPk(batchId, { transaction });
    if (!batch) throw new CustomError(MESSAGES.BATCH.NOT_FOUND, "BATCH_NOT_FOUND", 404);

    return this.createMovement(
      {
        productVariantId: batch.productVariantId,
        batchId,
        type: "out",
        quantity: -batch.quantity,
        reason: "expiry",
        unitCost: Number(batch.unitCost),
        userId,
        note: note || "Expired stock",
      },
      transaction
    );
  }

  /**
   * Record a recall: return an entire batch to the supplier.
   * Creates an "out" movement with reason "recall" and deactivates the batch.
   * @param {number} batchId
   * @param {number} supplierId - supplier to return to (for reference)
   * @param {number} userId
   * @param {string} note
   * @param {object} transaction
   */
  async recordRecall(batchId, supplierId, userId, note, transaction) {
    const batch = await Batch.findByPk(batchId, { transaction });
    if (!batch) throw new CustomError(MESSAGES.BATCH.NOT_FOUND, "BATCH_NOT_FOUND", 404);
    if (!batch.isActive) {
      throw new CustomError(MESSAGES.BATCH.NOT_ACTIVE, "BATCH_NOT_ACTIVE", 400);
    }
    if (batch.quantity <= 0) {
      throw new CustomError(MESSAGES.BATCH.INSUFFICIENT_QUANTITY, "BATCH_INSUFFICIENT_QUANTITY", 400);
    }

    const movement = await this.createMovement(
      {
        productVariantId: batch.productVariantId,
        batchId,
        type: "out",
        quantity: -batch.quantity,
        reason: "recall",
        unitCost: Number(batch.unitCost),
        userId,
        note: note || `Recall: returned to supplier ${supplierId}`,
        referenceType: "Supplier",
        referenceId: supplierId,
      },
      transaction
    );

    // Deactivate the batch after recall
    await batch.update({ isActive: false, quantity: 0 }, { transaction });

    return movement;
  }

  async recordOpeningStock(productVariantId, quantity, unitCost, batchNumber, expiryDate, userId, transaction) {
    const today = new Date().toISOString().split("T")[0];

    const batch = await Batch.create(
      {
        productVariantId,
        batchNumber: batchNumber || "OPENING",
        quantity: 0,
        initialQuantity: quantity,
        unitCost,
        expiryDate: expiryDate || null,
        receivedDate: today,
        isActive: true,
      },
      { transaction }
    );

    const movement = await this.createMovement(
      {
        productVariantId,
        batchId: batch.id,
        type: "in",
        quantity,
        reason: "opening_stock",
        unitCost,
        userId,
        note: "Opening stock",
      },
      transaction
    );

    await batch.reload({ transaction });
    return { batch, movement };
  }

  async listMovements(query) {
    const { parsePagination, buildPaginationResponse } = require("../../utils/pagination");
    const { page, pageSize, offset, limit } = parsePagination(query);

    const where = {};
    if (query.type) where.type = query.type;
    if (query.reason) where.reason = query.reason;
    if (query.productVariantId) where.productVariantId = query.productVariantId;
    if (query.batchId) where.batchId = query.batchId;
    if (query.referenceType) where.referenceType = query.referenceType;
    if (query.referenceId) where.referenceId = query.referenceId;
    if (query.startDate && query.endDate) {
      where.movementDate = { [Op.gte]: query.startDate, [Op.lte]: query.endDate };
    }

    const { rows, count } = await this.repository.searchWithFilters({
      where,
      offset,
      limit,
    });

    return {
      rows,
      pagination: buildPaginationResponse(count, page, pageSize),
    };
  }
}

module.exports = StockMovementService;

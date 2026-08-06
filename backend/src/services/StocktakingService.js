const BaseService = require("./BaseService");
const StocktakingRepository = require("../repositories/StocktakingRepository");
const ProductVariantRepository = require("../repositories/ProductVariantRepository");
const BatchRepository = require("../repositories/BatchRepository");
const StockService = require("./stock");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Stocktaking, StocktakingItem, ProductVariant, Batch, sequelize } = require("../models");
const { generateDisplayId } = require("../utils/displayId");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");

class StocktakingService extends BaseService {
  constructor() {
    super(new StocktakingRepository());
    this._variantRepository = new ProductVariantRepository();
    this._batchRepository = new BatchRepository();
    this._stockService = new StockService();
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = {};
      if (query.status) where.status = query.status;

      const { rows, count } = await this.repository.findAndCountAll({
        where,
        offset,
        limit,
        order: [["createdAt", "DESC"]],
      });
      return { rows, pagination: buildPaginationResponse(count, page, pageSize) };
    }, MESSAGES.STOCKTAKING.RETRIEVED, "STOCKTAKING_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const stocktaking = await this.repository.findByIdWithItems(id);
      if (!stocktaking) {
        throw new CustomError(MESSAGES.STOCKTAKING.NOT_FOUND, "STOCKTAKING_NOT_FOUND", 404);
      }
      return stocktaking;
    }, MESSAGES.STOCKTAKING.RETRIEVED_ONE, "STOCKTAKING_GET_ERROR");
  }

  /**
   * Start a new stocktaking session. Auto-populates items with current system quantities
   * for all active variants (and their active batches).
   */
  async start(userId, note) {
    return this.executeOperation(async () => {
      const displayId = await generateDisplayId(Stocktaking, "STK");
      const transaction = await sequelize.transaction();
      try {
        const stocktaking = await Stocktaking.create(
          {
            displayId,
            status: "in_progress",
            startedAt: new Date(),
            userId,
            note: note || null,
          },
          { transaction }
        );

        // Auto-populate items for all active variants with active batches
        const batches = await Batch.findAll({
          where: { isActive: true },
          include: [{ model: ProductVariant, as: "variant", where: { isActive: true } }],
          transaction,
        });

        const items = batches.map((batch) => ({
          stocktakingId: stocktaking.id,
          productVariantId: batch.productVariantId,
          batchId: batch.id,
          systemQuantity: batch.quantity,
          countedQuantity: null,
          difference: null,
        }));

        if (items.length > 0) {
          await StocktakingItem.bulkCreate(items, { transaction });
        }

        await transaction.commit();
        return this.repository.findByIdWithItems(stocktaking.id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.STOCKTAKING.CREATED, "STOCKTAKING_START_ERROR");
  }

  /**
   * Update counted quantities for items. Accepts an array of { id, countedQuantity, note }.
   */
  async updateCounts(stocktakingId, items) {
    return this.executeOperation(async () => {
      const stocktaking = await this.repository.findById(stocktakingId);
      if (!stocktaking) {
        throw new CustomError(MESSAGES.STOCKTAKING.NOT_FOUND, "STOCKTAKING_NOT_FOUND", 404);
      }
      if (stocktaking.status === "completed") {
        throw new CustomError(MESSAGES.STOCKTAKING.ALREADY_COMPLETED, "STOCKTAKING_COMPLETED", 400);
      }
      if (stocktaking.status === "cancelled") {
        throw new CustomError(MESSAGES.STOCKTAKING.ALREADY_CANCELLED, "STOCKTAKING_CANCELLED", 400);
      }

      const transaction = await sequelize.transaction();
      try {
        for (const update of items) {
          const item = await StocktakingItem.findByPk(update.id, { transaction });
          if (!item || item.stocktakingId !== stocktakingId) continue;

          const counted = update.countedQuantity != null ? Number(update.countedQuantity) : null;
          const difference = counted != null ? counted - item.systemQuantity : null;
          await item.update(
            { countedQuantity: counted, difference, note: update.note || item.note },
            { transaction }
          );
        }
        await transaction.commit();
        return this.repository.findByIdWithItems(stocktakingId);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.STOCKTAKING.UPDATED, "STOCKTAKING_UPDATE_ERROR");
  }

  /**
   * Complete a stocktaking: create adjust movements for all items with a difference,
   * then mark the stocktaking as completed.
   */
  async complete(stocktakingId, userId) {
    return this.executeOperation(async () => {
      const stocktaking = await this.repository.findByIdWithItems(stocktakingId);
      if (!stocktaking) {
        throw new CustomError(MESSAGES.STOCKTAKING.NOT_FOUND, "STOCKTAKING_NOT_FOUND", 404);
      }
      if (stocktaking.status === "completed") {
        throw new CustomError(MESSAGES.STOCKTAKING.ALREADY_COMPLETED, "STOCKTAKING_COMPLETED", 400);
      }
      if (stocktaking.status === "cancelled") {
        throw new CustomError(MESSAGES.STOCKTAKING.ALREADY_CANCELLED, "STOCKTAKING_CANCELLED", 400);
      }

      const transaction = await sequelize.transaction();
      try {
        for (const item of stocktaking.items) {
          if (item.countedQuantity == null || item.difference == null || item.difference === 0) continue;

          // Create an adjust movement for the difference
          await this._stockService.createMovement(
            {
              productVariantId: item.productVariantId,
              batchId: item.batchId,
              type: "adjust",
              quantity: item.difference,
              reason: "adjustment",
              unitCost: 0,
              userId,
              note: item.note || `Stocktaking ${stocktaking.displayId}`,
              referenceType: "Stocktaking",
              referenceId: stocktaking.id,
            },
            transaction
          );
        }

        await stocktaking.update(
          { status: "completed", completedAt: new Date() },
          { transaction }
        );
        await transaction.commit();
        return this.repository.findByIdWithItems(stocktakingId);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.STOCKTAKING.COMPLETED, "STOCKTAKING_COMPLETE_ERROR");
  }

  async cancel(stocktakingId) {
    return this.executeOperation(async () => {
      const stocktaking = await this.repository.findById(stocktakingId);
      if (!stocktaking) {
        throw new CustomError(MESSAGES.STOCKTAKING.NOT_FOUND, "STOCKTAKING_NOT_FOUND", 404);
      }
      if (stocktaking.status === "completed") {
        throw new CustomError(MESSAGES.STOCKTAKING.ALREADY_COMPLETED, "STOCKTAKING_COMPLETED", 400);
      }
      return stocktaking.update({ status: "cancelled" });
    }, MESSAGES.STOCKTAKING.CANCELLED, "STOCKTAKING_CANCEL_ERROR");
  }
}

module.exports = StocktakingService;

const BaseController = require("./BaseController");
const StockService = require("../services/stock");
const MESSAGES = require("../constants/messages");
const { sequelize } = require("../database");

class StockController extends BaseController {
  constructor() {
    super();
    this.stockService = new StockService();
  }

  async listMovements(req, res, next) {
    try {
      const { rows, pagination } = await this.stockService.listMovements(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.STOCK_MOVEMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async createMovement(req, res, next) {
    try {
      const transaction = await sequelize.transaction();
      try {
        const userId = req.user?.id;
        const movement = await this.stockService.createMovement(
          { ...req.body, userId, referenceType: "Manual" },
          transaction
        );
        await transaction.commit();
        return this.sendSuccess(res, movement, MESSAGES.STOCK_MOVEMENT.CREATED, 201);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const transaction = await sequelize.transaction();
      try {
        const userId = req.user?.id;
        const { productVariantId, batchId, newQuantity, note } = req.body;
        const movement = await this.stockService.adjustStock(
          productVariantId,
          batchId,
          newQuantity,
          userId,
          note,
          transaction
        );
        await transaction.commit();
        return this.sendSuccess(res, movement, MESSAGES.INVENTORY.ADJUSTED);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async recordDamage(req, res, next) {
    try {
      const transaction = await sequelize.transaction();
      try {
        const userId = req.user?.id;
        const { batchId, quantity, note } = req.body;
        const movement = await this.stockService.recordDamage(batchId, quantity, userId, note, transaction);
        await transaction.commit();
        return this.sendSuccess(res, movement, MESSAGES.INVENTORY.DAMAGE_RECORDED, 201);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async recordExpiry(req, res, next) {
    try {
      const transaction = await sequelize.transaction();
      try {
        const userId = req.user?.id;
        const { batchId, note } = req.body;
        const movement = await this.stockService.recordExpiry(batchId, userId, note, transaction);
        await transaction.commit();
        return this.sendSuccess(res, movement, MESSAGES.INVENTORY.EXPIRY_RECORDED, 201);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async recordOpeningStock(req, res, next) {
    try {
      const transaction = await sequelize.transaction();
      try {
        const userId = req.user?.id;
        const { productVariantId, quantity, unitCost, batchNumber, expiryDate } = req.body;
        const result = await this.stockService.recordOpeningStock(
          productVariantId,
          quantity,
          unitCost,
          batchNumber,
          expiryDate,
          userId,
          transaction
        );
        await transaction.commit();
        return this.sendSuccess(res, result, MESSAGES.INVENTORY.OPENING_STOCK_RECORDED, 201);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.stockService.getInventoryStats();
      return this.sendSuccess(res, stats, MESSAGES.INVENTORY.STATS_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async checkAlerts(req, res, next) {
    try {
      const daysAhead = req.query.daysAhead ? Number(req.query.daysAhead) : 30;
      const alerts = await this.stockService.checkAlerts(daysAhead);
      return this.sendSuccess(res, alerts, MESSAGES.INVENTORY.STATS_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getValuation(req, res, next) {
    try {
      const valuation = await this.stockService.getInventoryValuation();
      return this.sendSuccess(res, valuation, MESSAGES.INVENTORY.VALUATION_CALCULATED);
    } catch (error) {
      next(error);
    }
  }

  async getProfitLoss(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await this.stockService.getProfitLossReport(startDate, endDate);
      return this.sendSuccess(res, report, MESSAGES.INVENTORY.PROFIT_LOSS_CALCULATED);
    } catch (error) {
      next(error);
    }
  }

  async getVariantMovements(req, res, next) {
    try {
      const variantId = this.validateId(req.params.variantId);
      const result = await this.stockService.listMovements({
        ...req.query,
        productVariantId: variantId,
      });
      return this.sendPaginated(res, result.rows, result.pagination, MESSAGES.STOCK_MOVEMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getBatchMovements(req, res, next) {
    try {
      const batchId = this.validateId(req.params.batchId);
      const result = await this.stockService.listMovements({
        ...req.query,
        batchId,
      });
      return this.sendPaginated(res, result.rows, result.pagination, MESSAGES.STOCK_MOVEMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StockController;

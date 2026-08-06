const BaseController = require("./BaseController");
const StocktakingService = require("../services/StocktakingService");
const MESSAGES = require("../constants/messages");

class StocktakingController extends BaseController {
  constructor() {
    super();
    this.stocktakingService = new StocktakingService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.stocktakingService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.STOCKTAKING.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const stocktaking = await this.stocktakingService.getById(id);
      return this.sendSuccess(res, stocktaking, MESSAGES.STOCKTAKING.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async start(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const note = req.body?.note || null;
      const stocktaking = await this.stocktakingService.start(userId, note);
      return this.sendSuccess(res, stocktaking, MESSAGES.STOCKTAKING.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCounts(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const items = req.body?.items || [];
      const stocktaking = await this.stocktakingService.updateCounts(id, items);
      return this.sendSuccess(res, stocktaking, MESSAGES.STOCKTAKING.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async complete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const userId = req.user?.id || null;
      const stocktaking = await this.stocktakingService.complete(id, userId);
      return this.sendSuccess(res, stocktaking, MESSAGES.STOCKTAKING.COMPLETED);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const stocktaking = await this.stocktakingService.cancel(id);
      return this.sendSuccess(res, stocktaking, MESSAGES.STOCKTAKING.CANCELLED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StocktakingController;

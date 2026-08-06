const BaseController = require("./BaseController");
const PurchaseOrderService = require("../services/PurchaseOrderService");
const MESSAGES = require("../constants/messages");

class PurchaseOrderController extends BaseController {
  constructor() {
    super();
    this.purchaseOrderService = new PurchaseOrderService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.purchaseOrderService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.PURCHASE_ORDER.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const po = await this.purchaseOrderService.getById(id);
      return this.sendSuccess(res, po, MESSAGES.PURCHASE_ORDER.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.id;
      const po = await this.purchaseOrderService.create(req.body, userId);
      return this.sendSuccess(res, po, MESSAGES.PURCHASE_ORDER.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const po = await this.purchaseOrderService.update(id, req.body);
      return this.sendSuccess(res, po, MESSAGES.PURCHASE_ORDER.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async receive(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const userId = req.user?.id;
      const po = await this.purchaseOrderService.receive(id, req.body.items, userId);
      return this.sendSuccess(res, po, MESSAGES.PURCHASE_ORDER.RECEIVED);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const po = await this.purchaseOrderService.cancel(id);
      return this.sendSuccess(res, po, MESSAGES.PURCHASE_ORDER.CANCELLED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PurchaseOrderController;

const BaseController = require("./BaseController");
const ProductBundleService = require("../services/ProductBundleService");
const MESSAGES = require("../constants/messages");

class ProductBundleController extends BaseController {
  constructor() {
    super();
    this.bundleService = new ProductBundleService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.bundleService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.PRODUCT_BUNDLE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const bundle = await this.bundleService.getById(id);
      return this.sendSuccess(res, bundle, MESSAGES.PRODUCT_BUNDLE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const bundle = await this.bundleService.create(req.body);
      return this.sendSuccess(res, bundle, MESSAGES.PRODUCT_BUNDLE.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const bundle = await this.bundleService.update(id, req.body);
      return this.sendSuccess(res, bundle, MESSAGES.PRODUCT_BUNDLE.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.bundleService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.PRODUCT_BUNDLE.DELETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Expand a bundle into individual invoice line items.
   * Useful for the frontend to preview what items will be added.
   */
  async expand(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const quantity = req.body.quantity || 1;
      const items = await this.bundleService.expandBundle(id, quantity);
      return this.sendSuccess(res, items, MESSAGES.PRODUCT_BUNDLE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductBundleController;

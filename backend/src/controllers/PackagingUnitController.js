const BaseController = require("./BaseController");
const PackagingUnitService = require("../services/PackagingUnitService");
const MESSAGES = require("../constants/messages");

class PackagingUnitController extends BaseController {
  constructor() {
    super();
    this.packagingService = new PackagingUnitService();
  }

  async listByVariant(req, res, next) {
    try {
      const variantId = this.validateId(req.params.variantId);
      const units = await this.packagingService.listByVariant(variantId);
      return this.sendSuccess(res, units, MESSAGES.PACKAGING_UNIT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const variantId = this.validateId(req.params.variantId);
      const unit = await this.packagingService.create(variantId, req.body);
      return this.sendSuccess(res, unit, MESSAGES.PACKAGING_UNIT.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const unit = await this.packagingService.update(id, req.body);
      return this.sendSuccess(res, unit, MESSAGES.PACKAGING_UNIT.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.packagingService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.PACKAGING_UNIT.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PackagingUnitController;

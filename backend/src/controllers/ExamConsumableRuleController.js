const BaseController = require("./BaseController");
const ExamConsumableRuleService = require("../services/ExamConsumableRuleService");
const MESSAGES = require("../constants/messages");

class ExamConsumableRuleController extends BaseController {
  constructor() {
    super();
    this.ruleService = new ExamConsumableRuleService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.ruleService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.EXAM_CONSUMABLE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const rule = await this.ruleService.getById(id);
      return this.sendSuccess(res, rule, MESSAGES.EXAM_CONSUMABLE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const rule = await this.ruleService.create(req.body);
      return this.sendSuccess(res, rule, MESSAGES.EXAM_CONSUMABLE.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const rule = await this.ruleService.update(id, req.body);
      return this.sendSuccess(res, rule, MESSAGES.EXAM_CONSUMABLE.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.ruleService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.EXAM_CONSUMABLE.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExamConsumableRuleController;

const BaseService = require("./BaseService");
const { ExamConsumableRule, ProductVariant } = require("../models");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Op } = require("sequelize");

class ExamConsumableRuleService extends BaseService {
  constructor() {
    super(); // No default repository — we use ExamConsumableRule directly
  }

  async list(query) {
    return this.executeOperation(async () => {
      const where = {};
      if (query.examType) where.examType = query.examType;
      if (query.isActive !== undefined) {
        where.isActive = query.isActive === "true" || query.isActive === true;
      }
      if (query.productVariantId) where.productVariantId = query.productVariantId;

      const rules = await ExamConsumableRule.findAll({
        where,
        include: [{ model: ProductVariant, as: "variant", attributes: ["id", "name", "sku"] }],
        order: [["examType", "ASC"], ["id", "ASC"]],
      });

      return { rows: rules, pagination: { total: rules.length } };
    }, MESSAGES.EXAM_CONSUMABLE.RETRIEVED, "CONSUMABLE_RULE_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const rule = await ExamConsumableRule.findByPk(id, {
        include: [{ model: ProductVariant, as: "variant", attributes: ["id", "name", "sku"] }],
      });
      if (!rule) {
        throw new CustomError(MESSAGES.EXAM_CONSUMABLE.NOT_FOUND, "CONSUMABLE_RULE_NOT_FOUND", 404);
      }
      return rule;
    }, MESSAGES.EXAM_CONSUMABLE.RETRIEVED, "CONSUMABLE_RULE_GET_ERROR");
  }

  async create(data) {
    return this.executeOperation(async () => {
      // Verify product variant exists
      const variant = await ProductVariant.findByPk(data.productVariantId);
      if (!variant) {
        throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
      }

      // Check for duplicate rule (same examType + productVariantId)
      const existing = await ExamConsumableRule.findOne({
        where: {
          examType: data.examType,
          productVariantId: data.productVariantId,
          isActive: true,
        },
      });
      if (existing) {
        throw new CustomError(
          "Consumable rule already exists for this exam type and product variant",
          "DUPLICATE_CONSUMABLE_RULE",
          400
        );
      }

      return ExamConsumableRule.create({
        examType: data.examType,
        productVariantId: data.productVariantId,
        quantity: data.quantity || 1,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    }, MESSAGES.EXAM_CONSUMABLE.CREATED, "CONSUMABLE_RULE_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const rule = await ExamConsumableRule.findByPk(id);
      if (!rule) {
        throw new CustomError(MESSAGES.EXAM_CONSUMABLE.NOT_FOUND, "CONSUMABLE_RULE_NOT_FOUND", 404);
      }

      if (data.productVariantId) {
        const variant = await ProductVariant.findByPk(data.productVariantId);
        if (!variant) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
        }
      }

      const updateData = {};
      if (data.examType !== undefined) updateData.examType = data.examType;
      if (data.productVariantId !== undefined) updateData.productVariantId = data.productVariantId;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      return rule.update(updateData);
    }, MESSAGES.EXAM_CONSUMABLE.UPDATED, "CONSUMABLE_RULE_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const rule = await ExamConsumableRule.findByPk(id);
      if (!rule) {
        throw new CustomError(MESSAGES.EXAM_CONSUMABLE.NOT_FOUND, "CONSUMABLE_RULE_NOT_FOUND", 404);
      }
      // Soft delete (paranoid)
      await rule.destroy();
      return true;
    }, MESSAGES.EXAM_CONSUMABLE.DELETED, "CONSUMABLE_RULE_DELETE_ERROR");
  }

  /**
   * Get all active rules for a given exam type.
   */
  async getRulesForExamType(examType) {
    return ExamConsumableRule.findAll({
      where: { examType, isActive: true },
      include: [{ model: ProductVariant, as: "variant" }],
    });
  }
}

module.exports = ExamConsumableRuleService;

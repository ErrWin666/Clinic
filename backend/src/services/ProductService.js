const BaseService = require("./BaseService");
const ProductRepository = require("../repositories/ProductRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Product } = require("../models");
const { generateDisplayId } = require("../utils/displayId");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class ProductService extends BaseService {
  constructor() {
    super(new ProductRepository());
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      const where = { isActive: true };
      if (query.category) where.category = query.category;
      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { name: { [LIKE]: term } },
          { displayId: { [LIKE]: term } },
          { description: { [LIKE]: term } },
        ];
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
    }, MESSAGES.PRODUCT.RETRIEVED, "PRODUCT_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const product = await this.repository.findByIdWithVariants(id);
      if (!product) {
        throw new CustomError(MESSAGES.PRODUCT.NOT_FOUND, "PRODUCT_NOT_FOUND", 404);
      }
      return product;
    }, MESSAGES.PRODUCT.RETRIEVED_ONE, "PRODUCT_GET_ERROR");
  }

  async create(data) {
    return this.executeOperation(async () => {
      const displayId = await generateDisplayId(Product, "PRD");
      return this.repository.create({ ...data, displayId });
    }, MESSAGES.PRODUCT.CREATED, "PRODUCT_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const product = await this.repository.findById(id);
      return product.update(data);
    }, MESSAGES.PRODUCT.UPDATED, "PRODUCT_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const hasVariants = await this.repository.hasActiveVariants(id);
      if (hasVariants) {
        throw new CustomError(MESSAGES.PRODUCT.HAS_ACTIVE_VARIANTS, "PRODUCT_HAS_VARIANTS", 400);
      }
      return this.repository.delete(id);
    }, MESSAGES.PRODUCT.DELETED, "PRODUCT_DELETE_ERROR");
  }
}

module.exports = ProductService;

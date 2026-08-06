const BaseService = require("./BaseService");
const ProductVariantRepository = require("../repositories/ProductVariantRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { ProductVariant } = require("../models");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");
const { sequelize } = require("../database");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class ProductVariantService extends BaseService {
  constructor() {
    super(new ProductVariantRepository());
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      const where = { isActive: true };
      if (query.productId) where.productId = query.productId;
      if (query.lowStock === "true" || query.lowStock === true) {
        where.quantity = { [Op.gt]: 0, [Op.lte]: sequelize.col("minQuantity") };
      }
      if (query.outOfStock === "true" || query.outOfStock === true) {
        where.quantity = 0;
      }
      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { name: { [LIKE]: term } },
          { sku: { [LIKE]: term } },
          { barcode: { [LIKE]: term } },
          { serialNumber: { [LIKE]: term } },
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
    }, MESSAGES.PRODUCT_VARIANT.RETRIEVED, "VARIANT_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const variant = await this.repository.findByIdWithBatches(id);
      if (!variant) {
        throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
      }
      return variant;
    }, MESSAGES.PRODUCT_VARIANT.RETRIEVED_ONE, "VARIANT_GET_ERROR");
  }

  async create(productId, data) {
    return this.executeOperation(async () => {
      // Check SKU uniqueness
      if (data.sku) {
        const existing = await this.repository.findBySku(data.sku);
        if (existing) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_SKU, "DUPLICATE_SKU", 400);
        }
      }
      // Check barcode uniqueness
      if (data.barcode) {
        const existingBarcode = await this.repository.findByBarcode(data.barcode);
        if (existingBarcode) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_BARCODE, "DUPLICATE_BARCODE", 400);
        }
      }
      // Check serial number uniqueness
      if (data.serialNumber) {
        const existingSerial = await this.repository.findBySerialNumber(data.serialNumber);
        if (existingSerial) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_SERIAL, "DUPLICATE_SERIAL", 400);
        }
      }

      return this.repository.create({ ...data, productId, quantity: 0 });
    }, MESSAGES.PRODUCT_VARIANT.CREATED, "VARIANT_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const variant = await this.repository.findById(id);

      // Check SKU uniqueness if changing
      if (data.sku && data.sku !== variant.sku) {
        const existing = await this.repository.findBySku(data.sku);
        if (existing) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_SKU, "DUPLICATE_SKU", 400);
        }
      }
      // Check barcode uniqueness if changing
      if (data.barcode && data.barcode !== variant.barcode) {
        const existingBarcode = await this.repository.findByBarcode(data.barcode);
        if (existingBarcode) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_BARCODE, "DUPLICATE_BARCODE", 400);
        }
      }
      // Check serial uniqueness if changing
      if (data.serialNumber && data.serialNumber !== variant.serialNumber) {
        const existingSerial = await this.repository.findBySerialNumber(data.serialNumber);
        if (existingSerial) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_SERIAL, "DUPLICATE_SERIAL", 400);
        }
      }

      // Never allow direct quantity update — only via stock movements
      delete data.quantity;
      delete data.costPrice;

      return variant.update(data);
    }, MESSAGES.PRODUCT_VARIANT.UPDATED, "VARIANT_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const variant = await this.repository.findById(id);
      if (variant.quantity > 0) {
        throw new CustomError(MESSAGES.PRODUCT_VARIANT.HAS_STOCK, "VARIANT_HAS_STOCK", 400);
      }
      return variant.update({ isActive: false });
    }, MESSAGES.PRODUCT_VARIANT.DELETED, "VARIANT_DELETE_ERROR");
  }

  async getByBarcode(barcode) {
    return this.executeOperation(async () => {
      const variant = await this.repository.findByBarcode(barcode);
      if (!variant) {
        throw new CustomError(MESSAGES.INVENTORY.BARCODE_NOT_FOUND, "BARCODE_NOT_FOUND", 404);
      }
      return variant;
    }, MESSAGES.INVENTORY.BARCODE_FOUND, "BARCODE_LOOKUP_ERROR");
  }

  async getBySku(sku) {
    return this.executeOperation(async () => {
      const variant = await this.repository.findBySku(sku);
      if (!variant) {
        throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
      }
      return variant;
    }, MESSAGES.PRODUCT_VARIANT.RETRIEVED_ONE, "SKU_LOOKUP_ERROR");
  }
}

module.exports = ProductVariantService;

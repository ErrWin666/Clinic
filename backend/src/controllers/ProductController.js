const BaseController = require("./BaseController");
const ProductService = require("../services/ProductService");
const ProductVariantService = require("../services/ProductVariantService");
const PackagingUnitService = require("../services/PackagingUnitService");
const MESSAGES = require("../constants/messages");

class ProductController extends BaseController {
  constructor() {
    super();
    this.productService = new ProductService();
    this.variantService = new ProductVariantService();
    this.packagingService = new PackagingUnitService();
  }

  // === Products ===

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.productService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.PRODUCT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const product = await this.productService.getById(id);
      return this.sendSuccess(res, product, MESSAGES.PRODUCT.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await this.productService.create(req.body);
      return this.sendSuccess(res, product, MESSAGES.PRODUCT.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const product = await this.productService.update(id, req.body);
      return this.sendSuccess(res, product, MESSAGES.PRODUCT.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.productService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.PRODUCT.DELETED);
    } catch (error) {
      next(error);
    }
  }

  // === Variants ===

  async listVariants(req, res, next) {
    try {
      const query = { ...req.query, productId: req.params.productId ? Number(req.params.productId) : undefined };
      const { rows, pagination } = await this.variantService.list(query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.PRODUCT_VARIANT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getVariantById(req, res, next) {
    try {
      const id = this.validateId(req.params.variantId);
      const variant = await this.variantService.getById(id);
      return this.sendSuccess(res, variant, MESSAGES.PRODUCT_VARIANT.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async createVariant(req, res, next) {
    try {
      const productId = this.validateId(req.params.productId);
      const variant = await this.variantService.create(productId, req.body);
      return this.sendSuccess(res, variant, MESSAGES.PRODUCT_VARIANT.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateVariant(req, res, next) {
    try {
      const variantId = this.validateId(req.params.variantId);
      const variant = await this.variantService.update(variantId, req.body);
      return this.sendSuccess(res, variant, MESSAGES.PRODUCT_VARIANT.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req, res, next) {
    try {
      const variantId = this.validateId(req.params.variantId);
      await this.variantService.delete(variantId);
      return this.sendSuccess(res, null, MESSAGES.PRODUCT_VARIANT.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async getByBarcode(req, res, next) {
    try {
      // Search packaging_units first (multi-unit barcode), fall back to variant barcode
      const result = await this.packagingService.findByBarcode(req.params.barcode);
      return this.sendSuccess(res, result, MESSAGES.INVENTORY.BARCODE_FOUND);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;

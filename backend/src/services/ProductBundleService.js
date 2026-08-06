const BaseService = require("./BaseService");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { ProductBundle, ProductBundleItem, Product, ProductVariant } = require("../models");
const { sequelize } = require("../database");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");

class ProductBundleService extends BaseService {
  constructor() {
    super();
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      const where = {};
      if (query.productId) where.productId = query.productId;

      const include = [
        { association: "product", attributes: ["id", "displayId", "name", "category"] },
        { association: "items", include: [{ association: "variant", attributes: ["id", "name", "sku", "sellPrice"] }] },
      ];

      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { "$product.name$": { [LIKE]: term } },
          { "$product.displayId$": { [LIKE]: term } },
        ];
      }

      const { rows, count } = await ProductBundle.findAndCountAll({
        where,
        include,
        offset,
        limit,
        distinct: true,
        order: [["createdAt", "DESC"]],
      });

      return {
        rows,
        pagination: buildPaginationResponse(count, page, pageSize),
      };
    }, MESSAGES.PRODUCT_BUNDLE.RETRIEVED, "BUNDLE_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const bundle = await ProductBundle.findByPk(id, {
        include: [
          { association: "product", attributes: ["id", "displayId", "name", "category", "description"] },
          { association: "items", include: [{ association: "variant", attributes: ["id", "name", "sku", "sellPrice", "quantity"] }] },
        ],
      });
      if (!bundle) {
        throw new CustomError(MESSAGES.PRODUCT_BUNDLE.NOT_FOUND, "BUNDLE_NOT_FOUND", 404);
      }
      return bundle;
    }, MESSAGES.PRODUCT_BUNDLE.RETRIEVED, "BUNDLE_GET_ERROR");
  }

  async create(data) {
    return this.executeOperation(async () => {
      // Verify product exists and is a bundle-type product
      const product = await Product.findByPk(data.productId);
      if (!product) {
        throw new CustomError(MESSAGES.PRODUCT.NOT_FOUND, "PRODUCT_NOT_FOUND", 404);
      }

      // Verify all variants exist
      for (const item of data.items) {
        const variant = await ProductVariant.findByPk(item.productVariantId);
        if (!variant) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
        }
      }

      const transaction = await sequelize.transaction();
      try {
        const bundle = await ProductBundle.create(
          {
            productId: data.productId,
            description: data.description || null,
          },
          { transaction }
        );

        const items = await Promise.all(
          data.items.map((item) =>
            ProductBundleItem.create(
              {
                bundleId: bundle.id,
                productVariantId: item.productVariantId,
                quantity: item.quantity,
              },
              { transaction }
            )
          )
        );

        await transaction.commit();
        return this.getById(bundle.id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.PRODUCT_BUNDLE.CREATED, "BUNDLE_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const bundle = await ProductBundle.findByPk(id);
      if (!bundle) {
        throw new CustomError(MESSAGES.PRODUCT_BUNDLE.NOT_FOUND, "BUNDLE_NOT_FOUND", 404);
      }

      const transaction = await sequelize.transaction();
      try {
        if (data.description !== undefined) {
          await bundle.update({ description: data.description }, { transaction });
        }

        if (data.items) {
          // Verify all variants exist
          for (const item of data.items) {
            const variant = await ProductVariant.findByPk(item.productVariantId);
            if (!variant) {
              throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
            }
          }

          // Replace items
          await ProductBundleItem.destroy({
            where: { bundleId: id },
            transaction,
          });
          await Promise.all(
            data.items.map((item) =>
              ProductBundleItem.create(
                {
                  bundleId: id,
                  productVariantId: item.productVariantId,
                  quantity: item.quantity,
                },
                { transaction }
              )
            )
          );
        }

        await transaction.commit();
        return this.getById(id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.PRODUCT_BUNDLE.UPDATED, "BUNDLE_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const bundle = await ProductBundle.findByPk(id);
      if (!bundle) {
        throw new CustomError(MESSAGES.PRODUCT_BUNDLE.NOT_FOUND, "BUNDLE_NOT_FOUND", 404);
      }
      // Soft delete (paranoid) — items will be cascade-soft-deleted via hook
      await bundle.destroy();
      return true;
    }, MESSAGES.PRODUCT_BUNDLE.DELETED, "BUNDLE_DELETE_ERROR");
  }

  /**
   * Expand a bundle into individual invoice line items.
   * Each bundle item becomes a separate invoice item with the variant's sellPrice.
   * @param {number} bundleId
   * @param {number} quantity - how many bundles to expand
   * @returns {Promise<Array>} array of invoice item objects
   */
  async expandBundle(bundleId, quantity = 1) {
    const bundle = await this.getById(bundleId);
    if (!bundle) {
      throw new CustomError(MESSAGES.PRODUCT_BUNDLE.NOT_FOUND, "BUNDLE_NOT_FOUND", 404);
    }

    // Validate stock availability for each component before expanding
    for (const item of bundle.items) {
      const variant = item.variant;
      if (!variant) continue;
      const requiredQty = item.quantity * quantity;
      if (Number(variant.quantity) < requiredQty) {
        throw new CustomError(
          MESSAGES.STOCK_MOVEMENT.INSUFFICIENT_STOCK,
          "INSUFFICIENT_STOCK",
          400
        );
      }
    }

    const items = [];
    for (const item of bundle.items) {
      const variant = item.variant;
      if (!variant) continue;

      items.push({
        description: `${bundle.product.name} - ${variant.name}`,
        quantity: item.quantity * quantity,
        unitPrice: Number(variant.sellPrice),
        productVariantId: variant.id,
      });
    }
    return items;
  }
}

module.exports = ProductBundleService;

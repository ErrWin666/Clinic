const BaseRepository = require("./BaseRepository");
const { PackagingUnit, ProductVariant, Product } = require("../models");
const { Op } = require("sequelize");

class PackagingUnitRepository extends BaseRepository {
  constructor() {
    super(PackagingUnit);
  }

  async listByVariant(variantId) {
    return this.model.findAll({
      where: { productVariantId: variantId, isActive: true },
      order: [["factor", "ASC"]],
    });
  }

  async findByVariantAndName(variantId, name) {
    return this.model.findOne({
      where: { productVariantId: variantId, name, isActive: true },
    });
  }

  async findByBarcode(barcode) {
    return this.model.findOne({
      where: { barcode, isActive: true },
      include: [
        {
          model: ProductVariant,
          as: "variant",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });
  }

  async findBaseUnit(variantId) {
    return this.model.findOne({
      where: { productVariantId: variantId, isBaseUnit: true, isActive: true },
    });
  }

  async findByBarcodeWithVariant(barcode) {
    return this.findByBarcode(barcode);
  }

  async findDuplicateBarcode(barcode, excludeId = null) {
    const where = { barcode, isActive: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return this.model.findOne({ where });
  }

  async findDuplicateName(variantId, name, excludeId = null) {
    const where = { productVariantId: variantId, name, isActive: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return this.model.findOne({ where });
  }
}

module.exports = PackagingUnitRepository;

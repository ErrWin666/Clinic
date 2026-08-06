const BaseService = require("./BaseService");
const PackagingUnitRepository = require("../repositories/PackagingUnitRepository");
const ProductVariantRepository = require("../repositories/ProductVariantRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");

class PackagingUnitService extends BaseService {
  constructor() {
    super(new PackagingUnitRepository());
    this._variantRepository = new ProductVariantRepository();
  }

  async listByVariant(variantId) {
    return this.executeOperation(async () => {
      return this.repository.listByVariant(variantId);
    }, MESSAGES.PACKAGING_UNIT.RETRIEVED, "PACKAGING_LIST_ERROR");
  }

  async create(variantId, data) {
    return this.executeOperation(async () => {
      // Verify variant exists
      const variant = await this._variantRepository.findById(variantId);
      if (!variant) {
        throw new CustomError(MESSAGES.PRODUCT_VARIANT.NOT_FOUND, "VARIANT_NOT_FOUND", 404);
      }

      // Check name uniqueness within variant
      const existing = await this.repository.findDuplicateName(variantId, data.name);
      if (existing) {
        throw new CustomError(MESSAGES.PACKAGING_UNIT.DUPLICATE_NAME, "DUPLICATE_PACKAGING_NAME", 400);
      }

      // Check barcode uniqueness
      if (data.barcode) {
        const existingBarcode = await this.repository.findDuplicateBarcode(data.barcode);
        if (existingBarcode) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_BARCODE, "DUPLICATE_BARCODE", 400);
        }
      }

      // If isBaseUnit, ensure only one base unit per variant
      if (data.isBaseUnit) {
        const existingBase = await this.repository.findBaseUnit(variantId);
        if (existingBase) {
          throw new CustomError(MESSAGES.PACKAGING_UNIT.BASE_UNIT_EXISTS, "BASE_UNIT_EXISTS", 400);
        }
      }

      return this.repository.create({ ...data, productVariantId: variantId });
    }, MESSAGES.PACKAGING_UNIT.CREATED, "PACKAGING_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const unit = await this.repository.findById(id);

      // Check name uniqueness if changing
      if (data.name && data.name !== unit.name) {
        const existing = await this.repository.findDuplicateName(unit.productVariantId, data.name, id);
        if (existing) {
          throw new CustomError(MESSAGES.PACKAGING_UNIT.DUPLICATE_NAME, "DUPLICATE_PACKAGING_NAME", 400);
        }
      }

      // Check barcode uniqueness if changing
      if (data.barcode && data.barcode !== unit.barcode) {
        const existingBarcode = await this.repository.findDuplicateBarcode(data.barcode, id);
        if (existingBarcode) {
          throw new CustomError(MESSAGES.PRODUCT_VARIANT.DUPLICATE_BARCODE, "DUPLICATE_BARCODE", 400);
        }
      }

      return unit.update(data);
    }, MESSAGES.PACKAGING_UNIT.UPDATED, "PACKAGING_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const unit = await this.repository.findById(id);
      if (unit.isBaseUnit) {
        throw new CustomError(MESSAGES.PACKAGING_UNIT.CANNOT_DELETE_BASE, "CANNOT_DELETE_BASE", 400);
      }
      return unit.update({ isActive: false });
    }, MESSAGES.PACKAGING_UNIT.DELETED, "PACKAGING_DELETE_ERROR");
  }

  /**
   * Convert a quantity in a given unit to base units (pieces).
   * e.g. 10 carton × 24 = 240 pieces
   */
  async convertToBase(variantId, unitName, quantity) {
    const unit = await this.repository.findByVariantAndName(variantId, unitName);
    if (!unit) {
      // Fallback: assume factor 1 if unit not found (legacy)
      return quantity;
    }
    return quantity * unit.factor;
  }

  /**
   * Compute the sell price for a given unit.
   * If unit has its own sellPrice, use it; otherwise compute factor × variant.sellPrice.
   */
  async getSellPrice(variantId, unitName) {
    const unit = await this.repository.findByVariantAndName(variantId, unitName);
    if (unit && unit.sellPrice != null) {
      return Number(unit.sellPrice);
    }
    const variant = await this._variantRepository.findById(variantId);
    const factor = unit ? unit.factor : 1;
    return Number(variant.sellPrice) * factor;
  }

  /**
   * Lookup by barcode: search packaging_units first, fall back to product_variants.barcode.
   * Returns { variant, unit } where unit may be null for legacy barcode.
   */
  async findByBarcode(barcode) {
    return this.executeOperation(async () => {
      // 1. Search packaging_units.barcode
      const pkgUnit = await this.repository.findByBarcode(barcode);
      if (pkgUnit) {
        return {
          variant: pkgUnit.variant,
          unit: pkgUnit,
          factor: pkgUnit.factor,
        };
      }

      // 2. Fall back to product_variants.barcode (legacy)
      const variant = await this._variantRepository.findByBarcode(barcode);
      if (!variant) {
        throw new CustomError(MESSAGES.INVENTORY.BARCODE_NOT_FOUND, "BARCODE_NOT_FOUND", 404);
      }
      return { variant, unit: null, factor: 1 };
    }, MESSAGES.INVENTORY.BARCODE_FOUND, "BARCODE_LOOKUP_ERROR");
  }
}

module.exports = PackagingUnitService;

const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const { createTestProduct, createTestProductVariant, createTestPackagingUnit } = require("../../helpers/factories");
const PackagingUnitService = require("../../../src/services/PackagingUnitService");
const CustomError = require("../../../src/utils/CustomError");

describe("PackagingUnitService", () => {
  let service;
  let testProduct;
  let testVariant;

  beforeAll(async () => {
    await setupTestDB();
    service = new PackagingUnitService();
    testProduct = await createTestProduct();
    testVariant = await createTestProductVariant(testProduct.id);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a packaging unit with valid data", async () => {
      const unit = await service.create(testVariant.id, {
        name: "Box of 10",
        shortName: "BX10",
        factor: 10,
        barcode: "PKG-BC-001",
      });
      expect(unit).toBeDefined();
      expect(unit.productVariantId).toBe(testVariant.id);
      expect(unit.factor).toBe(10);
    });

    it("should reject duplicate name within same variant", async () => {
      await service.create(testVariant.id, { name: "Carton", shortName: "CTN", factor: 24 });
      await expect(
        service.create(testVariant.id, { name: "Carton", shortName: "CT2", factor: 12 })
      ).rejects.toThrow();
    });

    it("should reject duplicate barcode", async () => {
      await service.create(testVariant.id, { name: "Box A", shortName: "BA", factor: 5, barcode: "DUP-BC" });
      await expect(
        service.create(testVariant.id, { name: "Box B", shortName: "BB", factor: 10, barcode: "DUP-BC" })
      ).rejects.toThrow();
    });

    it("should reject non-existent variant", async () => {
      await expect(
        service.create(99999, { name: "Box", factor: 1 })
      ).rejects.toThrow();
    });

    it("should reject when variant findById returns null", async () => {
      jest.spyOn(service._variantRepository, "findById").mockResolvedValueOnce(null);
      await expect(
        service.create(1, { name: "Box", factor: 1 })
      ).rejects.toThrow();
    });

    it("should reject second base unit for same variant", async () => {
      await service.create(testVariant.id, { name: "BaseUnit1", shortName: "BU1", factor: 1, isBaseUnit: true });
      await expect(
        service.create(testVariant.id, { name: "BaseUnit2", shortName: "BU2", factor: 1, isBaseUnit: true })
      ).rejects.toThrow();
    });
  });

  describe("listByVariant", () => {
    it("should list packaging units for a variant", async () => {
      await createTestPackagingUnit(testVariant.id, { name: "List Unit" });
      const units = await service.listByVariant(testVariant.id);
      expect(units.length).toBeGreaterThan(0);
    });
  });

  describe("update", () => {
    it("should update packaging unit fields", async () => {
      const unit = await createTestPackagingUnit(testVariant.id, { name: "UpdateMe", factor: 5 });
      const updated = await service.update(unit.id, { factor: 15 });
      expect(updated.factor).toBe(15);
    });

    it("should reject duplicate name on update", async () => {
      await service.create(testVariant.id, { name: "ExistingName", shortName: "EN", factor: 5 });
      const unit = await service.create(testVariant.id, { name: "OriginalName", shortName: "ON", factor: 10 });
      await expect(service.update(unit.id, { name: "ExistingName" })).rejects.toThrow();
    });

    it("should reject duplicate barcode on update", async () => {
      await service.create(testVariant.id, { name: "HasBarcode", shortName: "HB", factor: 5, barcode: "UPDATEBC1" });
      const unit = await service.create(testVariant.id, { name: "OtherUnit", shortName: "OU", factor: 10, barcode: "UPDATEBC2" });
      await expect(service.update(unit.id, { barcode: "UPDATEBC1" })).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should soft delete a non-base packaging unit", async () => {
      const unit = await createTestPackagingUnit(testVariant.id, { name: "DeleteMe", factor: 3 });
      const result = await service.delete(unit.id);
      expect(result.isActive).toBe(false);
    });

    it("should reject deletion of base unit", async () => {
      const unit = await createTestPackagingUnit(testVariant.id, { name: "BaseToDelete", factor: 1, isBaseUnit: true });
      await expect(service.delete(unit.id)).rejects.toThrow();
    });
  });

  describe("convertToBase", () => {
    it("should convert quantity to base units using factor", async () => {
      await service.create(testVariant.id, { name: "Dozen", shortName: "DZN", factor: 12 });
      const baseQty = await service.convertToBase(testVariant.id, "Dozen", 5);
      expect(baseQty).toBe(60);
    });

    it("should return quantity as-is for unknown unit", async () => {
      const baseQty = await service.convertToBase(testVariant.id, "Unknown", 10);
      expect(baseQty).toBe(10);
    });
  });

  describe("getSellPrice", () => {
    it("should compute sell price from variant when unit has no own price", async () => {
      await service.create(testVariant.id, { name: "Triple", shortName: "TRI", factor: 3 });
      const price = await service.getSellPrice(testVariant.id, "Triple");
      expect(price).toBe(300); // 100 * 3
    });

    it("should return unit sellPrice when set", async () => {
      await service.create(testVariant.id, { name: "Special", shortName: "SPC", factor: 2, sellPrice: 250 });
      const price = await service.getSellPrice(testVariant.id, "Special");
      expect(price).toBe(250);
    });
  });

  describe("findByBarcode", () => {
    it("should find variant by packaging unit barcode", async () => {
      await service.create(testVariant.id, { name: "BCUnit", shortName: "BCU", factor: 6, barcode: "PKGLOOKUP" });
      const result = await service.findByBarcode("PKGLOOKUP");
      expect(result.variant).toBeDefined();
      expect(result.unit).toBeDefined();
      expect(result.factor).toBe(6);
    });

    it("should fall back to variant barcode when not in packaging units", async () => {
      const result = await service.findByBarcode(testVariant.barcode);
      expect(result.variant).toBeDefined();
      expect(result.unit).toBeNull();
      expect(result.factor).toBe(1);
    });

    it("should throw 404 for unknown barcode", async () => {
      await expect(service.findByBarcode("UNKNOWNBC")).rejects.toThrow();
      try {
        await service.findByBarcode("UNKNOWNBC");
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });
});

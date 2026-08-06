const { setupTestDB, teardownTestDB } = require("../../helpers/setup");
const {
  createTestProduct,
  createTestProductVariant,
  createTestExamConsumableRule,
} = require("../../helpers/factories");
const ExamConsumableRuleService = require("../../../src/services/ExamConsumableRuleService");
const CustomError = require("../../../src/utils/CustomError");

describe("ExamConsumableRuleService", () => {
  let service;
  let testVariant;
  let testProduct;

  beforeAll(async () => {
    await setupTestDB();
    service = new ExamConsumableRuleService();
    testProduct = await createTestProduct();
    testVariant = await createTestProductVariant(testProduct.id);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create a consumable rule with valid data", async () => {
      const rule = await service.create({
        examType: "checkup",
        productVariantId: testVariant.id,
        quantity: 2,
      });
      expect(rule).toBeDefined();
      expect(rule.examType).toBe("checkup");
      expect(rule.productVariantId).toBe(testVariant.id);
      expect(rule.quantity).toBe(2);
      expect(rule.isActive).toBe(true);
    });

    it("should default quantity to 1 when not provided", async () => {
      const rule = await service.create({
        examType: "follow-up",
        productVariantId: testVariant.id,
      });
      expect(rule.quantity).toBe(1);
    });

    it("should reject duplicate rule (same examType + variant)", async () => {
      await createTestExamConsumableRule({
        examType: "dilation",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      await expect(
        service.create({
          examType: "dilation",
          productVariantId: testVariant.id,
          quantity: 1,
        })
      ).rejects.toThrow("Consumable rule already exists");
    });

    it("should reject non-existent product variant", async () => {
      await expect(
        service.create({
          examType: "checkup",
          productVariantId: 99999,
          quantity: 1,
        })
      ).rejects.toThrow();
    });

    it("should create with isActive=false when specified", async () => {
      const rule = await service.create({
        examType: "inactive-checkup",
        productVariantId: testVariant.id,
        quantity: 1,
        isActive: false,
      });
      expect(rule.isActive).toBe(false);
    });
  });

  describe("getById", () => {
    it("should return rule by id", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "surgery",
        productVariantId: testVariant.id,
        quantity: 3,
      });
      const found = await service.getById(rule.id);
      expect(found.id).toBe(rule.id);
      expect(found.examType).toBe("surgery");
    });

    it("should throw 404 for non-existent rule", async () => {
      await expect(service.getById(99999)).rejects.toThrow();
      try {
        await service.getById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });
  });

  describe("list", () => {
    it("should return all rules", async () => {
      const result = await service.list({});
      expect(result.rows).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should filter by examType", async () => {
      const result = await service.list({ examType: "checkup" });
      expect(result.rows.every((r) => r.examType === "checkup")).toBe(true);
    });

    it("should filter by productVariantId", async () => {
      const result = await service.list({ productVariantId: testVariant.id });
      expect(result.rows.every((r) => r.productVariantId === testVariant.id)).toBe(true);
    });

    it("should filter by isActive string 'true'", async () => {
      const result = await service.list({ isActive: "true" });
      expect(result.rows.every((r) => r.isActive === true)).toBe(true);
    });

    it("should filter by isActive string 'false'", async () => {
      const result = await service.list({ isActive: "false" });
      expect(result.rows.every((r) => r.isActive === false)).toBe(true);
    });
  });

  describe("update", () => {
    it("should update quantity", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "laser",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      const updated = await service.update(rule.id, { quantity: 5 });
      expect(updated.quantity).toBe(5);
    });

    it("should update isActive", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "retinal",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      const updated = await service.update(rule.id, { isActive: false });
      expect(updated.isActive).toBe(false);
    });

    it("should throw 404 for non-existent rule", async () => {
      await expect(service.update(99999, { quantity: 5 })).rejects.toThrow();
    });

    it("should reject update with non-existent product variant", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "corneal",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      await expect(
        service.update(rule.id, { productVariantId: 99999 })
      ).rejects.toThrow();
    });

    it("should update examType", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "glaucoma",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      const updated = await service.update(rule.id, { examType: "updated-type" });
      expect(updated.examType).toBe("updated-type");
    });

    it("should update productVariantId to a valid variant", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "cataract",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      const newVariant = await createTestProductVariant(testProduct.id, {
        name: "New Variant",
        sku: "NEW-VAR-ECS-001",
      });
      const updated = await service.update(rule.id, { productVariantId: newVariant.id });
      expect(updated.productVariantId).toBe(newVariant.id);
    });
  });

  describe("delete", () => {
    it("should soft delete a rule", async () => {
      const rule = await createTestExamConsumableRule({
        examType: "oct",
        productVariantId: testVariant.id,
        quantity: 1,
      });
      const result = await service.delete(rule.id);
      expect(result).toBe(true);
      await expect(service.getById(rule.id)).rejects.toThrow();
    });

    it("should throw 404 for non-existent rule", async () => {
      await expect(service.delete(99999)).rejects.toThrow();
    });
  });

  describe("getRulesForExamType", () => {
    it("should return active rules for a given exam type", async () => {
      await createTestExamConsumableRule({
        examType: "visual-field",
        productVariantId: testVariant.id,
        quantity: 2,
      });
      const rules = await service.getRulesForExamType("visual-field");
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.examType === "visual-field")).toBe(true);
      expect(rules.every((r) => r.isActive === true)).toBe(true);
    });

    it("should return empty array for exam type with no rules", async () => {
      const rules = await service.getRulesForExamType("nonexistent-type");
      expect(rules).toEqual([]);
    });
  });
});

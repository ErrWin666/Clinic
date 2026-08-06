const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { ProductVariant } = require("../../src/models");

describe("Exam Consumables Integration", () => {
  let agent;
  let testPatientId;
  let testProductId;
  let testVariantId;
  let testRuleId;
  let testExamId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    // Create patient
    const patientRes = await agent
      .post("/api/patients")
      .send({
        fullName: "Exam Consumables Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "1112223333",
      })
      .expect(201);
    testPatientId = patientRes.body.data.id;

    // Create product + variant
    const productRes = await agent
      .post("/api/products")
      .send({ name: "Eye Drops", category: "drops", costingMethod: "fifo" })
      .expect(201);
    testProductId = productRes.body.data.id;

    const variantRes = await agent
      .post(`/api/products/${testProductId}/variants`)
      .send({
        name: "Dilation Drops 5ml",
        sku: "EXAM-DROP-001",
        sellPrice: 15.0,
        minQuantity: 5,
      })
      .expect(201);
    testVariantId = variantRes.body.data.id;

    // Add opening stock (50 units)
    await agent
      .post("/api/stock/opening-stock")
      .send({
        productVariantId: testVariantId,
        quantity: 50,
        unitCost: 5.0,
        batchNumber: "EXAM-BATCH-001",
        expiryDate: "2028-12-31",
      })
      .expect(201);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  // ===== ExamConsumableRule CRUD =====

  describe("POST /api/exam-consumables", () => {
    it("should create a consumable rule", async () => {
      const res = await agent
        .post("/api/exam-consumables")
        .send({
          examType: "dilation",
          productVariantId: testVariantId,
          quantity: 2,
        })
        .expect(201);

      expect(res.body.data.examType).toBe("dilation");
      expect(res.body.data.quantity).toBe(2);
      testRuleId = res.body.data.id;
    });

    it("should reject duplicate rule (same examType + variant)", async () => {
      await agent
        .post("/api/exam-consumables")
        .send({
          examType: "dilation",
          productVariantId: testVariantId,
          quantity: 1,
        })
        .expect(400);
    });

    it("should reject non-existent variant", async () => {
      await agent
        .post("/api/exam-consumables")
        .send({
          examType: "test",
          productVariantId: 99999,
          quantity: 1,
        })
        .expect(404);
    });
  });

  describe("GET /api/exam-consumables", () => {
    it("should list rules", async () => {
      const res = await agent.get("/api/exam-consumables").expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter by examType", async () => {
      const res = await agent.get("/api/exam-consumables?examType=dilation").expect(200);
      expect(res.body.data.every((r) => r.examType === "dilation")).toBe(true);
    });
  });

  describe("PUT /api/exam-consumables/:id", () => {
    it("should update rule", async () => {
      const res = await agent
        .put(`/api/exam-consumables/${testRuleId}`)
        .send({ quantity: 3 })
        .expect(200);
      expect(res.body.data.quantity).toBe(3);
    });
  });

  // ===== Exam + Stock Integration =====

  describe("Exam with consumables — stock deduction on complete", () => {
    it("should create exam with examType", async () => {
      const res = await agent
        .post(`/api/patients/${testPatientId}/examinations`)
        .send({
          examDate: "2026-08-02",
          examType: "dilation",
        })
        .expect(201);

      testExamId = res.body.data.id;
      expect(res.body.data.examType).toBe("dilation");
      expect(res.body.data.examStatus).toBe("pending");
    });

    it("should NOT deduct stock while exam is pending", async () => {
      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(50); // unchanged
    });

    it("should deduct stock when exam is marked as completed", async () => {
      await agent
        .put(`/api/examinations/${testExamId}`)
        .send({ examStatus: "completed" })
        .expect(200);

      const variant = await ProductVariant.findByPk(testVariantId);
      // Rule: dilation → 3 units (updated in PUT test)
      expect(variant.quantity).toBe(47); // 50 - 3
    });

    it("should return stock when completed exam is cancelled", async () => {
      await agent
        .put(`/api/examinations/${testExamId}`)
        .send({ examStatus: "cancelled" })
        .expect(200);

      const variant = await ProductVariant.findByPk(testVariantId);
      expect(variant.quantity).toBe(50); // back to 50
    });
  });

  describe("Stock movements linked to exam", () => {
    it("should create stock movements with referenceType=EyeExamination", async () => {
      // Create + complete an exam
      const examRes = await agent
        .post(`/api/patients/${testPatientId}/examinations`)
        .send({ examDate: "2026-08-02", examType: "dilation" })
        .expect(201);

      await agent
        .put(`/api/examinations/${examRes.body.data.id}`)
        .send({ examStatus: "completed" })
        .expect(200);

      const movementsRes = await agent
        .get(`/api/stock/movements?referenceType=EyeExamination&referenceId=${examRes.body.data.id}`)
        .expect(200);

      expect(movementsRes.body.data.length).toBeGreaterThan(0);
      expect(movementsRes.body.data[0].referenceType).toBe("EyeExamination");
      expect(movementsRes.body.data[0].reason).toBe("dispensing");
    });
  });

  // ===== Delete Rule =====

  describe("DELETE /api/exam-consumables/:id", () => {
    it("should delete rule (soft delete)", async () => {
      await agent.delete(`/api/exam-consumables/${testRuleId}`).expect(200);
      await agent.get(`/api/exam-consumables/${testRuleId}`).expect(404);
    });
  });

  // ===== RBAC =====

  describe("RBAC", () => {
    it("should require authentication", async () => {
      await request(app).get("/api/exam-consumables").expect(401);
    });
  });
});

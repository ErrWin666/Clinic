const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Invoice & Examination API Integration", () => {
  let agent;
  let testPatientId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    const patientRes = await agent
      .post("/api/patients")
      .send({
        fullName: "Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "1112223333",
      });
    testPatientId = patientRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("POST /api/invoices", () => {
    it("should create invoice with items", async () => {
      const res = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-07-23",
          items: [
            { description: "Eye exam", quantity: 1, unitPrice: 50.0 },
            { description: "Lens", quantity: 2, unitPrice: 30.0 },
          ],
          taxAmount: 5.0,
          discountAmount: 10.0,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAmount).toBe(105.0);
      expect(res.body.data.items.length).toBe(2);
    });
  });

  describe("GET /api/invoices/:id", () => {
    it("should return invoice with items", async () => {
      const createRes = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-07-24",
          items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
        });
      const id = createRes.body.data.id;
      const res = await agent.get(`/api/invoices/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
    });
  });

  describe("GET /api/invoices — search & filters", () => {
    it("should search by displayId", async () => {
      const res = await agent.get("/api/invoices?search=INV");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should search by patient name", async () => {
      const res = await agent.get("/api/invoices?search=Test");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should filter by amount range", async () => {
      const res = await agent.get("/api/invoices?minAmount=50&maxAmount=200");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const invoice of res.body.data) {
        expect(invoice.totalAmount).toBeGreaterThanOrEqual(50);
        expect(invoice.totalAmount).toBeLessThanOrEqual(200);
      }
    });
  });

  describe("PATCH /api/invoices/:id/status", () => {
    it("should mark invoice as paid", async () => {
      const createRes = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-07-25",
          items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
        });
      const id = createRes.body.data.id;
      const res = await agent
        .patch(`/api/invoices/${id}/status`)
        .send({ status: "paid" });
      expect(res.status).toBe(200);
      expect(res.body.data.invoiceStatus).toBe("paid");
    });

    it("should not delete paid invoice", async () => {
      const createRes = await agent
        .post("/api/invoices")
        .send({
          patientId: testPatientId,
          invoiceDate: "2026-07-26",
          items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
        });
      const id = createRes.body.data.id;
      await agent.patch(`/api/invoices/${id}/status`).send({ status: "paid" });
      const res = await agent.delete(`/api/invoices/${id}`);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/patients/:patientId/examinations", () => {
    it("should create examination for patient", async () => {
      const res = await agent
        .post(`/api/patients/${testPatientId}/examinations`)
        .send({
          examDate: "2026-07-23",
          rightEyeWithoutCorrection: "20/20",
          leftEyeWithoutCorrection: "20/40",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayId).toBe("EX-0001");
    });
  });

  describe("GET /api/examinations/:id", () => {
    it("should return examination by id", async () => {
      const createRes = await agent
        .post(`/api/patients/${testPatientId}/examinations`)
        .send({
          examDate: "2026-07-24",
          rightEyeWithCorrection: "20/15",
        });
      const id = createRes.body.data.id;
      const res = await agent.get(`/api/examinations/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.rightEyeWithCorrection).toBe("20/15");
    });
  });

  describe("POST /api/examinations/:id/follow-up", () => {
    it("should create follow-up examination", async () => {
      const createRes = await agent
        .post(`/api/patients/${testPatientId}/examinations`)
        .send({
          examDate: "2026-07-25",
          rightEyeWithoutCorrection: "20/30",
          followUpInstructions: "Check in 1 month",
        });
      const id = createRes.body.data.id;
      const res = await agent.post(`/api/examinations/${id}/follow-up`);
      expect(res.status).toBe(201);
      expect(res.body.data.rightEyeWithoutCorrection).toBe("20/30");
    });
  });

  describe("GET /api/reports/patients", () => {
    it("should export patients CSV", async () => {
      const res = await agent.get("/api/reports/patients");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("DisplayID");
    });
  });

  describe("GET /api/reports/invoices", () => {
    it("should export invoices CSV", async () => {
      const res = await agent.get("/api/reports/invoices");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });
  });

  describe("GET /api/reports/appointments", () => {
    it("should export appointments CSV", async () => {
      const res = await agent.get("/api/reports/appointments");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });
  });

  describe("GET /api/dashboard/stats", () => {
    it("should return dashboard stats", async () => {
      const res = await agent.get("/api/dashboard/stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPatients).toBeGreaterThan(0);
    });
  });
});

const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("E2E: Full Flow Tests", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Patient Lifecycle", () => {
    let patientId, appointmentId, invoiceId;

    it("should create a patient", async () => {
      const res = await agent.post("/api/patients").send({
        fullName: "E2E Test Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5551112222",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      patientId = res.body.data.id;
    });

    it("should retrieve the patient by id", async () => {
      const res = await agent.get(`/api/patients/${patientId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe("E2E Test Patient");
    });

    it("should update the patient", async () => {
      const res = await agent.put(`/api/patients/${patientId}`).send({
        address: "123 Updated St",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.address).toBe("123 Updated St");
    });

    it("should create an appointment for the patient", async () => {
      const res = await agent.post("/api/appointments").send({
        patientId,
        appointmentDate: "2026-12-01",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
      });
      expect(res.status).toBe(201);
      appointmentId = res.body.data.id;
    });

    it("should list appointments", async () => {
      const res = await agent.get("/api/appointments");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should change appointment status", async () => {
      const res = await agent.patch(`/api/appointments/${appointmentId}/status`).send({
        status: "completed",
      });
      expect(res.status).toBe(200);
    });

    it("should create an invoice for the patient", async () => {
      const res = await agent.post("/api/invoices").send({
        patientId,
        invoiceDate: "2026-01-15",
        items: [{ description: "Consultation", quantity: 1, unitPrice: 100 }],
      });
      expect(res.status).toBe(201);
      invoiceId = res.body.data.id;
    });

    it("should pay the invoice", async () => {
      const res = await agent.patch(`/api/invoices/${invoiceId}/status`).send({
        status: "paid",
      });
      expect(res.status).toBe(200);
    });

    it("should list invoices", async () => {
      const res = await agent.get("/api/invoices");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should delete the patient", async () => {
      const res = await agent.delete(`/api/patients/${patientId}`);
      expect(res.status).toBe(200);
    });
  });

  describe("Settings Flow", () => {
    it("should get settings", async () => {
      const res = await agent.get("/api/settings");
      expect(res.status).toBe(200);
    });

    it("should update settings", async () => {
      const res = await agent.put("/api/settings").send({
        settings: [{ key: "clinic.name", value: '"E2E Clinic"', category: "clinic" }],
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Dashboard & System", () => {
    it("should get dashboard stats", async () => {
      const res = await agent.get("/api/dashboard/stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should get system info", async () => {
      const res = await agent.get("/api/system/disk-space");
      expect(res.status).toBe(200);
    });

    it("should get audit logs", async () => {
      const res = await agent.get("/api/audit-logs");
      expect(res.status).toBe(200);
    });
  });

  describe("Notification Flow", () => {
    it("should list notifications", async () => {
      const res = await agent.get("/api/notifications");
      expect(res.status).toBe(200);
    });

    it("should mark all notifications as read", async () => {
      const res = await agent.patch("/api/notifications/read-all");
      expect(res.status).toBe(200);
    });
  });

  describe("Report Export", () => {
    it("should export patients as CSV", async () => {
      const res = await agent.get("/api/reports/patients");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });

    it("should export invoices as CSV", async () => {
      const res = await agent.get("/api/reports/invoices");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });

    it("should export appointments as CSV", async () => {
      const res = await agent.get("/api/reports/appointments");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
    });
  });

  describe("Auth Flow", () => {
    it("should get session status", async () => {
      const res = await agent.get("/api/auth/session-status");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("should refresh token", async () => {
      const res = await agent.post("/api/auth/refresh-token");
      expect(res.status).toBe(200);
    });

    it("should logout", async () => {
      const res = await agent.post("/api/auth/logout");
      expect(res.status).toBe(200);
    });
  });
});

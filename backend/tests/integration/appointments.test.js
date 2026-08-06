const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Appointment API Integration", () => {
  let agent;
  let testPatientId;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    const patientRes = await agent
      .post("/api/patients")
      .send({
        fullName: "Apt Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "1112223333",
      });
    testPatientId = patientRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("POST /api/appointments", () => {
    it("should create an appointment", async () => {
      const res = await agent
        .post("/api/appointments")
        .send({
          appointmentDate: "2026-09-01",
          startTime: "10:00",
          endTime: "11:00",
          appointmentType: "checkup",
          patientId: testPatientId,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayId).toBe("APT-0001");
    });

    it("should detect conflict", async () => {
      const res = await agent
        .post("/api/appointments")
        .send({
          appointmentDate: "2026-09-01",
          startTime: "10:30",
          endTime: "11:30",
          appointmentType: "checkup",
          patientId: testPatientId,
        });
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/appointments/calendar", () => {
    it("should return calendar appointments", async () => {
      const res = await agent.get(
        "/api/appointments/calendar?startDate=2026-09-01&endDate=2026-09-30"
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/appointments/:id/status", () => {
    it("should change status", async () => {
      const createRes = await agent
        .post("/api/appointments")
        .send({
          appointmentDate: "2026-09-02",
          startTime: "14:00",
          endTime: "15:00",
          appointmentType: "checkup",
          patientId: testPatientId,
        });
      const id = createRes.body.data.id;
      const res = await agent
        .patch(`/api/appointments/${id}/status`)
        .send({ status: "completed" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("completed");
    });
  });

  describe("GET /api/appointments — search & filters", () => {
    beforeAll(async () => {
      await agent.post("/api/appointments").send({
        appointmentDate: "2026-09-05",
        startTime: "11:00",
        endTime: "12:00",
        appointmentType: "followup",
        quickName: "Search Quick Person",
        quickPhone: "7777777777",
      });
    });

    it("should search by patient name", async () => {
      const res = await agent.get("/api/appointments?search=Apt");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should search by quickName", async () => {
      const res = await agent.get("/api/appointments?search=Search Quick");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should filter by appointmentType", async () => {
      const res = await agent.get("/api/appointments?appointmentType=checkup");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/appointments/:id/link-patient", () => {
    it("should link patient to quick appointment", async () => {
      const createRes = await agent
        .post("/api/appointments")
        .send({
          appointmentDate: "2026-09-03",
          startTime: "09:00",
          endTime: "10:00",
          appointmentType: "checkup",
          quickName: "Quick Person",
          quickPhone: "9999999999",
        });
      const id = createRes.body.data.id;
      const res = await agent
        .post(`/api/appointments/${id}/link-patient`)
        .send({ patientId: testPatientId });
      expect(res.status).toBe(200);
      expect(res.body.data.patientId).toBe(testPatientId);
    });
  });
});

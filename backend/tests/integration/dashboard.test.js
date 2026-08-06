const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");

describe("Dashboard API Integration", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("GET /api/dashboard/stats", () => {
    it("should return stats with zero values on empty database", async () => {
      const res = await agent.get("/api/dashboard/stats");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.totalPatients).toBe(0);
      expect(res.body.data.todayAppointments).toBe(0);
      expect(res.body.data.unpaidInvoices).toBeDefined();
      expect(res.body.data.monthlyRevenue).toBe(0);
    });

    it("should return stats with data after creating records", async () => {
      await agent.post("/api/patients").send({
        fullName: "Dash API Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5558001",
      });

      // Use a guaranteed working day (Monday = day 1) to avoid OUTSIDE_WORKING_HOURS
      const now = new Date();
      const dayOfWeek = now.getDay();
      const workDay = dayOfWeek === 0
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : now.toISOString().split("T")[0];
      await agent.post("/api/appointments").send({
        appointmentDate: workDay,
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: 1,
      });

      const res = await agent.get("/api/dashboard/stats");
      expect(res.status).toBe(200);
      expect(res.body.data.totalPatients).toBeGreaterThan(0);
      // todayAppointments is only > 0 if today is a working day (Mon-Sat)
      if (dayOfWeek !== 0) {
        expect(res.body.data.todayAppointments).toBeGreaterThan(0);
      }
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/dashboard/stats");
      expect(res.status).toBe(401);
    });
  });
});

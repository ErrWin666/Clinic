const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient, createTestAppointment, createTestInvoice, createTestExam } = require("../../helpers/factories");
const DashboardService = require("../../../src/services/DashboardService");

describe("DashboardService", () => {
  let dashboardService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    dashboardService = new DashboardService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("getStats — empty database", () => {
    it("should return zero values without crashing", async () => {
      const stats = await dashboardService.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalPatients).toBe(0);
      expect(stats.todayAppointments).toBe(0);
      expect(stats.unpaidInvoices.count).toBe(0);
      expect(stats.unpaidInvoices.totalAmount).toBe(0);
      expect(stats.monthlyRevenue).toBe(0);
      expect(Array.isArray(stats.appointmentsChart)).toBe(true);
      expect(Array.isArray(stats.revenueChart)).toBe(true);
      expect(Array.isArray(stats.recentAppointments)).toBe(true);
      expect(Array.isArray(stats.recentExaminations)).toBe(true);
    });
  });

  describe("getStats — with data", () => {
    beforeAll(async () => {
      const patient = await createTestPatient({ fullName: "Dash Patient" });

      // Use a guaranteed working day (Monday = day 1) to avoid OUTSIDE_WORKING_HOURS
      const today = new Date();
      const dayOfWeek = today.getDay();
      // If today is Sunday (0), use tomorrow (Monday); otherwise use today
      const workDay = dayOfWeek === 0
        ? new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : today.toISOString().split("T")[0];

      await createTestAppointment(patient.id, {
        appointmentDate: workDay,
        startTime: "09:00",
        endTime: "10:00",
      });

      await createTestInvoice(patient.id, {
        invoiceDate: workDay,
        invoiceStatus: "unpaid",
        items: [{ description: "Unpaid item", quantity: 1, unitPrice: 100.0 }],
      });

      await createTestInvoice(patient.id, {
        invoiceDate: workDay,
        invoiceStatus: "paid",
        items: [{ description: "Paid item", quantity: 1, unitPrice: 200.0 }],
      });

      await createTestExam(patient.id, { examDate: workDay });
    });

    it("should count total patients", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.totalPatients).toBeGreaterThan(0);
    });

    it("should count today's non-cancelled appointments", async () => {
      const stats = await dashboardService.getStats();
      // todayAppointments is only > 0 if today is a working day (Mon-Sat)
      const today = new Date().getDay();
      if (today !== 0) {
        expect(stats.todayAppointments).toBeGreaterThan(0);
      }
    });

    it("should count unpaid invoices and total amount", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.unpaidInvoices.count).toBeGreaterThan(0);
      expect(stats.unpaidInvoices.totalAmount).toBeGreaterThan(0);
    });

    it("should calculate monthly revenue from paid invoices", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.monthlyRevenue).toBeGreaterThan(0);
    });

    it("should return appointments chart data", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.appointmentsChart.length).toBeGreaterThan(0);
      expect(stats.appointmentsChart[0]).toHaveProperty("month");
      expect(stats.appointmentsChart[0]).toHaveProperty("count");
    });

    it("should return revenue chart data", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.revenueChart.length).toBeGreaterThan(0);
      expect(stats.revenueChart[0]).toHaveProperty("month");
      expect(stats.revenueChart[0]).toHaveProperty("amount");
    });

    it("should return recent appointments (max 5)", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.recentAppointments.length).toBeGreaterThan(0);
      expect(stats.recentAppointments.length).toBeLessThanOrEqual(5);
    });

    it("should return recent examinations (max 5)", async () => {
      const stats = await dashboardService.getStats();
      expect(stats.recentExaminations.length).toBeGreaterThan(0);
      expect(stats.recentExaminations.length).toBeLessThanOrEqual(5);
    });

    it("should exclude cancelled appointments from recent list", async () => {
      const patient = await createTestPatient({ fullName: "Cancel Dash Patient" });
      // Use a guaranteed working day (Monday = day 1) to avoid OUTSIDE_WORKING_HOURS
      const now = new Date();
      const dayOfWeek = now.getDay();
      const workDay = dayOfWeek === 0
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : now.toISOString().split("T")[0];
      await createTestAppointment(patient.id, {
        appointmentDate: workDay,
        startTime: "10:00",
        endTime: "11:00",
      });
      const cancelApt = await createTestAppointment(patient.id, {
        appointmentDate: workDay,
        startTime: "11:00",
        endTime: "12:00",
      });
      await cancelApt.update({ status: "cancelled" });

      const stats = await dashboardService.getStats();
      const cancelledInRecent = stats.recentAppointments.some((a) => a.status === "cancelled");
      expect(cancelledInRecent).toBe(false);
    });
  });

  describe("getStats — with date range", () => {
    it("should apply date filters when startDate and endDate provided", async () => {
      const startDate = "2020-01-01";
      const endDate = "2030-12-31";
      const stats = await dashboardService.getStats(startDate, endDate);
      expect(stats).toBeDefined();
      expect(stats.totalPatients).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.appointmentsChart)).toBe(true);
      expect(Array.isArray(stats.revenueChart)).toBe(true);
    });

    it("should apply date filter with only startDate", async () => {
      const stats = await dashboardService.getStats("2020-01-01");
      expect(stats).toBeDefined();
    });

    it("should apply date filter with only endDate", async () => {
      const stats = await dashboardService.getStats(null, "2030-12-31");
      expect(stats).toBeDefined();
    });
  });
});

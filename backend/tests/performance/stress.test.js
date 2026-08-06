const { setupTestDB, teardownTestDB, createTestAdmin } = require("../helpers/setup");
const PatientService = require("../../src/services/PatientService");
const AppointmentService = require("../../src/services/AppointmentService");
const DashboardService = require("../../src/services/DashboardService");

const STRESS_COUNT = 30;
// Budget is generous to stay stable under parallel CI/jest workers where CPU
// contention can slow in-memory SQLite queries significantly.
const BUDGET_MS = 2000;

function measureMs(fn) {
  const start = performance.now();
  return fn().then((result) => ({ result, elapsed: performance.now() - start }));
}

function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

describe("Stress Tests", () => {
  let patientService, appointmentService, dashboardService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
    appointmentService = new AppointmentService();
    dashboardService = new DashboardService();

    for (let i = 0; i < 20; i++) {
      await patientService.create({
        fullName: `Stress Patient ${i}`,
        birthDate: "1990-01-01",
        gender: i % 2 === 0 ? "male" : "female",
        phoneNumber: `900000${String(i).padStart(4, "0")}`,
      });
    }
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("sequential stress on patient list", () => {
    it(`should handle ${STRESS_COUNT} sequential patient list requests`, async () => {
      const times = [];
      for (let i = 0; i < STRESS_COUNT; i++) {
        const { elapsed } = await measureMs(() => patientService.list({ page: 1, pageSize: 10 }));
        times.push(elapsed);
      }
      const p50 = percentile(times, 50);
      const p95 = percentile(times, 95);
      const p99 = percentile(times, 99);
      expect(p50).toBeLessThan(BUDGET_MS);
      expect(p95).toBeLessThan(BUDGET_MS);
      expect(p99).toBeLessThan(BUDGET_MS * 2);
    });
  });

  describe("sequential stress on dashboard stats", () => {
    it(`should handle ${STRESS_COUNT} sequential dashboard requests`, async () => {
      const times = [];
      for (let i = 0; i < STRESS_COUNT; i++) {
        const { elapsed } = await measureMs(() => dashboardService.getStats());
        times.push(elapsed);
      }
      const p50 = percentile(times, 50);
      const p95 = percentile(times, 95);
      expect(p50).toBeLessThan(BUDGET_MS);
      expect(p95).toBeLessThan(BUDGET_MS);
    });
  });

  describe("mixed operation stress", () => {
    it("should handle mixed CRUD operations without degradation", async () => {
      const times = [];
      for (let i = 0; i < 20; i++) {
        const createMs = await measureMs(() =>
          patientService.create({
            fullName: `Mixed Stress ${i}`,
            birthDate: "1991-01-01",
            gender: "male",
            phoneNumber: `911111${String(i).padStart(4, "0")}`,
          })
        );
        times.push(createMs.elapsed);

        const listMs = await measureMs(() => patientService.list({ page: 1, pageSize: 10 }));
        times.push(listMs.elapsed);
      }
      const p95 = percentile(times, 95);
      expect(p95).toBeLessThan(BUDGET_MS);
    });
  });

  describe("pagination stress on large result set", () => {
    it("should handle deep pagination efficiently", async () => {
      // Create enough data for 5+ pages
      for (let i = 0; i < 15; i++) {
        await patientService.create({
          fullName: `Deep Page ${i}`,
          birthDate: "1993-01-01",
          gender: "female",
          phoneNumber: `922222${String(i).padStart(4, "0")}`,
        });
      }

      const times = [];
      for (let page = 1; page <= 5; page++) {
        const { elapsed } = await measureMs(() => patientService.list({ page, pageSize: 10 }));
        times.push(elapsed);
      }
      const maxTime = Math.max(...times);
      expect(maxTime).toBeLessThan(BUDGET_MS);
    });
  });
});

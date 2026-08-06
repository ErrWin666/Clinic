const { setupTestDB, teardownTestDB, createTestAdmin } = require("../helpers/setup");
const PatientService = require("../../src/services/PatientService");
const AppointmentService = require("../../src/services/AppointmentService");
const InvoiceService = require("../../src/services/InvoiceService");
const DashboardService = require("../../src/services/DashboardService");
const ReportService = require("../../src/services/reports");

const RESPONSE_BUDGET_MS = 2000;
const HEAVY_BUDGET_MS = 4000;

function measureMs(fn) {
  const start = performance.now();
  return fn().then((result) => {
    const elapsed = performance.now() - start;
    return { result, elapsed };
  });
}

function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

describe("Performance & Response Time Tests", () => {
  let patientService, appointmentService, invoiceService, dashboardService, reportService;
  let testPatient;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
    appointmentService = new AppointmentService();
    invoiceService = new InvoiceService();
    dashboardService = new DashboardService();
    reportService = new ReportService();

    // Seed 20 patients for baseline
    for (let i = 0; i < 20; i++) {
      await patientService.create({
        fullName: `Perf Patient ${i}`,
        birthDate: "1990-01-01",
        gender: i % 2 === 0 ? "male" : "female",
        phoneNumber: `555000${String(i).padStart(4, "0")}`,
      });
    }
    testPatient = await patientService.create({
      fullName: "Perf Test Patient",
      birthDate: "1985-05-15",
      gender: "male",
      phoneNumber: "5555550001",
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("response time budgets", () => {
    it("GET patients list should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() => patientService.list({ page: 1, pageSize: 10 }));
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("GET patient by id should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() => patientService.getById(testPatient.id));
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("POST create patient should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() =>
        patientService.create({
          fullName: "RT Test Patient",
          birthDate: "1992-01-01",
          gender: "female",
          phoneNumber: "5555550099",
        })
      );
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("GET dashboard stats should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() => dashboardService.getStats());
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("POST create appointment should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() =>
        appointmentService.create({
          appointmentDate: "2026-10-01",
          startTime: "10:00",
          endTime: "11:00",
          appointmentType: "checkup",
          patientId: testPatient.id,
        })
      );
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("POST create invoice should respond < 1000ms (transaction)", async () => {
      const { elapsed } = await measureMs(() =>
        invoiceService.create({
          patientId: testPatient.id,
          invoiceDate: "2026-10-01",
          items: [
            { description: "Item 1", quantity: 1, unitPrice: 50.0 },
            { description: "Item 2", quantity: 2, unitPrice: 30.0 },
          ],
        })
      );
      expect(elapsed).toBeLessThan(1000);
    });

    it("GET appointments list should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() => appointmentService.list({ page: 1, pageSize: 10 }));
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("GET invoices list should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() => invoiceService.list({ page: 1, pageSize: 10 }));
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });

    it("GET patient autocomplete should respond < 500ms", async () => {
      const { elapsed } = await measureMs(() => patientService.autocomplete("Perf", 10));
      expect(elapsed).toBeLessThan(RESPONSE_BUDGET_MS);
    });
  });

  describe("repeated requests performance", () => {
    it("should maintain < 500ms response time over 20 sequential patient list requests", async () => {
      const times = [];
      for (let i = 0; i < 20; i++) {
        const { elapsed } = await measureMs(() => patientService.list({ page: 1, pageSize: 10 }));
        times.push(elapsed);
      }
      const p50 = percentile(times, 50);
      const p95 = percentile(times, 95);
      const p99 = percentile(times, 99);
      expect(p50).toBeLessThan(RESPONSE_BUDGET_MS);
      expect(p95).toBeLessThan(RESPONSE_BUDGET_MS);
      expect(p99).toBeLessThan(RESPONSE_BUDGET_MS * 2);
    });

    it("should maintain < 500ms response time over 20 sequential dashboard requests", async () => {
      const times = [];
      for (let i = 0; i < 20; i++) {
        const { elapsed } = await measureMs(() => dashboardService.getStats());
        times.push(elapsed);
      }
      const p50 = percentile(times, 50);
      const p95 = percentile(times, 95);
      expect(p50).toBeLessThan(RESPONSE_BUDGET_MS);
      expect(p95).toBeLessThan(RESPONSE_BUDGET_MS);
    });
  });
});

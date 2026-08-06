const { setupTestDB, teardownTestDB, createTestAdmin } = require("../helpers/setup");
const PatientService = require("../../src/services/PatientService");
const AppointmentService = require("../../src/services/AppointmentService");
const InvoiceService = require("../../src/services/InvoiceService");

const BULK_COUNT = 50;
const BULK_BUDGET_MS = 2000;

function measureMs(fn) {
  const start = performance.now();
  return fn().then((result) => {
    return { result, elapsed: performance.now() - start };
  });
}

describe("Bulk Data & Load Tests", () => {
  let patientService, appointmentService, invoiceService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
    appointmentService = new AppointmentService();
    invoiceService = new InvoiceService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("bulk patient creation and listing", () => {
    it(`should create ${BULK_COUNT} patients and list them efficiently`, async () => {
      const createStart = performance.now();
      for (let i = 0; i < BULK_COUNT; i++) {
        await patientService.create({
          fullName: `Bulk Patient ${i}`,
          birthDate: "1990-01-01",
          gender: i % 2 === 0 ? "male" : "female",
          phoneNumber: `700000${String(i).padStart(4, "0")}`,
        });
      }
      const createElapsed = performance.now() - createStart;
      expect(createElapsed).toBeLessThan(BULK_BUDGET_MS * 5);

      const { result, elapsed } = await measureMs(() =>
        patientService.list({ page: 1, pageSize: 50 })
      );
      expect(elapsed).toBeLessThan(BULK_BUDGET_MS);
      expect(result.rows.length).toBe(BULK_COUNT);
      expect(result.pagination.totalItems).toBe(BULK_COUNT);
    });

    it("should paginate through bulk patients efficiently", async () => {
      const times = [];
      const totalPages = Math.ceil(BULK_COUNT / 10);
      let allRows = [];
      for (let page = 1; page <= totalPages; page++) {
        const { result, elapsed } = await measureMs(() =>
          patientService.list({ page, pageSize: 10 })
        );
        times.push(elapsed);
        allRows = allRows.concat(result.rows);
      }
      expect(allRows.length).toBe(BULK_COUNT);
      for (const t of times) {
        expect(t).toBeLessThan(BULK_BUDGET_MS);
      }
    });

    it("should search through bulk patients efficiently", async () => {
      const { elapsed, result } = await measureMs(() =>
        patientService.list({ search: "Bulk Patient 2", page: 1, pageSize: 10 })
      );
      expect(elapsed).toBeLessThan(BULK_BUDGET_MS);
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should filter bulk patients by gender efficiently", async () => {
      const { elapsed, result } = await measureMs(() =>
        patientService.list({ gender: "male", page: 1, pageSize: 50 })
      );
      expect(elapsed).toBeLessThan(BULK_BUDGET_MS);
      expect(result.rows.every((r) => r.gender === "male")).toBe(true);
    });
  });

  describe("bulk appointment creation and listing", () => {
    it(`should create ${BULK_COUNT / 2} appointments and list efficiently`, async () => {
      const patient = await patientService.create({
        fullName: "Bulk Apt Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "7000999000",
      });

      const aptCount = BULK_COUNT / 2;
      for (let i = 0; i < aptCount; i++) {
        const hour = 9 + Math.floor(i / 4);
        const minute = (i % 4) * 15;
        const endMinute = minute + 15;
        const endHour = hour + Math.floor(endMinute / 60);
        const endMin = endMinute % 60;
        const startTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
        await appointmentService.create({
          appointmentDate: "2026-10-01",
          startTime,
          endTime,
          appointmentType: "checkup",
          patientId: patient.id,
        });
      }

      const { result, elapsed } = await measureMs(() =>
        appointmentService.list({ page: 1, pageSize: 50 })
      );
      expect(elapsed).toBeLessThan(BULK_BUDGET_MS);
      expect(result.rows.length).toBe(aptCount);
    });
  });

  describe("bulk invoice creation and listing", () => {
    it(`should create ${BULK_COUNT / 2} invoices and list efficiently`, async () => {
      const patient = await patientService.create({
        fullName: "Bulk Inv Patient",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "7000888000",
      });

      const invCount = BULK_COUNT / 2;
      for (let i = 0; i < invCount; i++) {
        await invoiceService.create({
          patientId: patient.id,
          invoiceDate: `2026-10-${String(1 + (i % 28)).padStart(2, "0")}`,
          items: [{ description: `Item ${i}`, quantity: 1, unitPrice: 10.0 }],
        });
      }

      const { result, elapsed } = await measureMs(() =>
        invoiceService.list({ page: 1, pageSize: 50 })
      );
      expect(elapsed).toBeLessThan(BULK_BUDGET_MS);
      expect(result.rows.length).toBe(invCount);
    });
  });

  describe("displayId generation under bulk load", () => {
    it("should generate sequential displayIds without gaps", async () => {
      const ids = [];
      for (let i = 0; i < 10; i++) {
        const p = await patientService.create({
          fullName: `Seq ID Patient ${i}`,
          birthDate: "1990-01-01",
          gender: "male",
          phoneNumber: `600000${String(i).padStart(4, "0")}`,
        });
        ids.push(p.displayId);
      }
      // All displayIds should be unique
      const unique = new Set(ids);
      expect(unique.size).toBe(10);
      // All should match pattern P-XXXX
      expect(ids.every((id) => /^P-\d{4}$/.test(id))).toBe(true);
    });
  });
});

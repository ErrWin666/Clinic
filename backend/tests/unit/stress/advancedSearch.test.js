const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const PatientService = require("../../../src/services/PatientService");
const InvoiceService = require("../../../src/services/InvoiceService");
const AppointmentService = require("../../../src/services/AppointmentService");

describe("Advanced Search, Filter & Lazy Loading Tests", () => {
  let patientService, invoiceService, appointmentService;
  let patients = [];
  const LAZY_TOTAL = 25;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
    invoiceService = new InvoiceService();
    appointmentService = new AppointmentService();

    // Create diverse test data for search tests
    const data = [
      { fullName: "Ahmed Ali", birthDate: "1985-03-15", gender: "male", phoneNumber: "0501234567", email: "ahmed@test.com", patientType: "regular" },
      { fullName: "Fatima Hassan", birthDate: "1990-07-20", gender: "female", phoneNumber: "0507654321", email: "fatima@test.com", patientType: "regular" },
      { fullName: "John Smith", birthDate: "1975-12-01", gender: "male", phoneNumber: "0559876543", email: "john@test.com", patientType: "spouse" },
      { fullName: "Maryam Ali", birthDate: "2000-05-10", gender: "female", phoneNumber: "0521112233", patientType: "child" },
      { fullName: "أحمد محمد", birthDate: "1988-01-25", gender: "male", phoneNumber: "0533334444", patientType: "regular" },
      { fullName: "Special;Chars Test", birthDate: "1995-06-18", gender: "male", phoneNumber: "0545556666", patientType: "regular" },
    ];

    for (const d of data) {
      patients.push(await patientService.create(d));
    }

    // Create bulk data for lazy loading tests
    for (let i = 0; i < LAZY_TOTAL; i++) {
      await patientService.create({
        fullName: `Lazy Load Patient ${String(i).padStart(2, "0")}`,
        birthDate: "1990-01-01",
        gender: i % 2 === 0 ? "male" : "female",
        phoneNumber: `300000${String(i).padStart(4, "0")}`,
      });
    }
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("partial name search", () => {
    it("should find by first name partial", async () => {
      const { rows } = await patientService.list({ search: "Ahmed" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.fullName.includes("Ahmed"))).toBe(true);
    });

    it("should find by last name partial", async () => {
      const { rows } = await patientService.list({ search: "Ali" });
      expect(rows.some((r) => r.fullName.includes("Ali"))).toBe(true);
    });

    it("should find by partial phone", async () => {
      const { rows } = await patientService.list({ search: "0501" });
      expect(rows.some((r) => r.phoneNumber.includes("0501"))).toBe(true);
    });

    it("should find by email partial", async () => {
      const { rows } = await patientService.list({ search: "fatima" });
      expect(rows.some((r) => r.email && r.email.includes("fatima"))).toBe(true);
    });
  });

  describe("Arabic text search", () => {
    it("should find Arabic names", async () => {
      const { rows } = await patientService.list({ search: "أحمد" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.fullName.includes("أحمد"))).toBe(true);
    });

    it("should find Arabic partial", async () => {
      const { rows } = await patientService.list({ search: "محمد" });
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe("special characters in search", () => {
    it("should handle semicolons safely", async () => {
      const { rows } = await patientService.list({ search: "Special;Chars" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should handle SQL injection attempts safely", async () => {
      const { rows } = await patientService.list({ search: "'; DROP TABLE patients; --" });
      expect(rows.length).toBe(0);
      // Verify table still exists
      const all = await patientService.list({});
      expect(all.rows.length).toBeGreaterThan(0);
    });

    it("should handle wildcard-like search", async () => {
      const { rows } = await patientService.list({ search: "%" });
      expect(rows).toBeDefined();
    });
  });

  describe("combined filters", () => {
    it("should combine search + gender filter", async () => {
      const { rows } = await patientService.list({ search: "Ali", gender: "male" });
      expect(rows.every((r) => r.gender === "male")).toBe(true);
      expect(rows.some((r) => r.fullName.includes("Ali"))).toBe(true);
    });

    it("should combine gender + patientType filter", async () => {
      const { rows } = await patientService.list({ gender: "female", patientType: "regular" });
      expect(rows.every((r) => r.gender === "female" && r.patientType === "regular")).toBe(true);
    });

    it("should combine search + ageRange filter", async () => {
      const { rows } = await patientService.list({ search: "Ahmed", minAge: 30, maxAge: 50 });
      expect(rows.every((r) => r.fullName.includes("Ahmed"))).toBe(true);
    });

    it("should combine all filters", async () => {
      const { rows } = await patientService.list({
        gender: "male",
        patientType: "regular",
        minAge: 20,
        maxAge: 60,
      });
      expect(rows.every((r) => r.gender === "male" && r.patientType === "regular")).toBe(true);
    });
  });

  describe("empty and edge case searches", () => {
    it("should return all for empty search", async () => {
      const { rows } = await patientService.list({ search: "" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should return empty for non-matching search", async () => {
      const { rows } = await patientService.list({ search: "ZZZZZNONEXIST" });
      expect(rows.length).toBe(0);
    });

    it("should handle very long search string", async () => {
      const longStr = "A".repeat(500);
      const { rows } = await patientService.list({ search: longStr });
      expect(rows.length).toBe(0);
    });
  });

  describe("sorting", () => {
    it("should sort by fullName ASC", async () => {
      const { rows } = await patientService.list({ sortBy: "fullName", sortOrder: "ASC" });
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].fullName >= rows[i - 1].fullName).toBe(true);
      }
    });

    it("should sort by fullName DESC", async () => {
      const { rows } = await patientService.list({ sortBy: "fullName", sortOrder: "DESC" });
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].fullName <= rows[i - 1].fullName).toBe(true);
      }
    });

    it("should sort by createdAt DESC (default)", async () => {
      const { rows } = await patientService.list({});
      for (let i = 1; i < rows.length; i++) {
        expect(new Date(rows[i].createdAt) <= new Date(rows[i - 1].createdAt)).toBe(true);
      }
    });
  });

  describe("lazy loading / pagination", () => {
    const TOTAL = LAZY_TOTAL + 6; // 25 lazy + 6 search patients

    it("should load page 1 with correct count", async () => {
      const { rows, pagination } = await patientService.list({ page: 1, pageSize: 10 });
      expect(rows.length).toBe(10);
      expect(pagination.totalItems).toBe(TOTAL);
      expect(pagination.totalPages).toBe(Math.ceil(TOTAL / 10));
      expect(pagination.currentPage).toBe(1);
    });

    it("should load page 2 with different results", async () => {
      const page1 = await patientService.list({ page: 1, pageSize: 10 });
      const page2 = await patientService.list({ page: 2, pageSize: 10 });
      const page1Ids = page1.rows.map((r) => r.id);
      const page2Ids = page2.rows.map((r) => r.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });

    it("should load last page with remaining items", async () => {
      const lastPage = Math.ceil(TOTAL / 10);
      const { rows, pagination } = await patientService.list({ page: lastPage, pageSize: 10 });
      expect(rows.length).toBe(TOTAL - (lastPage - 1) * 10);
      expect(pagination.currentPage).toBe(lastPage);
    });

    it("should return empty for page beyond total", async () => {
      const { rows, pagination } = await patientService.list({ page: 99, pageSize: 10 });
      expect(rows.length).toBe(0);
      expect(pagination.totalItems).toBe(TOTAL);
    });

    it("should maintain consistent totalItems across pages", async () => {
      const lastPage = Math.ceil(TOTAL / 10);
      const pages = [];
      for (let p = 1; p <= lastPage; p++) {
        pages.push(await patientService.list({ page: p, pageSize: 10 }));
      }
      for (let i = 1; i < pages.length; i++) {
        expect(pages[i].pagination.totalItems).toBe(pages[0].pagination.totalItems);
      }
    });

    it("should handle pageSize change mid-stream", async () => {
      const largePage = await patientService.list({ page: 1, pageSize: 20 });
      const smallPage = await patientService.list({ page: 1, pageSize: 5 });
      expect(largePage.rows.length).toBe(20);
      expect(smallPage.rows.length).toBe(5);
      expect(largePage.pagination.totalPages).toBe(Math.ceil(TOTAL / 20));
      expect(smallPage.pagination.totalPages).toBe(Math.ceil(TOTAL / 5));
    });

    it("should reflect new records in subsequent page loads", async () => {
      const beforeCount = (await patientService.list({ page: 1, pageSize: 100 })).pagination.totalItems;
      await patientService.create({
        fullName: "New Lazy Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "3000999999",
      });
      const afterCount = (await patientService.list({ page: 1, pageSize: 100 })).pagination.totalItems;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it("should respond quickly for each page (< 200ms)", async () => {
      const lastPage = Math.ceil(TOTAL / 10);
      for (let p = 1; p <= lastPage; p++) {
        const start = performance.now();
        await patientService.list({ page: p, pageSize: 10 });
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(200);
      }
    });
  });
});

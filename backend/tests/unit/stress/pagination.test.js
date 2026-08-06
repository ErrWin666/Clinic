const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient } = require("../../helpers/factories");
const PatientService = require("../../../src/services/PatientService");
const { parsePagination, buildPaginationResponse } = require("../../../src/utils/pagination");

describe("Pagination Edge Cases", () => {
  let patientService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();

    for (let i = 0; i < 25; i++) {
      await createTestPatient({ fullName: `PagPatient ${i}` });
    }
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("parsePagination", () => {
    it("should default page=1 when page=0", () => {
      const { page, pageSize, offset, limit } = parsePagination({ page: 0, pageSize: 10 });
      expect(page).toBe(1);
    });

    it("should default pageSize when pageSize=0", () => {
      const { page, pageSize, offset, limit } = parsePagination({ page: 1, pageSize: 0 });
      expect(pageSize).toBeGreaterThanOrEqual(1);
    });

    it("should handle negative page", () => {
      const { page, pageSize, offset, limit } = parsePagination({ page: -5, pageSize: 10 });
      expect(page).toBeGreaterThanOrEqual(1);
    });

    it("should cap pageSize at max", () => {
      const { page, pageSize, offset, limit } = parsePagination({ page: 1, pageSize: 1000 });
      expect(pageSize).toBeLessThanOrEqual(100);
    });

    it("should handle very large offset with empty results", async () => {
      const { rows, pagination } = await patientService.list({ page: 100, pageSize: 10 });
      expect(rows.length).toBe(0);
      expect(pagination.totalItems).toBe(25);
    });

    it("should return correct totalCount across pages", async () => {
      const page1 = await patientService.list({ page: 1, pageSize: 10 });
      const page2 = await patientService.list({ page: 2, pageSize: 10 });
      const page3 = await patientService.list({ page: 3, pageSize: 10 });

      expect(page1.pagination.totalItems).toBe(25);
      expect(page1.rows.length).toBe(10);
      expect(page2.rows.length).toBe(10);
      expect(page3.rows.length).toBe(5);
    });
  });
});

const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const AuditLogService = require("../../../src/services/AuditLogService");
const { AuditLog, User } = require("../../../src/models");

describe("AuditLogService", () => {
  let auditLogService;
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    auditLogService = new AuditLogService();
    testUser = await User.findOne({ where: { username: "admin" } });

    await AuditLog.bulkCreate([
      { userId: testUser.id, action: "CREATE", entity: "Patient", entityId: 1, details: "Created patient" },
      { userId: testUser.id, action: "UPDATE", entity: "Invoice", entityId: 2, details: "Updated invoice" },
      { userId: testUser.id, action: "DELETE", entity: "Patient", entityId: 3, details: "Deleted patient" },
      { userId: testUser.id, action: "CREATE", entity: "Appointment", entityId: 4, details: "Created appointment" },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("list", () => {
    it("should return paginated audit logs", async () => {
      const { rows, pagination } = await auditLogService.list({ page: 1, pageSize: 10 });
      expect(rows).toBeDefined();
      expect(pagination).toBeDefined();
      expect(rows.length).toBe(4);
      expect(pagination.totalItems).toBe(4);
    });

    it("should filter by userId", async () => {
      const { rows } = await auditLogService.list({ userId: testUser.id });
      expect(rows.length).toBe(4);
      expect(rows.every((r) => r.userId === testUser.id)).toBe(true);
    });

    it("should filter by action", async () => {
      const { rows } = await auditLogService.list({ action: "CREATE" });
      expect(rows.length).toBe(2);
      expect(rows.every((r) => r.action === "CREATE")).toBe(true);
    });

    it("should filter by entity", async () => {
      const { rows } = await auditLogService.list({ entity: "Patient" });
      expect(rows.length).toBe(2);
      expect(rows.every((r) => r.entity === "Patient")).toBe(true);
    });

    it("should filter by date range", async () => {
      const startDate = new Date(Date.now() - 86400000).toISOString();
      const endDate = new Date(Date.now() + 86400000).toISOString();
      const { rows } = await auditLogService.list({ startDate, endDate });
      expect(rows.length).toBe(4);
    });

    it("should combine multiple filters", async () => {
      const { rows } = await auditLogService.list({ action: "DELETE", entity: "Patient" });
      expect(rows.length).toBe(1);
      expect(rows[0].action).toBe("DELETE");
      expect(rows[0].entity).toBe("Patient");
    });

    it("should return empty for non-matching filters", async () => {
      const { rows } = await auditLogService.list({ action: "NONEXISTENT" });
      expect(rows.length).toBe(0);
    });

    it("should paginate correctly", async () => {
      const page1 = await auditLogService.list({ page: 1, pageSize: 2 });
      const page2 = await auditLogService.list({ page: 2, pageSize: 2 });
      expect(page1.rows.length).toBe(2);
      expect(page2.rows.length).toBe(2);
      expect(page1.pagination.totalItems).toBe(4);
      expect(page2.pagination.totalItems).toBe(4);
    });
  });
});

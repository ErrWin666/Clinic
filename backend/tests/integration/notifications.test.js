const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { Notification } = require("../../src/models");

describe("Notification API Integration", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);

    await Notification.bulkCreate([
      { type: "appointment_reminder", title: "Reminder 1", message: "Tomorrow appointment", isRead: false },
      { type: "overdue_invoice", title: "Overdue 1", message: "Invoice overdue", isRead: false },
      { type: "backup", title: "Backup done", message: "Backup completed", isRead: true },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("GET /api/notifications", () => {
    it("should return paginated list", async () => {
      const res = await agent.get("/api/notifications?page=1&pageSize=10");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should filter by isRead=true", async () => {
      const res = await agent.get("/api/notifications?isRead=true");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const items = res.body.data.rows || res.body.data;
      expect(items.every((n) => n.isRead === true)).toBe(true);
    });

    it("should filter by type", async () => {
      const res = await agent.get("/api/notifications?type=backup");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const items = res.body.data.rows || res.body.data;
      expect(items.every((n) => n.type === "backup")).toBe(true);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("should mark a notification as read", async () => {
      const notif = await Notification.create({
        type: "appointment_reminder",
        title: "Mark Read Test",
        message: "Test",
        isRead: false,
      });

      const res = await agent.patch(`/api/notifications/${notif.id}/read`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      const res = await agent.patch("/api/notifications/read-all");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const unread = await Notification.count({ where: { isRead: false } });
      expect(unread).toBe(0);
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("should delete a notification", async () => {
      const notif = await Notification.create({
        type: "appointment_reminder",
        title: "Delete Test",
        message: "Test",
        isRead: false,
      });

      const res = await agent.delete(`/api/notifications/${notif.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const found = await Notification.findByPk(notif.id);
      expect(found).toBeNull();
    });
  });

  describe("Unauthorized access", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });
  });
});

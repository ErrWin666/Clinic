const request = require("supertest");
const app = require("../../src/app");
const { setupTestDB, teardownTestDB, createTestAdmin, getAuthCookie } = require("../helpers/setup");
const { Notification, Patient, Appointment } = require("../../src/models");

describe("E2E: Notification Flow", () => {
  let agent;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    agent = await getAuthCookie(app);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("Notification lifecycle", () => {
    let notificationId, patientId, appointmentId;

    it("should create a patient for notifications", async () => {
      const res = await agent.post("/api/patients").send({
        fullName: "Notification Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "555-0001",
        patientType: "regular",
      });
      expect(res.status).toBe(201);
      patientId = res.body.data.id;
    });

    it("should create an appointment for notifications", async () => {
      const res = await agent.post("/api/appointments").send({
        patientId,
        appointmentDate: "2026-07-01",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        notes: "Test appointment",
      });
      expect(res.status).toBe(201);
      appointmentId = res.body.data.id;
    });

    it("should create a notification directly in DB for testing", async () => {
      const notification = await Notification.create({
        type: "appointment_reminder",
        title: "Appointment Reminder",
        message: "You have an appointment tomorrow",
        entityType: "patient",
        entityId: patientId,
        isRead: false,
      });
      notificationId = notification.id;
    });

    it("should list notifications", async () => {
      const res = await agent.get("/api/notifications");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should filter unread notifications", async () => {
      const res = await agent.get("/api/notifications").query({ isRead: false });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((n) => n.isRead === false)).toBe(true);
    });

    it("should mark a notification as read", async () => {
      const res = await agent.patch(`/api/notifications/${notificationId}/read`);
      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it("should mark all notifications as read", async () => {
      const res = await agent.patch("/api/notifications/read-all");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should delete a notification", async () => {
      const res = await agent.delete(`/api/notifications/${notificationId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 for deleted notification", async () => {
      const res = await agent.delete(`/api/notifications/${notificationId}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Reminder settings", () => {
    it("should get reminder settings", async () => {
      const res = await agent.get("/api/notifications/reminder-settings");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should update reminder settings", async () => {
      const res = await agent.put("/api/notifications/reminder-settings").send({
        appointmentReminderDays: 2,
        invoiceReminderDays: 7,
        followUpDays: 30,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject invalid reminder settings", async () => {
      const res = await agent.put("/api/notifications/reminder-settings").send({
        appointmentReminderDays: -1,
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Message templates", () => {
    it("should get message templates", async () => {
      const res = await agent.get("/api/notifications/templates");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should update a message template", async () => {
      const res = await agent.put("/api/notifications/templates/appointment_reminder").send({
        text: "Updated reminder text",
        html: "<p>Updated reminder</p>",
      });
      expect([200, 404]).toContain(res.status);
    });

    it("should reset a message template", async () => {
      const res = await agent.delete("/api/notifications/templates/appointment_reminder");
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("Error cases", () => {
    it("should return 404 for non-existent notification on mark read", async () => {
      const res = await agent.patch("/api/notifications/99999/read");
      expect(res.status).toBe(404);
    });

    it("should return error for invalid notification id", async () => {
      const res = await agent.patch("/api/notifications/invalid/read");
      expect(res.status).toBe(400);
    });
  });
});

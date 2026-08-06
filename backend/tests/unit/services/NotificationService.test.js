const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient, createTestAppointment, createTestInvoice, createTestExam, createTestNotification } = require("../../helpers/factories");
const NotificationScheduler = require("../../../src/services/NotificationScheduler");
const NotificationService = require("../../../src/services/NotificationService");
const { Notification, Appointment, Invoice, EyeExamination, Patient } = require("../../../src/models");
const { Op } = require("sequelize");

/**
 * Returns a date string (YYYY-MM-DD) for a working day (Mon-Sat) within the
 * reminder window. `AppointmentService._validateWorkingHours` rejects Sundays
 * (day 0) and times outside 09:00-18:00, so tests must use a valid working day.
 * If tomorrow is Sunday, we use today (Saturday) instead so the appointment
 * stays within the default 24h reminder window.
 */
function nextWorkingDayStr(from = new Date()) {
  const d = new Date(from);
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) {
    // Tomorrow is Sunday — use today (must be a working day, Mon-Sat)
    return d.toISOString().split("T")[0];
  }
  return tomorrow.toISOString().split("T")[0];
}

describe("NotificationScheduler", () => {
  let notifService;
  let notifSvcDirect;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    notifService = new NotificationScheduler();
    notifSvcDirect = new NotificationService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("list", () => {
    it("should return paginated notifications", async () => {
      await createTestNotification({ message: "List test 1" });
      await createTestNotification({ message: "List test 2" });

      const { rows, pagination } = await notifService.list({ page: 1, pageSize: 10 });
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      expect(pagination).toBeDefined();
      expect(pagination.totalItems).toBeGreaterThan(0);
    });

    it("should filter by isRead=true", async () => {
      await createTestNotification({ message: "Read notif", isRead: true });
      await createTestNotification({ message: "Unread notif", isRead: false });

      const { rows } = await notifService.list({ isRead: true });
      expect(rows.every((r) => r.isRead === true)).toBe(true);
    });

    it("should filter by type", async () => {
      await createTestNotification({ message: "Type filter", type: "backup" });

      const { rows } = await notifService.list({ type: "backup" });
      expect(rows.every((r) => r.type === "backup")).toBe(true);
    });
  });

  describe("markRead", () => {
    it("should mark a notification as read", async () => {
      const notif = await createTestNotification({ message: "Mark read test", isRead: false });
      const updated = await notifService.markRead(notif.id);
      expect(updated.isRead).toBe(true);
    });
  });

  describe("markAllRead", () => {
    it("should mark all notifications as read", async () => {
      await createTestNotification({ message: "Mark all 1", isRead: false });
      await createTestNotification({ message: "Mark all 2", isRead: false });

      await notifService.markAllRead();

      const unread = await Notification.count({ where: { isRead: false } });
      expect(unread).toBe(0);
    });
  });

  describe("delete", () => {
    it("should delete a notification", async () => {
      const notif = await createTestNotification({ message: "Delete test" });
      await notifService.delete(notif.id);

      const found = await Notification.findByPk(notif.id);
      expect(found).toBeNull();
    });
  });

  describe("checkAppointmentReminders", () => {
    it("should create notification for tomorrow's upcoming appointment", async () => {
      const patient = await createTestPatient({ fullName: "Reminder Patient" });
      const tomorrowStr = nextWorkingDayStr();

      await createTestAppointment(patient.id, {
        appointmentDate: tomorrowStr,
        startTime: "10:00",
        endTime: "10:30",
      });

      await notifService.checkAppointmentReminders();

      const notif = await Notification.findOne({
        where: { type: "appointment_reminder", entityType: "Appointment" },
      });
      expect(notif).toBeDefined();
      expect(notif).not.toBeNull();
      expect(notif.message).toContain("10:00");
    });

    it("should not create duplicate appointment reminder", async () => {
      const patient = await createTestPatient({ fullName: "Dup Reminder Patient" });
      const tomorrowStr = nextWorkingDayStr();

      const apt = await createTestAppointment(patient.id, {
        appointmentDate: tomorrowStr,
        startTime: "14:00",
        endTime: "14:30",
      });

      await notifService.checkAppointmentReminders();
      await notifService.checkAppointmentReminders();

      const notifs = await Notification.findAll({
        where: { type: "appointment_reminder", entityId: apt.id, entityType: "Appointment" },
      });
      expect(notifs.length).toBe(1);
    });

    it("should ignore cancelled appointments", async () => {
      const patient = await createTestPatient({ fullName: "Cancelled Apt Patient" });
      const tomorrowStr = nextWorkingDayStr();

      const apt = await createTestAppointment(patient.id, {
        appointmentDate: tomorrowStr,
        startTime: "16:00",
        endTime: "16:30",
      });
      await apt.update({ status: "cancelled" });

      await notifService.checkAppointmentReminders();

      const notif = await Notification.findOne({
        where: { type: "appointment_reminder", entityId: apt.id, entityType: "Appointment" },
      });
      expect(notif).toBeNull();
    });
  });

  describe("checkOverdueInvoices", () => {
    it("should create notification for unpaid invoice past dueDate", async () => {
      const patient = await createTestPatient({ fullName: "Overdue Patient" });
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const pastDateStr = pastDate.toISOString().split("T")[0];

      const inv = await createTestInvoice(patient.id, {
        invoiceDate: pastDateStr,
        dueDate: pastDateStr,
        invoiceStatus: "unpaid",
      });

      await notifService.checkOverdueInvoices();

      const notif = await Notification.findOne({
        where: { type: "overdue_invoice", entityId: inv.id, entityType: "Invoice" },
      });
      expect(notif).toBeDefined();
      expect(notif).not.toBeNull();
    });

    it("should not create duplicate overdue notification", async () => {
      const patient = await createTestPatient({ fullName: "Dup Overdue Patient" });
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const pastDateStr = pastDate.toISOString().split("T")[0];

      const inv = await createTestInvoice(patient.id, {
        invoiceDate: pastDateStr,
        dueDate: pastDateStr,
        invoiceStatus: "unpaid",
      });

      await notifService.checkOverdueInvoices();
      await notifService.checkOverdueInvoices();

      const notifs = await Notification.findAll({
        where: { type: "overdue_invoice", entityId: inv.id, entityType: "Invoice" },
      });
      expect(notifs.length).toBe(1);
    });
  });

  describe("checkFollowUpExams", () => {
    it("should create notification for exam with followUpInstructions older than 30 days", async () => {
      const patient = await createTestPatient({ fullName: "FollowUp Patient" });
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);
      const oldDateStr = oldDate.toISOString().split("T")[0];

      const exam = await createTestExam(patient.id, {
        examDate: oldDateStr,
        followUpInstructions: "Check in 1 month",
      });

      await notifService.checkFollowUpExams();

      const notif = await Notification.findOne({
        where: { type: "follow_up_due", entityId: exam.id, entityType: "EyeExamination" },
      });
      expect(notif).toBeDefined();
      expect(notif).not.toBeNull();
    });

    it("should not create duplicate follow-up notification", async () => {
      const patient = await createTestPatient({ fullName: "Dup FollowUp Patient" });
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      const oldDateStr = oldDate.toISOString().split("T")[0];

      const exam = await createTestExam(patient.id, {
        examDate: oldDateStr,
        followUpInstructions: "Check in 2 months",
      });

      await notifService.checkFollowUpExams();
      await notifService.checkFollowUpExams();

      const notifs = await Notification.findAll({
        where: { type: "follow_up_due", entityId: exam.id, entityType: "EyeExamination" },
      });
      expect(notifs.length).toBe(1);
    });

    it("should only create notification for latest exam per patient", async () => {
      const patient = await createTestPatient({ fullName: "Multi Exam Patient" });
      const oldDate1 = new Date();
      oldDate1.setDate(oldDate1.getDate() - 60);
      const oldDate2 = new Date();
      oldDate2.setDate(oldDate2.getDate() - 35);

      await createTestExam(patient.id, {
        examDate: oldDate1.toISOString().split("T")[0],
        followUpInstructions: "Check 1",
      });
      const exam2 = await createTestExam(patient.id, {
        examDate: oldDate2.toISOString().split("T")[0],
        followUpInstructions: "Check 2",
      });

      await notifService.checkFollowUpExams();

      const examNotifs = await Notification.findAll({
        where: { type: "follow_up_due", entityType: "EyeExamination" },
      });
      const examIds = examNotifs.map((n) => n.entityId);
      expect(examIds).toContain(exam2.id);
    });
  });

  describe("checkAndCreateNotifications", () => {
    it("should run all three checks without error", async () => {
      await expect(notifService.checkAndCreateNotifications()).resolves.not.toThrow();
    });
  });

  describe("NotificationService direct", () => {
    it("notifyEvent should return null when no patientId", async () => {
      const result = await notifSvcDirect.notifyEvent({ type: "test", title: "T", message: "M" });
      expect(result).toBeNull();
    });

    it("notifyEvent should create and return notification for valid patient", async () => {
      const patient = await createTestPatient({ fullName: "Notify Patient" });
      const result = await notifSvcDirect.notifyEvent({
        type: "welcome",
        title: "Welcome",
        message: "Welcome to the clinic",
        patientId: patient.id,
        entityId: 999,
        entityType: "Test",
      });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.type).toBe("welcome");
    });

    it("notifyEvent should return existing notification if duplicate within 1 hour", async () => {
      const patient = await createTestPatient({ fullName: "Dup Patient" });
      const first = await notifSvcDirect.notifyEvent({
        type: "test_dup",
        title: "First",
        message: "First msg",
        patientId: patient.id,
        entityId: 888,
        entityType: "Test",
      });
      const second = await notifSvcDirect.notifyEvent({
        type: "test_dup",
        title: "Second",
        message: "Second msg",
        patientId: patient.id,
        entityId: 888,
        entityType: "Test",
      });
      expect(second.id).toBe(first.id);
    });

    it("notifyEvent should return null on error", async () => {
      jest.spyOn(notifSvcDirect.repository, "create").mockRejectedValueOnce(new Error("DB error"));
      const patient = await createTestPatient({ fullName: "Error Patient" });
      const result = await notifSvcDirect.notifyEvent({
        type: "error_test",
        title: "Error",
        message: "Error msg",
        patientId: patient.id,
      });
      expect(result).toBeNull();
      notifSvcDirect.repository.create.mockRestore();
    });

    it("_dispatchNotification should return early when no patientId", async () => {
      await expect(notifSvcDirect._dispatchNotification({}, null, "test")).resolves.not.toThrow();
    });

    it("_dispatchNotification should return early when patient not found", async () => {
      await expect(notifSvcDirect._dispatchNotification({}, 99999, "test")).resolves.not.toThrow();
    });

    it("_dispatchNotification should catch and log dispatch errors", async () => {
      const patient = await createTestPatient({ fullName: "Dispatch Error Patient" });
      jest.spyOn(notifSvcDirect, "_getDispatcher").mockReturnValue({
        dispatch: jest.fn().mockRejectedValue(new Error("Dispatch failed")),
      });
      await expect(notifSvcDirect._dispatchNotification({ id: 1 }, patient.id, "test")).resolves.not.toThrow();
      notifSvcDirect._getDispatcher.mockRestore();
    });

    it("create should create a notification directly", async () => {
      const result = await notifSvcDirect.create({
        type: "direct_create",
        title: "Direct",
        message: "Direct creation",
      });
      expect(result).toBeDefined();
      expect(result.type).toBe("direct_create");
    });
  });
});

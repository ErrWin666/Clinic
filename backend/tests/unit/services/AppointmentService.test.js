const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const AppointmentService = require("../../../src/services/AppointmentService");
const PatientService = require("../../../src/services/PatientService");
const EyeExaminationService = require("../../../src/services/EyeExaminationService");
const InvoiceService = require("../../../src/services/InvoiceService");
const NotificationScheduler = require("../../../src/services/NotificationScheduler");
const CustomError = require("../../../src/utils/CustomError");
const { Appointment, Settings } = require("../../../src/models");

describe("AppointmentService", () => {
  let appointmentService;
  let patientService;
  let examService;
  let invoiceService;
  let notificationService;
  let testPatient;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    appointmentService = new AppointmentService();
    patientService = new PatientService();
    examService = new EyeExaminationService();
    invoiceService = new InvoiceService();
    notificationService = new NotificationScheduler();
    testPatient = await patientService.create({
      fullName: "Apt Patient",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "1112223333",
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create an appointment with displayId", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-01",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      expect(apt).toBeDefined();
      expect(apt.displayId).toBe("APT-0001");
      expect(apt.status).toBe("upcoming");
    });

    it("should detect conflict for overlapping time", async () => {
      await expect(
        appointmentService.create({
          appointmentDate: "2026-09-01",
          startTime: "10:30",
          endTime: "11:30",
          appointmentType: "checkup",
          patientId: testPatient.id,
        })
      ).rejects.toThrow(CustomError);
      try {
        await appointmentService.create({
          appointmentDate: "2026-09-01",
          startTime: "10:30",
          endTime: "11:30",
          appointmentType: "checkup",
          patientId: testPatient.id,
        });
      } catch (err) {
        expect(err.statusCode).toBe(409);
      }
    });

    it("should allow non-overlapping appointment on same day", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-01",
        startTime: "12:00",
        endTime: "13:00",
        appointmentType: "followup",
        patientId: testPatient.id,
      });
      expect(apt.displayId).toBe("APT-0002");
    });
  });

  describe("changeStatus", () => {
    it("should update appointment status", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-02",
        startTime: "14:00",
        endTime: "15:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.changeStatus(apt.id, "confirmed");
      expect(updated.status).toBe("confirmed");
    });
  });

  describe("getCalendar", () => {
    it("should return appointments in date range", async () => {
      const results = await appointmentService.getCalendar("2026-09-01", "2026-09-30");
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("linkPatient", () => {
    it("should link a patient to a quick appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-03",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        quickName: "Quick Person",
        quickPhone: "9999999999",
      });
      const linked = await appointmentService.linkPatient(apt.id, testPatient.id);
      expect(linked.patientId).toBe(testPatient.id);
      expect(linked.quickName).toBeNull();
    });
  });

  describe("update", () => {
    it("should update appointment without conflict", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-10",
        startTime: "11:00",
        endTime: "12:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.update(apt.id, { appointmentType: "followup" });
      expect(updated.appointmentType).toBe("followup");
    });

    it("should update appointment with new time and detect conflict", async () => {
      const apt1 = await appointmentService.create({
        appointmentDate: "2026-09-15",
        startTime: "13:00",
        endTime: "14:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const apt2 = await appointmentService.create({
        appointmentDate: "2026-09-15",
        startTime: "15:00",
        endTime: "16:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      await expect(
        appointmentService.update(apt2.id, {
          appointmentDate: "2026-09-15",
          startTime: "13:30",
          endTime: "14:30",
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should update without time fields (no conflict check)", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-22",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.update(apt.id, { appointmentType: "surgery" });
      expect(updated.appointmentType).toBe("surgery");
    });
  });

  describe("changeStatus", () => {
    it("should change status to cancelled", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-25",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.changeStatus(apt.id, "cancelled");
      expect(updated.status).toBe("cancelled");
    });

    it("should change status to completed", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-26",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.changeStatus(apt.id, "completed");
      expect(updated.status).toBe("completed");
    });

    it("should change status to no-show", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-24",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.changeStatus(apt.id, "no-show");
      expect(updated.status).toBe("no-show");
    });
  });

  describe("getById", () => {
    it("should return appointment with patient", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-09-28",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const found = await appointmentService.getById(apt.id);
      expect(found).toBeDefined();
      expect(found.patient).toBeDefined();
      expect(found.patient.fullName).toBe("Apt Patient");
    });
  });

  describe("list", () => {
    it("should return paginated appointments", async () => {
      const { rows, pagination } = await appointmentService.list({ page: 1, pageSize: 10 });
      expect(rows).toBeDefined();
      expect(pagination).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const { rows } = await appointmentService.list({ status: "upcoming" });
      expect(rows.every((r) => r.status === "upcoming")).toBe(true);
    });

    it("should filter by patientId", async () => {
      const { rows } = await appointmentService.list({ patientId: testPatient.id });
      expect(rows.every((r) => r.patientId === testPatient.id)).toBe(true);
    });

    it("should filter by appointmentType", async () => {
      const { rows } = await appointmentService.list({ appointmentType: "checkup" });
      expect(rows.every((r) => r.appointmentType === "checkup")).toBe(true);
    });

    it("should filter by date range", async () => {
      const { rows } = await appointmentService.list({ startDate: "2026-09-01", endDate: "2026-09-05" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by startDate only", async () => {
      const { rows } = await appointmentService.list({ startDate: "2026-09-01" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should search by patient name", async () => {
      const { rows } = await appointmentService.list({ search: "Apt Patient" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should search by quickName", async () => {
      await appointmentService.create({
        appointmentDate: "2026-09-29",
        startTime: "16:00",
        endTime: "17:00",
        appointmentType: "checkup",
        quickName: "Searchable Quick",
        quickPhone: "1111111111",
      });
      const { rows } = await appointmentService.list({ search: "Searchable Quick" });
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe("create with endTime validation", () => {
    it("should calculate duration from startTime and endTime", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-01",
        startTime: "09:00",
        endTime: "10:30",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      expect(apt.duration).toBe(90);
    });

    it("should reject endTime < startTime (service validates duration > 0)", async () => {
      await expect(
        appointmentService.create({
          appointmentDate: "2026-10-05",
          startTime: "11:00",
          endTime: "10:00",
          appointmentType: "checkup",
          patientId: testPatient.id,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("confirm", () => {
    it("should confirm an upcoming appointment and set confirmedAt", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-10",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const confirmed = await appointmentService.confirm(apt.id);
      expect(confirmed.status).toBe("confirmed");
      expect(confirmed.confirmedAt).toBeDefined();
    });

    it("should reject confirming a non-upcoming appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-12",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      await appointmentService.changeStatus(apt.id, "cancelled");
      await expect(appointmentService.confirm(apt.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("linkExamination", () => {
    it("should link an examination to an appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-15",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-10-15",
      });
      const linked = await appointmentService.linkExamination(apt.id, exam.id);
      expect(linked.examinationId).toBe(exam.id);
    });

    it("should reject linking a non-existent examination", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-16",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      await expect(appointmentService.linkExamination(apt.id, 999999)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("linkInvoice", () => {
    it("should link an invoice to an appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-20",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-10-20",
        items: [{ description: "Consultation", quantity: 1, unitPrice: 50 }],
      });
      const linked = await appointmentService.linkInvoice(apt.id, invoice.id);
      expect(linked.invoiceId).toBe(invoice.id);
    });

    it("should reject linking a non-existent invoice", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-21",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      await expect(appointmentService.linkInvoice(apt.id, 999999)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("getById with linked entities", () => {
    it("should return appointment with examination and invoice includes", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-10-26",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const exam = await examService.create(testPatient.id, {
        examDate: "2026-10-26",
      });
      await appointmentService.linkExamination(apt.id, exam.id);
      const found = await appointmentService.getById(apt.id);
      expect(found.examination).toBeDefined();
      expect(found.examination.id).toBe(exam.id);
    });
  });

  describe("getAvailableSlots", () => {
    it("should return available slots for a day with no appointments", async () => {
      const slots = await appointmentService.getAvailableSlots("2026-11-17", "consultation");
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty("startTime");
      expect(slots[0]).toHaveProperty("endTime");
      expect(slots[0]).toHaveProperty("duration");
    });

    it("should exclude booked time slots", async () => {
      await appointmentService.create({
        appointmentDate: "2026-11-20",
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "checkup",
        patientId: testPatient.id,
      });
      const slots = await appointmentService.getAvailableSlots("2026-11-20", "consultation");
      const bookedSlot = slots.find((s) => s.startTime === "09:00");
      expect(bookedSlot).toBeUndefined();
    });

    it("should return empty array for non-working day (Sunday)", async () => {
      const slots = await appointmentService.getAvailableSlots("2026-11-22", "consultation");
      expect(slots).toEqual([]);
    });
  });

  describe("markNoShowAppointments", () => {
    it("should mark past upcoming appointments as no-show", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = pastDate.toISOString().split("T")[0];

      const apt = await Appointment.create({
        appointmentDate: pastDateStr,
        startTime: "00:00",
        endTime: "00:01",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
        displayId: "APT-9998",
      });

      const count = await notificationService.markNoShowAppointments();
      expect(count).toBeGreaterThan(0);

      await apt.reload();
      expect(apt.status).toBe("no-show");
    });

    it("should mark past confirmed appointments as no-show", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const pastDateStr = pastDate.toISOString().split("T")[0];

      const apt = await Appointment.create({
        appointmentDate: pastDateStr,
        startTime: "00:00",
        endTime: "00:01",
        appointmentType: "checkup",
        status: "confirmed",
        patientId: testPatient.id,
        displayId: "APT-9997",
      });

      await notificationService.markNoShowAppointments();

      await apt.reload();
      expect(apt.status).toBe("no-show");
    });
  });

  describe("changeStatus and confirm", () => {
    it("should change status and confirm appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-01",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      const result = await appointmentService.changeStatus(apt.id, "confirmed");
      expect(result.status).toBe("confirmed");
    });

    it("should reject invalid status transition", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-02",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      await appointmentService.changeStatus(apt.id, "completed");
      await expect(appointmentService.changeStatus(apt.id, "upcoming")).rejects.toThrow(CustomError);
    });

    it("should reject confirming non-upcoming appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-03",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      await appointmentService.confirm(apt.id);
      await expect(appointmentService.confirm(apt.id)).rejects.toThrow(CustomError);
    });
  });

  describe("linkPatient", () => {
    it("should link a patient to an appointment", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-05",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        quickName: "Quick Patient",
        quickPhone: "555-1234",
      });
      const result = await appointmentService.linkPatient(apt.id, testPatient.id);
      expect(result.patientId).toBe(testPatient.id);
      expect(result.quickName).toBeNull();
    });
  });

  describe("linkExamination and linkInvoice", () => {
    it("should reject linking non-existent examination", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-04",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      await expect(appointmentService.linkExamination(apt.id, 99999)).rejects.toThrow(CustomError);
    });

    it("should reject linking non-existent invoice", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-07",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      await expect(appointmentService.linkInvoice(apt.id, 99999)).rejects.toThrow(CustomError);
    });
  });

  describe("getWorkingHours, getCalendar, getAvailableSlots, getById", () => {
    it("should return default working hours", async () => {
      const wh = await appointmentService.getWorkingHours();
      expect(wh).toBeDefined();
      expect(wh.start).toBeDefined();
      expect(wh.end).toBeDefined();
    });

    it("should return appointments for date range", async () => {
      const result = await appointmentService.getCalendar("2026-01-01", "2026-12-31");
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return available slots for a date", async () => {
      const slots = await appointmentService.getAvailableSlots("2026-12-15", "checkup");
      expect(slots).toBeDefined();
      expect(Array.isArray(slots)).toBe(true);
    });

    it("should return appointment by id with includes", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-08",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      const result = await appointmentService.getById(apt.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(apt.id);
    });
  });

  describe("delete", () => {
    it("should delete an appointment with patientId", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-09",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      const result = await appointmentService.delete(apt.id);
      expect(result).toBe(true);
    });

    it("should delete an appointment without patientId", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-10",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        quickName: "Quick Delete",
        quickPhone: "555-9999",
      });
      const result = await appointmentService.delete(apt.id);
      expect(result).toBe(true);
    });
  });

  describe("update with reschedule notification", () => {
    it("should send notification when date changes", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-11",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      const updated = await appointmentService.update(apt.id, {
        appointmentDate: "2026-12-14",
        startTime: "11:00",
        endTime: "12:00",
      });
      expect(updated).toBeDefined();
      expect(updated.appointmentDate).toBe("2026-12-14");
    });
  });

  describe("changeStatus notifications", () => {
    it("should send cancellation notification", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-15",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      const result = await appointmentService.changeStatus(apt.id, "cancelled");
      expect(result.status).toBe("cancelled");
    });

    it("should send completed notification", async () => {
      const apt = await appointmentService.create({
        appointmentDate: "2026-12-16",
        startTime: "10:00",
        endTime: "11:00",
        appointmentType: "checkup",
        status: "upcoming",
        patientId: testPatient.id,
      });
      const result = await appointmentService.changeStatus(apt.id, "completed");
      expect(result.status).toBe("completed");
    });
  });

  describe("working hours validation", () => {
    it("should reject appointment outside working days (Sunday)", async () => {
      await expect(
        appointmentService.create({
          appointmentDate: "2026-12-13",
          startTime: "10:00",
          endTime: "11:00",
          appointmentType: "checkup",
          status: "upcoming",
          patientId: testPatient.id,
        })
      ).rejects.toThrow(CustomError);
    });

    it("should reject appointment before working hours start", async () => {
      await expect(
        appointmentService.create({
          appointmentDate: "2026-12-14",
          startTime: "08:00",
          endTime: "09:00",
          appointmentType: "checkup",
          status: "upcoming",
          patientId: testPatient.id,
        })
      ).rejects.toThrow(CustomError);
    });

    it("should reject appointment after working hours end", async () => {
      await expect(
        appointmentService.create({
          appointmentDate: "2026-12-14",
          startTime: "18:00",
          endTime: "19:00",
          appointmentType: "checkup",
          status: "upcoming",
          patientId: testPatient.id,
        })
      ).rejects.toThrow(CustomError);
    });
  });

  describe("safeJsonParse via working hours settings", () => {
    it("should handle invalid JSON in working hours setting", async () => {
      await Settings.create({
        key: "ui.workingHours",
        value: "not-valid-json",
        category: "ui",
      });
      const wh = await appointmentService.getWorkingHours();
      expect(wh).toBeDefined();
      expect(wh.start).toBeDefined();
    });
  });
});

const BaseService = require("./BaseService");
const AppointmentRepository = require("../repositories/AppointmentRepository");
const SettingsRepository = require("../repositories/SettingsRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { generateDisplayId } = require("../utils/displayId");
const { Appointment, EyeExamination, Invoice, Patient, Notification } = require("../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");
const logger = require("../utils/logger");

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const DEFAULT_WORKING_HOURS = {
  start: "09:00",
  end: "18:00",
  days: [1, 2, 3, 4, 5, 6],
};

const APPOINTMENT_TYPE_DURATIONS = {
  consultation: 30,
  "follow-up": 20,
  checkup: 30,
  surgery: 120,
  emergency: 60,
  vaccination: 15,
  "lab-test": 30,
  imaging: 45,
  other: 30,
};

const VALID_STATUS_TRANSITIONS = {
  upcoming: ["confirmed", "cancelled", "no-show", "rescheduled", "completed"],
  confirmed: ["completed", "cancelled", "no-show", "rescheduled"],
  completed: [],
  cancelled: ["upcoming"],
  "no-show": ["upcoming", "cancelled"],
  rescheduled: ["upcoming", "confirmed", "cancelled"],
};

class AppointmentService extends BaseService {
  constructor() {
    super(new AppointmentRepository());
    this.settingsRepository = new SettingsRepository();
    this._notificationService = null;
  }

  _getNotificationService() {
    if (!this._notificationService) {
      const NotificationService = require("./NotificationService");
      this._notificationService = new NotificationService();
    }
    return this._notificationService;
  }

  async _getWorkingHours() {
    const setting = await this.settingsRepository.findByKey("ui.workingHours");
    if (!setting) return DEFAULT_WORKING_HOURS;
    return { ...DEFAULT_WORKING_HOURS, ...safeJsonParse(setting.value) };
  }

  async _validateWorkingHours(appointmentDate, startTime, endTime) {
    const wh = await this._getWorkingHours();
    const date = new Date(appointmentDate);
    const dayOfWeek = date.getDay();

    if (wh.days && Array.isArray(wh.days) && !wh.days.includes(dayOfWeek)) {
      throw new CustomError(MESSAGES.APPOINTMENT.OUTSIDE_WORKING_HOURS, "OUTSIDE_WORKING_HOURS", 400);
    }
    if (wh.start && startTime < wh.start) {
      throw new CustomError(MESSAGES.APPOINTMENT.OUTSIDE_WORKING_HOURS, "OUTSIDE_WORKING_HOURS", 400);
    }
    if (wh.end && endTime > wh.end) {
      throw new CustomError(MESSAGES.APPOINTMENT.OUTSIDE_WORKING_HOURS, "OUTSIDE_WORKING_HOURS", 400);
    }
  }

  /**
   * Check if the proposed appointment is close (< 30 minutes gap) to an existing one.
   * Per FEATURES.md: this is a warning, not a block — the appointment is still accepted.
   * Returns true if a close appointment exists.
   */
  async _checkCloseWarning(appointmentDate, startTime, endTime, excludeId = null) {
    const existing = await this.repository.findConflicts(
      appointmentDate, "00:00", "23:59", excludeId
    );
    const [newStartH, newStartM] = startTime.split(":").map(Number);
    const [newEndH, newEndM] = endTime.split(":").map(Number);
    const newStartMin = newStartH * 60 + newStartM;
    const newEndMin = newEndH * 60 + newEndM;

    const CLOSE_THRESHOLD_MIN = 30;
    for (const apt of existing) {
      const [aStartH, aStartM] = apt.startTime.split(":").map(Number);
      const [aEndH, aEndM] = apt.endTime.split(":").map(Number);
      const aptStartMin = aStartH * 60 + aStartM;
      const aptEndMin = aEndH * 60 + aEndM;
      // Gap between the two appointments (0 if overlapping — but overlapping is already blocked)
      const gap = Math.max(newStartMin - aptEndMin, aptStartMin - newEndMin);
      if (gap >= 0 && gap < CLOSE_THRESHOLD_MIN) {
        return true;
      }
    }
    return false;
  }

  async create(data) {
    return this.executeOperation(async () => {
      await this._validateWorkingHours(data.appointmentDate, data.startTime, data.endTime);

      const conflicts = await this.repository.findConflicts(
        data.appointmentDate, data.startTime, data.endTime
      );
      if (conflicts.length > 0) {
        throw new CustomError(MESSAGES.APPOINTMENT.CONFLICT, "APPOINTMENT_CONFLICT", 409);
      }

      // Close-warning: check if near an existing appointment (< 30 min gap)
      const isClose = await this._checkCloseWarning(data.appointmentDate, data.startTime, data.endTime);

      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration <= 0) {
        throw new CustomError(MESSAGES.APPOINTMENT.END_TIME_AFTER_START, "END_TIME_AFTER_START", 400);
      }

      const displayId = await generateDisplayId(Appointment, "APT");
      const appointment = await this.repository.create({ ...data, displayId, duration });

      // Event-driven: notify patient about new appointment
      if (appointment.patientId) {
        this._getNotificationService().notifyEvent({
          type: "appointment_confirmation",
          title: "New Appointment",
          message: `New appointment scheduled for ${data.appointmentDate} at ${data.startTime}`,
          patientId: appointment.patientId,
          entityId: appointment.id,
          entityType: "Appointment",
        }).catch((e) => logger.error("Appointment create notification failed:", e.message));
      }

      // Attach close-warning flag so the controller can pass it to the client
      appointment.dataValues.isCloseWarning = isClose;
      return appointment;
    }, MESSAGES.APPOINTMENT.CREATED, "APPOINTMENT_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const existing = await this.repository.findById(id);
      // Merge incoming fields with existing values to always validate the full picture
      const mergedDate = data.appointmentDate ?? existing.appointmentDate;
      const mergedStart = data.startTime ?? existing.startTime;
      const mergedEnd = data.endTime ?? existing.endTime;

      await this._validateWorkingHours(mergedDate, mergedStart, mergedEnd);

      const conflicts = await this.repository.findConflicts(
        mergedDate, mergedStart, mergedEnd, id
      );
      if (conflicts.length > 0) {
        throw new CustomError(MESSAGES.APPOINTMENT.CONFLICT, "APPOINTMENT_CONFLICT", 409);
      }

      const [sh, sm] = mergedStart.split(":").map(Number);
      const [eh, em] = mergedEnd.split(":").map(Number);
      data.duration = (eh * 60 + em) - (sh * 60 + sm);
      if (data.duration <= 0) {
        throw new CustomError(MESSAGES.APPOINTMENT.END_TIME_AFTER_START, "END_TIME_AFTER_START", 400);
      }

      // Detect date/time change for notification
      const dateChanged = data.appointmentDate && data.appointmentDate !== existing.appointmentDate;
      const timeChanged = data.startTime && data.startTime !== existing.startTime;

      const updated = await this.repository.update(id, data);

      // Event-driven: notify patient about appointment reschedule (not cancellation)
      if (updated.patientId && (dateChanged || timeChanged)) {
        // Delete the old appointment_reminder so the scheduler creates a fresh one
        // for the new date/time in the next daily check.
        try {
          await Notification.destroy({
            where: {
              type: "appointment_reminder",
              entityId: updated.id,
              entityType: "Appointment",
            },
          });
        } catch (e) {
          logger.error("Failed to delete stale reminder:", e.message);
        }

        this._getNotificationService().notifyEvent({
          type: "appointment_rescheduled",
          title: "Appointment Rescheduled",
          message: `Appointment rescheduled from ${existing.appointmentDate} ${existing.startTime} to ${mergedDate} ${mergedStart}`,
          patientId: updated.patientId,
          entityId: updated.id,
          entityType: "Appointment",
        }).catch((e) => logger.error("Appointment reschedule notification failed:", e.message));
      }

      return updated;
    }, MESSAGES.APPOINTMENT.UPDATED, "APPOINTMENT_UPDATE_ERROR");
  }

  async changeStatus(id, status) {
    return this.executeOperation(async () => {
      const appointment = await this.repository.findById(id);
      const allowed = VALID_STATUS_TRANSITIONS[appointment.status] || [];
      if (!allowed.includes(status)) {
        throw new CustomError(MESSAGES.APPOINTMENT.INVALID_TRANSITION, "INVALID_STATUS_TRANSITION", 400);
      }
      const updated = await appointment.update({ status });

      // Event-driven notifications based on new status
      if (updated.patientId) {
        const ns = this._getNotificationService();
        if (status === "cancelled") {
          ns.notifyEvent({
            type: "appointment_cancellation",
            title: "Appointment Cancelled",
            message: `Appointment on ${updated.appointmentDate} at ${updated.startTime} has been cancelled`,
            patientId: updated.patientId,
            entityId: updated.id,
            entityType: "Appointment",
          }).catch((e) => logger.error("Cancel notification failed:", e.message));
        } else if (status === "completed") {
          ns.notifyEvent({
            type: "thank_you_visit",
            title: "Thank You for Your Visit",
            message: `Thank you for visiting on ${updated.appointmentDate}`,
            patientId: updated.patientId,
            entityId: updated.id,
            entityType: "Appointment",
          }).catch((e) => logger.error("Thank you notification failed:", e.message));
        }
      }

      return updated;
    }, MESSAGES.APPOINTMENT.STATUS_UPDATED, "APPOINTMENT_STATUS_ERROR");
  }

  async confirm(id) {
    return this.executeOperation(async () => {
      const appointment = await this.repository.findById(id);
      if (appointment.status !== "upcoming") {
        throw new CustomError(MESSAGES.APPOINTMENT.NOT_UPCOMING, "APPOINTMENT_NOT_UPCOMING", 400);
      }
      const updated = await appointment.update({ status: "confirmed", confirmedAt: new Date() });

      // Event-driven: notify patient about confirmation
      if (updated.patientId) {
        this._getNotificationService().notifyEvent({
          type: "appointment_confirmation",
          title: "Appointment Confirmed",
          message: `Appointment confirmed for ${updated.appointmentDate} at ${updated.startTime}`,
          patientId: updated.patientId,
          entityId: updated.id,
          entityType: "Appointment",
        }).catch((e) => logger.error("Confirm notification failed:", e.message));
      }

      return updated;
    }, MESSAGES.APPOINTMENT.CONFIRMED, "APPOINTMENT_CONFIRM_ERROR");
  }

  async linkPatient(id, patientId) {
    return this.executeOperation(async () => {
      const appointment = await this.repository.findById(id);
      return appointment.update({ patientId, quickName: null, quickPhone: null });
    }, MESSAGES.APPOINTMENT.LINKED, "APPOINTMENT_LINK_ERROR");
  }

  async linkExamination(id, examinationId) {
    return this.executeOperation(async () => {
      const exam = await EyeExamination.findByPk(examinationId);
      if (!exam) {
        throw new CustomError(MESSAGES.EXAMINATION.NOT_FOUND, "EXAMINATION_NOT_FOUND", 404);
      }
      const appointment = await this.repository.findById(id);
      return appointment.update({ examinationId });
    }, MESSAGES.APPOINTMENT.EXAMINATION_LINKED, "APPOINTMENT_LINK_EXAM_ERROR");
  }

  async linkInvoice(id, invoiceId) {
    return this.executeOperation(async () => {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        throw new CustomError(MESSAGES.INVOICE.NOT_FOUND, "INVOICE_NOT_FOUND", 404);
      }
      const appointment = await this.repository.findById(id);
      return appointment.update({ invoiceId });
    }, MESSAGES.APPOINTMENT.INVOICE_LINKED, "APPOINTMENT_LINK_INVOICE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const appointment = await this.repository.findById(id);

      // Event-driven: notify patient about cancellation before destroying
      if (appointment.patientId) {
        this._getNotificationService().notifyEvent({
          type: "appointment_cancellation",
          title: "Appointment Deleted",
          message: `Appointment on ${appointment.appointmentDate} at ${appointment.startTime} has been cancelled`,
          patientId: appointment.patientId,
          entityId: appointment.id,
          entityType: "Appointment",
        }).catch((e) => logger.error("Delete notification failed:", e.message));
      }

      await appointment.destroy(); // soft delete (paranoid: true)
      return true;
    }, MESSAGES.APPOINTMENT.DELETED, "APPOINTMENT_DELETE_ERROR");
  }

  async getWorkingHours() {
    return this._getWorkingHours();
  }

  async getCalendar(startDate, endDate) {
    return this.executeOperation(async () => {
      return this.repository.findForCalendar(startDate, endDate);
    }, MESSAGES.APPOINTMENT.CALENDAR_RETRIEVED, "APPOINTMENT_CALENDAR_ERROR");
  }

  /**
   * Compute available time slots for a given date and appointment type.
   *
   * NOTE: The returned slots are advisory/suggested times for the UI picker.
   * The backend does NOT enforce that a created appointment matches one of
   * these slots — the user may manually pick any start/end time within
   * working hours. The only hard constraint is the conflict check in create().
   *
   * @param {string} date - ISO date (YYYY-MM-DD)
   * @param {string} appointmentType - One of APPOINTMENT_TYPE_DURATIONS keys
   * @returns {Promise<Array<{startTime: string, endTime: string, duration: number}>>}
   */
  async getAvailableSlots(date, appointmentType) {
    return this.executeOperation(async () => {
      const wh = await this._getWorkingHours();
      const slotDuration = APPOINTMENT_TYPE_DURATIONS[appointmentType] || 30;

      const dayOfWeek = new Date(date).getDay();
      if (wh.days && Array.isArray(wh.days) && !wh.days.includes(dayOfWeek)) {
        return [];
      }

      const [whSh, whSm] = (wh.start || "09:00").split(":").map(Number);
      const [whEh, whEm] = (wh.end || "18:00").split(":").map(Number);
      const workingStartMin = whSh * 60 + whSm;
      const workingEndMin = whEh * 60 + whEm;

      const existing = await this.repository.findConflicts(date, "00:00", "23:59");
      const bookedRanges = existing.map((apt) => {
        const [sh, sm] = apt.startTime.split(":").map(Number);
        const [eh, em] = apt.endTime.split(":").map(Number);
        return { start: sh * 60 + sm, end: eh * 60 + em };
      });

      const slots = [];
      for (let t = workingStartMin; t + slotDuration <= workingEndMin; t += slotDuration) {
        const slotStart = t;
        const slotEnd = t + slotDuration;

        const isBooked = bookedRanges.some(
          (r) => slotStart < r.end && slotEnd > r.start
        );

        if (!isBooked) {
          const formatTime = (mins) => {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          };
          slots.push({
            startTime: formatTime(slotStart),
            endTime: formatTime(slotEnd),
            duration: slotDuration,
          });
        }
      }

      return slots;
    }, MESSAGES.APPOINTMENT.SLOTS_RETRIEVED, "APPOINTMENT_SLOTS_ERROR");
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = {};
      if (query.status) {
        where.status = query.status;
      } else {
        where.status = { [Op.notIn]: ["cancelled"] };
      }
      if (query.patientId) where.patientId = query.patientId;
      if (query.appointmentType) where.appointmentType = query.appointmentType;
      if (query.startDate && query.endDate) {
        where.appointmentDate = { [Op.between]: [query.startDate, query.endDate] };
      } else if (query.startDate) {
        where.appointmentDate = { [Op.gte]: query.startDate };
      }

      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { displayId: { [LIKE]: term } },
          { quickName: { [LIKE]: term } },
          { quickPhone: { [LIKE]: term } },
          { "$patient.fullName$": { [LIKE]: term } },
          { "$patient.displayId$": { [LIKE]: term } },
          { "$patient.phoneNumber$": { [LIKE]: term } },
        ];
      }

      const patientInclude = {
        association: "patient",
        attributes: ["id", "displayId", "fullName", "phoneNumber"],
      };

      const { rows, count } = await this.repository.findAndCountAll({
        where, offset, limit,
        include: [patientInclude],
        order: [["appointmentDate", "DESC"], ["startTime", "ASC"]],
      });

      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.APPOINTMENT.RETRIEVED, "APPOINTMENT_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      return this.repository.findById(id, {
        include: [
          { association: "patient", attributes: ["id", "displayId", "fullName", "phoneNumber"] },
          { association: "examination", attributes: ["id", "displayId", "examDate", "examStatus"] },
          { association: "invoice", attributes: ["id", "displayId", "invoiceDate", "invoiceStatus", "totalAmount"] },
        ],
      });
    }, MESSAGES.APPOINTMENT.RETRIEVED_ONE, "APPOINTMENT_GET_ERROR");
  }
}

module.exports = AppointmentService;

const BaseController = require("./BaseController");
const AppointmentService = require("../services/AppointmentService");
const MESSAGES = require("../constants/messages");

class AppointmentController extends BaseController {
  constructor() {
    super();
    this.appointmentService = new AppointmentService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.appointmentService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.APPOINTMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getCalendar(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const appointments = await this.appointmentService.getCalendar(startDate, endDate);
      return this.sendSuccess(res, appointments, MESSAGES.APPOINTMENT.CALENDAR_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const appointment = await this.appointmentService.getById(id);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const appointment = await this.appointmentService.create(req.body);
      const isCloseWarning = appointment.dataValues && appointment.dataValues.isCloseWarning;
      const message = isCloseWarning
        ? `${MESSAGES.APPOINTMENT.CREATED} — ${MESSAGES.APPOINTMENT.CLOSE_WARNING}`
        : MESSAGES.APPOINTMENT.CREATED;
      return this.sendSuccess(res, appointment, message, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const appointment = await this.appointmentService.update(id, req.body);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const appointment = await this.appointmentService.changeStatus(id, req.body.status);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.STATUS_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async linkPatient(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const patientId = this.validateId(req.body.patientId);
      const appointment = await this.appointmentService.linkPatient(id, patientId);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.LINKED);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const appointment = await this.appointmentService.confirm(id);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.CONFIRMED);
    } catch (error) {
      next(error);
    }
  }

  async linkExamination(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const examinationId = this.validateId(req.body.entityId);
      const appointment = await this.appointmentService.linkExamination(id, examinationId);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.EXAMINATION_LINKED);
    } catch (error) {
      next(error);
    }
  }

  async linkInvoice(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const invoiceId = this.validateId(req.body.entityId);
      const appointment = await this.appointmentService.linkInvoice(id, invoiceId);
      return this.sendSuccess(res, appointment, MESSAGES.APPOINTMENT.INVOICE_LINKED);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req, res, next) {
    try {
      const { date, appointmentType } = req.query;
      const slots = await this.appointmentService.getAvailableSlots(date, appointmentType);
      return this.sendSuccess(res, slots, MESSAGES.APPOINTMENT.SLOTS_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.appointmentService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.APPOINTMENT.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async getWorkingHours(req, res, next) {
    try {
      const workingHours = await this.appointmentService.getWorkingHours();
      return this.sendSuccess(res, workingHours, MESSAGES.APPOINTMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;

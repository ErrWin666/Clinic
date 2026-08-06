const Joi = require("joi");
const ENUMS = require("../constants/enums");

const createAppointmentSchema = Joi.object({
  body: Joi.object({
    appointmentDate: Joi.date().iso().required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    appointmentType: Joi.string().min(2).max(50).required(),
    reason: Joi.string().max(500).allow(null, ""),
    notes: Joi.string().allow(null, ""),
    patientId: Joi.number().integer().positive().allow(null),
    quickName: Joi.string().max(200).allow(null, ""),
    quickPhone: Joi.string().max(30).allow(null, ""),
  }).custom((value, helpers) => {
    if (!value.patientId && (!value.quickName || !value.quickPhone)) {
      return helpers.error("any.invalid", { message: "Either patientId or quickName+quickPhone required" });
    }
    const [sh, sm] = value.startTime.split(":").map(Number);
    const [eh, em] = value.endTime.split(":").map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      return helpers.error("any.invalid", { message: "End time must be after start time" });
    }
    return value;
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

const updateAppointmentSchema = Joi.object({
  body: Joi.object({
    appointmentDate: Joi.date().iso(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    appointmentType: Joi.string().min(2).max(50),
    reason: Joi.string().max(500).allow(null, ""),
    notes: Joi.string().allow(null, ""),
    patientId: Joi.number().integer().positive().allow(null),
    quickName: Joi.string().max(200).allow(null, ""),
    quickPhone: Joi.string().max(30).allow(null, ""),
  }).custom((value, helpers) => {
    if (value.startTime && value.endTime) {
      const [sh, sm] = value.startTime.split(":").map(Number);
      const [eh, em] = value.endTime.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) {
        return helpers.error("any.invalid", { message: "End time must be after start time" });
      }
    }
    return value;
  }).min(1),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const statusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid(...ENUMS.APPOINTMENT_STATUS).required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const calendarSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
  params: Joi.object({}),
});

const listAppointmentSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(...ENUMS.APPOINTMENT_STATUS),
    patientId: Joi.number().integer().positive(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    search: Joi.string().allow(""),
    appointmentType: Joi.string().max(50),
  }),
  params: Joi.object({}),
});

const linkEntitySchema = Joi.object({
  body: Joi.object({
    entityId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({}),
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
});

const slotsSchema = Joi.object({
  body: Joi.object({}),
  query: Joi.object({
    date: Joi.date().iso().required(),
    appointmentType: Joi.string().max(50).default("consultation"),
  }),
  params: Joi.object({}),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  statusSchema,
  calendarSchema,
  listAppointmentSchema,
  linkEntitySchema,
  slotsSchema,
};

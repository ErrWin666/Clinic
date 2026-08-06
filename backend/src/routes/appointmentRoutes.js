const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { requirePermission } = require("../middlewares/rbac");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  statusSchema,
  calendarSchema,
  listAppointmentSchema,
  linkEntitySchema,
  slotsSchema,
} = require("../schemas/appointmentSchema");
const { idParamSchema, linkPatientSchema } = require("../schemas/commonSchema");

const appointmentController = new AppointmentController();

router.use(auth);

router.get("/", requirePermission("appointments:read"), validate(listAppointmentSchema), (req, res, next) => appointmentController.list(req, res, next));
router.get("/calendar", requirePermission("appointments:read"), validate(calendarSchema), (req, res, next) => appointmentController.getCalendar(req, res, next));
router.get("/slots", requirePermission("appointments:read"), validate(slotsSchema), (req, res, next) => appointmentController.getAvailableSlots(req, res, next));
router.get("/working-hours", requirePermission("appointments:read"), (req, res, next) => appointmentController.getWorkingHours(req, res, next));
router.get("/:id", requirePermission("appointments:read"), validate(idParamSchema), (req, res, next) => appointmentController.getById(req, res, next));
router.post("/", requirePermission("appointments:write"), validate(createAppointmentSchema), audit("CREATE"), (req, res, next) => appointmentController.create(req, res, next));
router.put("/:id", requirePermission("appointments:write"), validate(updateAppointmentSchema), audit("UPDATE"), (req, res, next) => appointmentController.update(req, res, next));
router.patch("/:id/status", requirePermission("appointments:write"), validate(statusSchema), audit("UPDATE"), (req, res, next) => appointmentController.changeStatus(req, res, next));
router.patch("/:id/confirm", requirePermission("appointments:write"), validate(idParamSchema), audit("UPDATE"), (req, res, next) => appointmentController.confirm(req, res, next));
router.post("/:id/link-patient", requirePermission("appointments:write"), validate(linkPatientSchema), audit("UPDATE"), (req, res, next) => appointmentController.linkPatient(req, res, next));
router.post("/:id/link-examination", requirePermission("appointments:write"), validate(linkEntitySchema), audit("UPDATE"), (req, res, next) => appointmentController.linkExamination(req, res, next));
router.post("/:id/link-invoice", requirePermission("appointments:write"), validate(linkEntitySchema), audit("UPDATE"), (req, res, next) => appointmentController.linkInvoice(req, res, next));
router.delete("/:id", requirePermission("appointments:write"), validate(idParamSchema), audit("DELETE"), (req, res, next) => appointmentController.delete(req, res, next));

module.exports = router;

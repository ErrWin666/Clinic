const BaseService = require("../BaseService");
const { Patient, Appointment, Invoice } = require("../../models");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../../utils/queryHelpers");
const MESSAGES = require("../../constants/messages");

class PatientReportService extends BaseService {
  constructor() {
    super(null);
  }

  async exportPatients(query) {
    return this.executeOperation(async () => {
      const where = {};
      if (query.patientType) where.patientType = query.patientType;
      if (query.gender) where.gender = query.gender;
      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { fullName: { [LIKE]: term } },
          { phoneNumber: { [LIKE]: term } },
          { displayId: { [LIKE]: term } },
        ];
      }
      if (query.startDate && query.endDate) {
        where.createdAt = { [Op.between]: [query.startDate, query.endDate] };
      }

      const patients = await Patient.findAll({
        where,
        order: [["createdAt", "DESC"]],
        attributes: ["displayId", "fullName", "birthDate", "gender", "phoneNumber", "email", "patientType", "createdAt"],
      });

      const headers = ["DisplayID", "Full Name", "Birth Date", "Gender", "Phone", "Email", "Type", "Created At"];
      const rows = patients.map((p) => [
        p.displayId,
        p.fullName,
        p.birthDate,
        p.gender,
        p.phoneNumber,
        p.email || "",
        p.patientType,
        p.createdAt,
      ]);

      return { headers, rows };
    }, MESSAGES.REPORT.PATIENTS_EXPORTED, "REPORT_PATIENTS_ERROR");
  }

  async exportInvoices(query) {
    return this.executeOperation(async () => {
      const where = {};
      if (query.status) where.invoiceStatus = query.status;
      if (query.patientId) where.patientId = query.patientId;
      if (query.startDate && query.endDate) {
        where.invoiceDate = { [Op.between]: [query.startDate, query.endDate] };
      }

      const invoices = await Invoice.findAll({
        where,
        order: [["invoiceDate", "DESC"]],
        include: [{ association: "patient", attributes: ["displayId", "fullName"] }],
        attributes: ["displayId", "invoiceDate", "invoiceStatus", "totalAmount", "taxAmount", "discountAmount", "customerName"],
      });

      const headers = ["DisplayID", "Date", "Patient", "Status", "Total", "Tax", "Discount"];
      const rows = invoices.map((inv) => [
        inv.displayId,
        inv.invoiceDate,
        inv.patient ? inv.patient.fullName : inv.customerName || "",
        inv.invoiceStatus,
        inv.totalAmount,
        inv.taxAmount || 0,
        inv.discountAmount || 0,
      ]);

      return { headers, rows };
    }, MESSAGES.REPORT.INVOICES_EXPORTED, "REPORT_INVOICES_ERROR");
  }

  async exportAppointments(query) {
    return this.executeOperation(async () => {
      const where = {};
      if (query.status) where.status = query.status;
      if (query.patientId) where.patientId = query.patientId;
      if (query.startDate && query.endDate) {
        where.appointmentDate = { [Op.between]: [query.startDate, query.endDate] };
      }

      const appointments = await Appointment.findAll({
        where,
        order: [["appointmentDate", "DESC"], ["startTime", "ASC"]],
        include: [{ association: "patient", attributes: ["displayId", "fullName"] }],
        attributes: ["displayId", "appointmentDate", "startTime", "endTime", "appointmentType", "status", "quickName"],
      });

      const headers = ["DisplayID", "Date", "Start", "End", "Type", "Status", "Patient"];
      const rows = appointments.map((apt) => [
        apt.displayId,
        apt.appointmentDate,
        apt.startTime,
        apt.endTime,
        apt.appointmentType,
        apt.status,
        apt.patient ? apt.patient.fullName : apt.quickName || "",
      ]);

      return { headers, rows };
    }, MESSAGES.REPORT.APPOINTMENTS_EXPORTED, "REPORT_APPOINTMENTS_ERROR");
  }
}

module.exports = PatientReportService;

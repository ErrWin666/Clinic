const BaseService = require("./BaseService");
const PatientRepository = require("../repositories/PatientRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { generateDisplayId } = require("../utils/displayId");
const { Patient } = require("../models");
const { generatePatientSummaryPDF } = require("../utils/pdf");
const logger = require("../utils/logger");

class PatientService extends BaseService {
  constructor() {
    super(new PatientRepository());
    this._notificationService = null;
  }

  _getNotificationService() {
    if (!this._notificationService) {
      const NotificationService = require("./NotificationService");
      this._notificationService = new NotificationService();
    }
    return this._notificationService;
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = {};

      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        const LIKE = likeOp();
        where[Op.or] = [
          { fullName: { [LIKE]: term } },
          { phoneNumber: { [LIKE]: term } },
          { displayId: { [LIKE]: term } },
          { email: { [LIKE]: term } },
        ];
      }
      if (query.patientType) where.patientType = query.patientType;
      if (query.gender) where.gender = query.gender;

      if (query.minAge !== undefined || query.maxAge !== undefined) {
        const now = new Date();
        where.birthDate = {};
        if (query.maxAge !== undefined) {
          const minBirthDate = new Date(now.getFullYear() - query.maxAge, now.getMonth(), now.getDate());
          where.birthDate[Op.gte] = minBirthDate.toISOString().split("T")[0];
        }
        if (query.minAge !== undefined) {
          const maxBirthDate = new Date(now.getFullYear() - query.minAge, now.getMonth(), now.getDate());
          where.birthDate[Op.lte] = maxBirthDate.toISOString().split("T")[0];
        }
      }

      const order = [[query.sortBy || "createdAt", query.sortOrder || "DESC"]];

      const { rows, count } = await this.repository.searchWithFilters({
        where, offset, limit, order,
      });

      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.PATIENT.RETRIEVED, "PATIENT_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const patient = await this.repository.findByIdWithRelations(id);
      if (!patient) {
        throw new CustomError(MESSAGES.PATIENT.NOT_FOUND, "PATIENT_NOT_FOUND", 404);
      }
      return patient;
    }, MESSAGES.PATIENT.RETRIEVED_ONE, "PATIENT_GET_ERROR");
  }

  async create(data) {
    return this.executeOperation(async () => {
      if (data.email) {
        const existing = await this.repository.findByEmail(data.email);
        if (existing) {
          throw new CustomError(MESSAGES.PATIENT.EMAIL_EXISTS, "EMAIL_EXISTS", 409);
        }
      }
      const displayId = await generateDisplayId(Patient, "P");
      const patient = await this.repository.create({ ...data, displayId });

      // Event-driven: send welcome message to new patient
      if (patient.phoneNumber) {
        this._getNotificationService().notifyEvent({
          type: "welcome",
          title: "Welcome",
          message: `Welcome ${patient.fullName} to the clinic`,
          patientId: patient.id,
          entityId: patient.id,
          entityType: "Patient",
        }).catch((e) => logger.error("Patient welcome notification failed:", e.message));
      }

      return patient;
    }, MESSAGES.PATIENT.CREATED, "PATIENT_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      if (data.email) {
        const existing = await this.repository.findByEmail(data.email);
        if (existing && existing.id !== parseInt(id, 10)) {
          throw new CustomError(MESSAGES.PATIENT.EMAIL_EXISTS, "EMAIL_EXISTS", 409);
        }
      }
      return this.repository.update(id, data);
    }, MESSAGES.PATIENT.UPDATED, "PATIENT_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const hasUnpaid = await this.repository.hasUnpaidInvoices(id);
      if (hasUnpaid) {
        throw new CustomError(MESSAGES.PATIENT.HAS_UNPAID_INVOICES, "PATIENT_HAS_UNPAID_INVOICES", 400);
      }
      await this.repository.delete(id);
      return true;
    }, MESSAGES.PATIENT.DELETED, "PATIENT_DELETE_ERROR");
  }

  async autocomplete(searchTerm, limit) {
    return this.executeOperation(async () => {
      return this.repository.autocomplete(searchTerm, limit);
    }, MESSAGES.PATIENT.SEARCH_DONE, "PATIENT_AUTOCOMPLETE_ERROR");
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
        ];
      }
      const patients = await this.repository.findAll({ where, order: [["createdAt", "DESC"]] });
      return patients;
    }, MESSAGES.PATIENT.RETRIEVED, "PATIENT_EXPORT_ERROR");
  }

  async generateSummaryPDF(id, clinicSettings) {
    const patient = await this.getById(id);
    return generatePatientSummaryPDF(patient, clinicSettings);
  }
}

module.exports = PatientService;

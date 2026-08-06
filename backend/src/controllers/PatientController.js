const BaseController = require("./BaseController");
const PatientService = require("../services/PatientService");
const SettingsService = require("../services/SettingsService");
const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");
const { buildCSV, sendCSV } = require("../utils/csvExport");

class PatientController extends BaseController {
  constructor() {
    super();
    this.patientService = new PatientService();
    this.settingsService = new SettingsService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.patientService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.PATIENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const patient = await this.patientService.getById(id);
      return this.sendSuccess(res, patient, MESSAGES.PATIENT.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const patient = await this.patientService.create(req.body);
      return this.sendSuccess(res, patient, MESSAGES.PATIENT.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const patient = await this.patientService.update(id, req.body);
      return this.sendSuccess(res, patient, MESSAGES.PATIENT.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.patientService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.PATIENT.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async autocomplete(req, res, next) {
    try {
      const { q, limit } = req.query;
      const results = await this.patientService.autocomplete(q, parseInt(limit, 10) || 10);
      return this.sendSuccess(res, results, MESSAGES.PATIENT.SEARCH_DONE);
    } catch (error) {
      next(error);
    }
  }

  async export(req, res, next) {
    try {
      const patients = await this.patientService.exportPatients(req.query);
      const headers = ["ID", "DisplayID", "FullName", "BirthDate", "Gender", "Phone", "Email", "Type", "CreatedAt"];
      const rows = patients.map((p) =>
        [p.id, p.displayId, p.fullName, p.birthDate, p.gender, p.phoneNumber, p.email || "", p.patientType, p.createdAt.toISOString()]
      );
      const csv = buildCSV(headers, rows);
      return sendCSV(res, csv, "patients.csv");
    } catch (error) {
      next(error);
    }
  }

  async uploadProfileImage(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      if (!req.file) {
        throw new CustomError("No image file provided", "VALIDATION_ERROR", 400);
      }
      const relativePath = `patients/${id}/${req.file.filename}`;
      const patient = await this.patientService.update(id, { profileImage: relativePath });
      return this.sendSuccess(res, { profileImageUrl: relativePath }, MESSAGES.PATIENT.IMAGE_UPLOADED);
    } catch (error) {
      next(error);
    }
  }

  async deleteProfileImage(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const patient = await this.patientService.getById(id);
      if (patient.profileImage) {
        const { deleteUploadFile } = require("../utils/fileDelete");
        deleteUploadFile(patient.profileImage);
        await this.patientService.update(id, { profileImage: null });
      }
      return this.sendSuccess(res, null, MESSAGES.PATIENT.IMAGE_REMOVED);
    } catch (error) {
      next(error);
    }
  }

  async getSummaryPDF(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const clinicSettings = await this.settingsService.getClinicSettings();
      const doc = await this.patientService.generateSummaryPDF(id, clinicSettings);
      const patient = await this.patientService.getById(id);
      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=patient-summary-${patient.displayId}.pdf`);
      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;

const BaseController = require("./BaseController");
const EyeExaminationService = require("../services/EyeExaminationService");
const SettingsService = require("../services/SettingsService");
const MESSAGES = require("../constants/messages");

class EyeExaminationController extends BaseController {
  constructor() {
    super();
    this.examService = new EyeExaminationService();
    this.settingsService = new SettingsService();
  }

  async listByPatient(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const { rows, pagination } = await this.examService.getByPatientId(patientId, req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.EXAMINATION.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const exam = await this.examService.getById(id);
      return this.sendSuccess(res, exam, MESSAGES.EXAMINATION.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const exam = await this.examService.create(patientId, req.body);
      return this.sendSuccess(res, exam, MESSAGES.EXAMINATION.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const exam = await this.examService.update(id, req.body);
      return this.sendSuccess(res, exam, MESSAGES.EXAMINATION.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async createFollowUp(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const exam = await this.examService.createFollowUp(id);
      return this.sendSuccess(res, exam, MESSAGES.EXAMINATION.FOLLOW_UP_CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async getPDF(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const clinicSettings = await this.settingsService.getClinicSettings();
      const doc = await this.examService.generateExamPDF(id, clinicSettings);
      const exam = await this.examService.getById(id);
      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=examination-${exam.displayId}.pdf`);
      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      next(error);
    }
  }

  async getPrescriptionPDF(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const clinicSettings = await this.settingsService.getClinicSettings();
      const doc = await this.examService.generatePrescriptionPDFDoc(id, clinicSettings);
      const exam = await this.examService.getById(id);
      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=prescription-${exam.displayId}.pdf`);
      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.examService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.EXAMINATION.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async listSimpleByPatient(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const exams = await this.examService.listSimpleByPatient(patientId);
      return this.sendSuccess(res, exams, MESSAGES.EXAMINATION.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EyeExaminationController;

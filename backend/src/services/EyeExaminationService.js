const BaseService = require("./BaseService");
const EyeExaminationRepository = require("../repositories/EyeExaminationRepository");
const PatientRepository = require("../repositories/PatientRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { generateDisplayId } = require("../utils/displayId");
const { generateExaminationPDF, generatePrescriptionPDF } = require("../utils/pdf");
const { EyeExamination } = require("../models");
const { sequelize } = require("../database");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

class EyeExaminationService extends BaseService {
  constructor() {
    super(new EyeExaminationRepository());
    this.patientRepository = new PatientRepository();
    this._stockService = null;
  }

  _getStockService() {
    if (!this._stockService) {
      const StockService = require("./stock");
      this._stockService = new StockService();
    }
    return this._stockService;
  }

  async create(patientId, data) {
    return this.executeOperation(async () => {
      await this.patientRepository.findById(patientId);
      const displayId = await generateDisplayId(EyeExamination, "EX");
      return this.repository.create({ ...data, patientId, displayId });
    }, MESSAGES.EXAMINATION.CREATED, "EXAMINATION_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const exam = await this.repository.findById(id);
      if (!exam) {
        throw new CustomError(MESSAGES.EXAMINATION.NOT_FOUND, "EXAMINATION_NOT_FOUND", 404);
      }

      // If examStatus is changing, handle stock integration
      if (data.examStatus && data.examStatus !== exam.examStatus) {
        return this._updateWithStock(exam, data);
      }

      return this.repository.update(id, data);
    }, MESSAGES.EXAMINATION.UPDATED, "EXAMINATION_UPDATE_ERROR");
  }

  /**
   * Update exam with stock integration:
   * - When status → "completed": deduct consumables based on examType rules
   * - When status → "cancelled" from "completed": reverse consumables
   */
  async _updateWithStock(exam, data) {
    const oldStatus = exam.examStatus;
    const newStatus = data.examStatus;

    const transaction = await sequelize.transaction();
    try {
      const updated = await this.repository.update(exam.id, data, { transaction });

      // Deduct consumables when exam is completed
      if (newStatus === "completed" && oldStatus !== "completed") {
        try {
          const examType = data.examType || exam.examType || "general";
          await this._getStockService().processExamConsumables(exam.id, examType, transaction);
        } catch (stockErr) {
          logger.warn(`Exam ${exam.id} completed but consumable deduction failed: ${stockErr.message}`);
          // Don't fail the exam update — stock may be insufficient
        }
      }

      // Reverse consumables when a completed exam is cancelled
      if (newStatus === "cancelled" && oldStatus === "completed") {
        try {
          await this._getStockService().reverseExamConsumables(exam.id, transaction);
        } catch (stockErr) {
          logger.warn(`Exam ${exam.id} cancelled but consumable reversal failed: ${stockErr.message}`);
        }
      }

      await transaction.commit();
      return this.repository.findById(exam.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const exam = await this.repository.findByIdWithPatient(id);
      if (!exam) {
        throw new CustomError(MESSAGES.EXAMINATION.NOT_FOUND, "EXAMINATION_NOT_FOUND", 404);
      }
      return exam;
    }, MESSAGES.EXAMINATION.RETRIEVED_ONE, "EXAMINATION_GET_ERROR");
  }

  async getByPatientId(patientId, query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = {};
      if (query.examStatus) where.examStatus = query.examStatus;
      if (query.startDate && query.endDate) {
        where.examDate = { [Op.between]: [query.startDate, query.endDate] };
      }
      const { rows, count } = await this.repository.findByPatientId(patientId, { offset, limit, where });
      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.EXAMINATION.RETRIEVED, "EXAMINATION_LIST_ERROR");
  }

  async createFollowUp(id) {
    return this.executeOperation(async () => {
      const original = await this.repository.findByIdWithPatient(id);
      if (!original) {
        throw new CustomError(MESSAGES.EXAMINATION.NOT_FOUND, "EXAMINATION_NOT_FOUND", 404);
      }

      const followUpData = original.toJSON();
      const fieldsToCopy = [
        "rightEyeWithoutCorrection", "rightEyeWithCorrection", "rightEyePressure",
        "leftEyeWithoutCorrection", "leftEyeWithCorrection", "leftEyePressure",
        "cornealShapeRightEye", "cornealSurfaceRightEye", "rightEyeRetinaExamination",
        "presenceOfCataractRightEye", "lensClarityRightEye", "rightEyeFundusExamination",
        "cornealShapeLeftEye", "cornealSurfaceLeftEye", "leftEyeRetinaExamination",
        "presenceOfCataractLeftEye", "lensClarityLeftEye", "leftEyeFundusExamination",
        "rightEyeRefraction", "rightEyeSphericalPower", "rightEyeCylindricalPower",
        "rightEyeAxis", "rightEyeAdditionForReading",
        "leftEyeRefraction", "leftEyeSphericalPower", "leftEyeCylindricalPower",
        "leftEyeAxis", "leftEyeAdditionForReading",
        "rightEyeLensType", "rightEyeLensDiameter", "rightEyeBaseCurve",
        "leftEyeLensType", "leftEyeLensDiameter", "leftEyeBaseCurve",
        "frameType", "frameManufacturer", "frameModel", "frameSize",
        "frameLensWidth", "frameBridgeWidth", "frameTempleLength",
        "frameMaterial", "frameColor", "frameShape",
        "frameLensType", "frameLensIndex", "frameLensCoating",
        "frameLensUVProtection", "frameLensColor",
        "eyeglassesPrescription", "contactLensesPrescription",
        "additionalTreatments", "followUpInstructions", "generalNotes",
      ];

      const newData = { patientId: original.patientId, examDate: new Date().toISOString().split("T")[0], examStatus: "pending" };
      for (const field of fieldsToCopy) {
        if (followUpData[field] !== null && followUpData[field] !== undefined) {
          newData[field] = followUpData[field];
        }
      }

      newData.displayId = await generateDisplayId(EyeExamination, "EX");
      return this.repository.create(newData);
    }, MESSAGES.EXAMINATION.FOLLOW_UP_CREATED, "EXAMINATION_FOLLOWUP_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      await this.repository.delete(id);
      return true;
    }, MESSAGES.EXAMINATION.DELETED, "EXAMINATION_DELETE_ERROR");
  }

  async listSimpleByPatient(patientId) {
    return this.executeOperation(async () => {
      return EyeExamination.findAll({
        where: { patientId },
        attributes: ["id", "displayId", "examDate"],
        order: [["examDate", "DESC"]],
      });
    }, MESSAGES.EXAMINATION.RETRIEVED, "EXAMINATION_LIST_ERROR");
  }

  async generateExamPDF(id, clinicSettings) {
    const exam = await this.getById(id);
    return generateExaminationPDF(exam, clinicSettings);
  }

  async generatePrescriptionPDFDoc(id, clinicSettings) {
    const exam = await this.getById(id);
    return generatePrescriptionPDF(exam, clinicSettings);
  }
}

module.exports = EyeExaminationService;

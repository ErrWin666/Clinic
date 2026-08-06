const BaseController = require("./BaseController");
const PatientNoteService = require("../services/PatientNoteService");
const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");
const fs = require("fs");

class PatientNoteController extends BaseController {
  constructor() {
    super();
    this.patientNoteService = new PatientNoteService();
  }

  async list(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const { rows, pagination } = await this.patientNoteService.listByPatient(patientId, req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.PATIENT_NOTE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const id = this.validateId(req.params.id);
      const note = await this.patientNoteService.getById(patientId, id);
      return this.sendSuccess(res, note, MESSAGES.PATIENT_NOTE.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const note = await this.patientNoteService.create(patientId, req.body, req.user.id);
      return this.sendSuccess(res, note, MESSAGES.PATIENT_NOTE.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const id = this.validateId(req.params.id);
      const note = await this.patientNoteService.update(patientId, id, req.body);
      return this.sendSuccess(res, note, MESSAGES.PATIENT_NOTE.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const id = this.validateId(req.params.id);
      await this.patientNoteService.delete(patientId, id);
      return this.sendSuccess(res, null, MESSAGES.PATIENT_NOTE.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async uploadAttachment(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const noteId = this.validateId(req.params.id);
      if (!req.files || req.files.length === 0) {
        if (req.file) {
          const file = await this.patientNoteService.uploadAttachment(patientId, noteId, req.file);
          return this.sendSuccess(res, file, MESSAGES.PATIENT_NOTE.ATTACHMENT_UPLOADED, 201);
        }
        throw new CustomError("No file provided", "VALIDATION_ERROR", 400);
      }
      const files = [];
      for (const f of req.files) {
        const file = await this.patientNoteService.uploadAttachment(patientId, noteId, f);
        files.push(file);
      }
      return this.sendSuccess(res, files, MESSAGES.PATIENT_NOTE.ATTACHMENT_UPLOADED, 201);
    } catch (error) {
      next(error);
    }
  }

  async downloadAttachment(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const noteId = this.validateId(req.params.id);
      const fileId = this.validateId(req.params.fileId);
      const { file, fullPath } = await this.patientNoteService.downloadAttachment(patientId, noteId, fileId);
      res.setHeader("Content-Type", file.type);
      const encodedName = encodeURIComponent(file.name);
      res.setHeader("Content-Disposition", `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async previewAttachment(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const noteId = this.validateId(req.params.id);
      const fileId = this.validateId(req.params.fileId);
      const { file, fullPath } = await this.patientNoteService.downloadAttachment(patientId, noteId, fileId);
      res.setHeader("Content-Type", file.type);
      const encodedName = encodeURIComponent(file.name);
      res.setHeader("Content-Disposition", `inline; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async deleteAttachment(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const noteId = this.validateId(req.params.id);
      const fileId = this.validateId(req.params.fileId);
      await this.patientNoteService.deleteAttachment(patientId, noteId, fileId);
      return this.sendSuccess(res, null, MESSAGES.PATIENT_NOTE.ATTACHMENT_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientNoteController;

const BaseController = require("./BaseController");
const ClinicNoteService = require("../services/ClinicNoteService");
const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");
const fs = require("fs");

class ClinicNoteController extends BaseController {
  constructor() {
    super();
    this.clinicNoteService = new ClinicNoteService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.clinicNoteService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.CLINIC_NOTE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const note = await this.clinicNoteService.getById(id);
      return this.sendSuccess(res, note, MESSAGES.CLINIC_NOTE.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const note = await this.clinicNoteService.create(req.body, req.user.id);
      return this.sendSuccess(res, note, MESSAGES.CLINIC_NOTE.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const note = await this.clinicNoteService.update(id, req.body);
      return this.sendSuccess(res, note, MESSAGES.CLINIC_NOTE.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.clinicNoteService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.CLINIC_NOTE.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async uploadAttachment(req, res, next) {
    try {
      const noteId = this.validateId(req.params.id);
      if (!req.files || req.files.length === 0) {
        if (req.file) {
          const file = await this.clinicNoteService.uploadAttachment(noteId, req.file);
          return this.sendSuccess(res, file, MESSAGES.CLINIC_NOTE.ATTACHMENT_UPLOADED, 201);
        }
        throw new CustomError("No file provided", "VALIDATION_ERROR", 400);
      }
      const files = [];
      for (const f of req.files) {
        const file = await this.clinicNoteService.uploadAttachment(noteId, f);
        files.push(file);
      }
      return this.sendSuccess(res, files, MESSAGES.CLINIC_NOTE.ATTACHMENT_UPLOADED, 201);
    } catch (error) {
      next(error);
    }
  }

  async downloadAttachment(req, res, next) {
    try {
      const noteId = this.validateId(req.params.id);
      const fileId = this.validateId(req.params.fileId);
      const { file, fullPath } = await this.clinicNoteService.downloadAttachment(noteId, fileId);
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
      const noteId = this.validateId(req.params.id);
      const fileId = this.validateId(req.params.fileId);
      const { file, fullPath } = await this.clinicNoteService.downloadAttachment(noteId, fileId);
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
      const noteId = this.validateId(req.params.id);
      const fileId = this.validateId(req.params.fileId);
      await this.clinicNoteService.deleteAttachment(noteId, fileId);
      return this.sendSuccess(res, null, MESSAGES.CLINIC_NOTE.ATTACHMENT_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClinicNoteController;

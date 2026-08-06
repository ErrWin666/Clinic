const BaseService = require("./BaseService");
const PatientNoteRepository = require("../repositories/PatientNoteRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const path = require("path");
const fs = require("fs");
const config = require("../config");

class PatientNoteService extends BaseService {
  constructor() {
    super(new PatientNoteRepository());
  }

  async listByPatient(patientId, query = {}) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      let result;
      if (query.search) {
        result = await this.repository.searchByPatient(patientId, query.search, offset, limit);
      } else {
        result = await this.repository.listByPatient(patientId, offset, limit);
      }

      const pagination = buildPaginationResponse(result.count, page, pageSize);
      return { rows: result.rows, pagination };
    }, MESSAGES.PATIENT_NOTE.RETRIEVED, "PATIENT_NOTE_LIST_ERROR");
  }

  async getById(patientId, id) {
    return this.executeOperation(async () => {
      const note = await this.repository.findByIdWithAttachments(id);
      if (!note || note.patientId !== parseInt(patientId, 10)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.NOT_FOUND, "PATIENT_NOTE_NOT_FOUND", 404);
      }
      return note;
    }, MESSAGES.PATIENT_NOTE.RETRIEVED_ONE, "PATIENT_NOTE_GET_ERROR");
  }

  async create(patientId, data, userId) {
    return this.executeOperation(async () => {
      if (!data.content || !data.content.trim()) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.CONTENT_REQUIRED, "NOTE_CONTENT_REQUIRED", 400);
      }
      return this.repository.create({
        patientId: parseInt(patientId, 10),
        title: data.title || null,
        content: data.content,
        userId,
      });
    }, MESSAGES.PATIENT_NOTE.CREATED, "PATIENT_NOTE_CREATE_ERROR");
  }

  async update(patientId, id, data) {
    return this.executeOperation(async () => {
      if (data.content !== undefined && !data.content.trim()) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.CONTENT_REQUIRED, "NOTE_CONTENT_REQUIRED", 400);
      }
      const note = await this.repository.findById(id);
      if (!note || note.patientId !== parseInt(patientId, 10)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.NOT_FOUND, "PATIENT_NOTE_NOT_FOUND", 404);
      }
      return note.update({
        title: data.title !== undefined ? data.title : note.title,
        content: data.content !== undefined ? data.content : note.content,
      });
    }, MESSAGES.PATIENT_NOTE.UPDATED, "PATIENT_NOTE_UPDATE_ERROR");
  }

  async delete(patientId, id) {
    return this.executeOperation(async () => {
      const note = await this.repository.findByIdWithAttachments(id);
      if (!note || note.patientId !== parseInt(patientId, 10)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.NOT_FOUND, "PATIENT_NOTE_NOT_FOUND", 404);
      }
      await note.destroy();
      return true;
    }, MESSAGES.PATIENT_NOTE.DELETED, "PATIENT_NOTE_DELETE_ERROR");
  }

  async uploadAttachment(patientId, noteId, file) {
    return this.executeOperation(async () => {
      const note = await this.repository.findById(noteId);
      if (!note || note.patientId !== parseInt(patientId, 10)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.NOT_FOUND, "PATIENT_NOTE_NOT_FOUND", 404);
      }
      const relativePath = `patients/${patientId}/notes/${noteId}`;
      const fullPath = path.resolve(config.upload.dir, relativePath);
      fs.mkdirSync(fullPath, { recursive: true });

      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext);
      const safeBaseName = baseName
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "")
        .substring(0, 50) || "file";
      const fileName = `${Date.now()}-${safeBaseName}${ext}`;
      const filePath = path.resolve(fullPath, fileName);
      fs.renameSync(file.path, filePath);

      try {
        const { File } = require("../models");
        return await File.create({
          name: Buffer.from(file.originalname, "latin1").toString("utf8"),
          patientId: parseInt(patientId, 10),
          patientNoteId: noteId,
          type: file.mimetype,
          size: file.size,
          path: `${relativePath}/${fileName}`,
        });
      } catch (dbError) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw dbError;
      }
    }, MESSAGES.PATIENT_NOTE.ATTACHMENT_UPLOADED, "PATIENT_NOTE_ATTACHMENT_UPLOAD_ERROR");
  }

  async downloadAttachment(patientId, noteId, fileId) {
    return this.executeOperation(async () => {
      const { File } = require("../models");
      const file = await File.findOne({ where: { id: fileId, patientNoteId: noteId } });
      if (!file || file.patientId !== parseInt(patientId, 10)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.ATTACHMENT_NOT_FOUND, "NOTE_ATTACHMENT_NOT_FOUND", 404);
      }
      const fullPath = path.resolve(config.upload.dir, file.path);
      if (!fs.existsSync(fullPath)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.ATTACHMENT_NOT_FOUND, "NOTE_ATTACHMENT_NOT_FOUND", 404);
      }
      return { file, fullPath };
    }, MESSAGES.PATIENT_NOTE.RETRIEVED_ONE, "PATIENT_NOTE_ATTACHMENT_DOWNLOAD_ERROR");
  }

  async deleteAttachment(patientId, noteId, fileId) {
    return this.executeOperation(async () => {
      const { File } = require("../models");
      const file = await File.findOne({ where: { id: fileId, patientNoteId: noteId } });
      if (!file || file.patientId !== parseInt(patientId, 10)) {
        throw new CustomError(MESSAGES.PATIENT_NOTE.ATTACHMENT_NOT_FOUND, "NOTE_ATTACHMENT_NOT_FOUND", 404);
      }
      const fullPath = path.resolve(config.upload.dir, file.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      await file.destroy();
      return true;
    }, MESSAGES.PATIENT_NOTE.ATTACHMENT_DELETED, "PATIENT_NOTE_ATTACHMENT_DELETE_ERROR");
  }
}

module.exports = PatientNoteService;

const BaseService = require("./BaseService");
const ClinicNoteRepository = require("../repositories/ClinicNoteRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const path = require("path");
const fs = require("fs");
const config = require("../config");

class ClinicNoteService extends BaseService {
  constructor() {
    super(new ClinicNoteRepository());
  }

  async list(query = {}) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      let result;
      if (query.search) {
        result = await this.repository.search(query.search, offset, limit);
      } else {
        result = await this.repository.searchWithFilters({
          where: {},
          offset,
          limit,
          order: [["createdAt", "DESC"]],
        });
      }

      const pagination = buildPaginationResponse(result.count, page, pageSize);
      return { rows: result.rows, pagination };
    }, MESSAGES.CLINIC_NOTE.RETRIEVED, "CLINIC_NOTE_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const note = await this.repository.findByIdWithAttachments(id);
      if (!note) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.NOT_FOUND, "CLINIC_NOTE_NOT_FOUND", 404);
      }
      return note;
    }, MESSAGES.CLINIC_NOTE.RETRIEVED_ONE, "CLINIC_NOTE_GET_ERROR");
  }

  async create(data, userId) {
    return this.executeOperation(async () => {
      if (!data.content || !data.content.trim()) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.CONTENT_REQUIRED, "NOTE_CONTENT_REQUIRED", 400);
      }
      return this.repository.create({
        title: data.title || null,
        content: data.content,
        userId,
      });
    }, MESSAGES.CLINIC_NOTE.CREATED, "CLINIC_NOTE_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      if (data.content !== undefined && !data.content.trim()) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.CONTENT_REQUIRED, "NOTE_CONTENT_REQUIRED", 400);
      }
      const note = await this.repository.findById(id);
      if (!note) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.NOT_FOUND, "CLINIC_NOTE_NOT_FOUND", 404);
      }
      return note.update({
        title: data.title !== undefined ? data.title : note.title,
        content: data.content !== undefined ? data.content : note.content,
      });
    }, MESSAGES.CLINIC_NOTE.UPDATED, "CLINIC_NOTE_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const note = await this.repository.findByIdWithAttachments(id);
      if (!note) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.NOT_FOUND, "CLINIC_NOTE_NOT_FOUND", 404);
      }
      await note.destroy();
      return true;
    }, MESSAGES.CLINIC_NOTE.DELETED, "CLINIC_NOTE_DELETE_ERROR");
  }

  async uploadAttachment(noteId, file) {
    return this.executeOperation(async () => {
      const note = await this.repository.findById(noteId);
      if (!note) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.NOT_FOUND, "CLINIC_NOTE_NOT_FOUND", 404);
      }
      const relativePath = `clinic-notes/${noteId}`;
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
          patientId: null,
          clinicNoteId: noteId,
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
    }, MESSAGES.CLINIC_NOTE.ATTACHMENT_UPLOADED, "CLINIC_NOTE_ATTACHMENT_UPLOAD_ERROR");
  }

  async downloadAttachment(noteId, fileId) {
    return this.executeOperation(async () => {
      const { File } = require("../models");
      const file = await File.findOne({ where: { id: fileId, clinicNoteId: noteId } });
      if (!file) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.ATTACHMENT_NOT_FOUND, "NOTE_ATTACHMENT_NOT_FOUND", 404);
      }
      const fullPath = path.resolve(config.upload.dir, file.path);
      if (!fs.existsSync(fullPath)) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.ATTACHMENT_NOT_FOUND, "NOTE_ATTACHMENT_NOT_FOUND", 404);
      }
      return { file, fullPath };
    }, MESSAGES.CLINIC_NOTE.RETRIEVED_ONE, "CLINIC_NOTE_ATTACHMENT_DOWNLOAD_ERROR");
  }

  async deleteAttachment(noteId, fileId) {
    return this.executeOperation(async () => {
      const { File } = require("../models");
      const file = await File.findOne({ where: { id: fileId, clinicNoteId: noteId } });
      if (!file) {
        throw new CustomError(MESSAGES.CLINIC_NOTE.ATTACHMENT_NOT_FOUND, "NOTE_ATTACHMENT_NOT_FOUND", 404);
      }
      const fullPath = path.resolve(config.upload.dir, file.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      await file.destroy();
      return true;
    }, MESSAGES.CLINIC_NOTE.ATTACHMENT_DELETED, "CLINIC_NOTE_ATTACHMENT_DELETE_ERROR");
  }
}

module.exports = ClinicNoteService;

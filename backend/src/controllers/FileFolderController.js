const BaseController = require("./BaseController");
const FolderService = require("../services/FolderService");
const FileService = require("../services/FileService");
const { upload } = require("../utils/fileUpload");
const MESSAGES = require("../constants/messages");
const CustomError = require("../utils/CustomError");
const path = require("path");
const fs = require("fs");

class FileFolderController extends BaseController {
  constructor() {
    super();
    this.folderService = new FolderService();
    this.fileService = new FileService();
  }

  async listFolders(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const { rows, pagination } = await this.folderService.listByPatient(patientId, req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.FOLDER.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async createFolder(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const folder = await this.folderService.create(patientId, req.body);
      return this.sendSuccess(res, folder, MESSAGES.FOLDER.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async renameFolder(req, res, next) {
    try {
      const folderId = this.validateId(req.params.folderId);
      const folder = await this.folderService.rename(folderId, req.body.name);
      return this.sendSuccess(res, folder, MESSAGES.FOLDER.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async deleteFolder(req, res, next) {
    try {
      const folderId = this.validateId(req.params.folderId);
      await this.folderService.delete(folderId);
      return this.sendSuccess(res, null, MESSAGES.FOLDER.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async listFiles(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      const { rows, pagination } = await this.fileService.listByPatient(patientId, req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.FILE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async uploadFile(req, res, next) {
    try {
      const patientId = this.validateId(req.params.patientId);
      if (!req.file) {
        throw new CustomError("No file provided", "VALIDATION_ERROR", 400);
      }
      const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;
      const examinationId = req.body.examinationId ? parseInt(req.body.examinationId, 10) : null;
      const file = await this.fileService.upload(patientId, req.file, folderId, examinationId);
      return this.sendSuccess(res, file, MESSAGES.FILE.UPLOADED, 201);
    } catch (error) {
      next(error);
    }
  }

  async downloadFile(req, res, next) {
    try {
      const id = this.validateId(req.params.fileId);
      const { file, fullPath } = await this.fileService.download(id);
      res.setHeader("Content-Type", file.type);
      // RFC 5987 encoding for non-ASCII filenames (Arabic support)
      const encodedName = encodeURIComponent(file.name);
      res.setHeader("Content-Disposition", `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async previewFile(req, res, next) {
    try {
      const id = this.validateId(req.params.fileId);
      const { file, fullPath } = await this.fileService.download(id);
      res.setHeader("Content-Type", file.type);
      const encodedName = encodeURIComponent(file.name);
      res.setHeader("Content-Disposition", `inline; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const id = this.validateId(req.params.fileId);
      await this.fileService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.FILE.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FileFolderController;

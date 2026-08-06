const BaseService = require("./BaseService");
const FolderRepository = require("../repositories/FolderRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const path = require("path");
const fs = require("fs");
const config = require("../config");

function sanitizeFolderName(name) {
  const cleaned = path.basename(name).replace(/[\\/]/g, "").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
  }
  return cleaned;
}

class FolderService extends BaseService {
  constructor() {
    super(new FolderRepository());
  }

  async create(patientId, data) {
    return this.executeOperation(async () => {
      const safeName = sanitizeFolderName(data.name);
      let folderPath = `patients/${patientId}/${safeName}`;
      if (data.parentFolderId) {
        const parent = await this.repository.findById(data.parentFolderId);
        folderPath = `${parent.path}/${safeName}`;
      }

      const fullPath = path.resolve(config.upload.dir, folderPath);
      const uploadRoot = path.resolve(config.upload.dir);
      if (!fullPath.startsWith(uploadRoot)) {
        throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
      }
      fs.mkdirSync(fullPath, { recursive: true });

      return this.repository.create({
        name: safeName,
        patientId,
        parentFolderId: data.parentFolderId || null,
        path: folderPath,
      });
    }, MESSAGES.FOLDER.CREATED, "FOLDER_CREATE_ERROR");
  }

  async rename(id, name) {
    return this.executeOperation(async () => {
      const safeName = sanitizeFolderName(name);
      const folder = await this.repository.findById(id);
      const oldPath = folder.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf("/"));
      const newPath = `${parentPath}/${safeName}`;

      const oldFullPath = path.resolve(config.upload.dir, oldPath);
      const newFullPath = path.resolve(config.upload.dir, newPath);
      const uploadRoot = path.resolve(config.upload.dir);
      if (!newFullPath.startsWith(uploadRoot)) {
        throw new CustomError(MESSAGES.COMMON.INVALID_INPUT, "VALIDATION_ERROR", 400);
      }
      if (fs.existsSync(oldFullPath)) {
        fs.renameSync(oldFullPath, newFullPath);
      }

      return folder.update({ name: safeName, path: newPath });
    }, MESSAGES.FOLDER.UPDATED, "FOLDER_UPDATE_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const folder = await this.repository.findById(id);
      const fullPath = path.resolve(config.upload.dir, folder.path);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true });
      }
      await folder.destroy();
      return true;
    }, MESSAGES.FOLDER.DELETED, "FOLDER_DELETE_ERROR");
  }

  async listByPatient(patientId, query = {}) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = { patientId };

      if (query.parentFolderId !== undefined && query.parentFolderId !== null && query.parentFolderId !== "") {
        where.parentFolderId = parseInt(query.parentFolderId, 10);
      }

      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        where[Op.or] = [
          { name: { [likeOp()]: term } },
        ];
      }

      const order = [[query.sortBy || "name", query.sortOrder || "ASC"]];

      const { rows, count } = await this.repository.searchWithFilters({
        where, offset, limit, order,
      });

      const pagination = buildPaginationResponse(count, page, pageSize);
      return { rows, pagination };
    }, MESSAGES.FOLDER.RETRIEVED, "FOLDER_LIST_ERROR");
  }
}

module.exports = FolderService;

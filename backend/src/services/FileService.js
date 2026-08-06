const BaseService = require("./BaseService");
const FileRepository = require("../repositories/FileRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { Op } = require("sequelize");
const { likeOp, escapeLike } = require("../utils/queryHelpers");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const path = require("path");
const fs = require("fs");
const config = require("../config");

// Detect mojibake (Arabic UTF-8 bytes misinterpreted as Latin-1)
// Arabic UTF-8 bytes are in 0xD8-0xDB range, which map to Ù Ø Û Ü in Latin-1
function fixMojibakeName(name) {
  if (!name || typeof name !== "string") return name;
  // Check for typical mojibake patterns: Ù Ø Û Ü followed by Latin-1 chars
  if (/[\u00D8-\u00DB][\u0080-\u00BF\u00C0-\u00FF]/.test(name)) {
    try {
      const fixed = Buffer.from(name, "latin1").toString("utf8");
      // Verify the fix produced valid Arabic text (contains Arabic range U+0600-U+06FF)
      if (/[\u0600-\u06FF]/.test(fixed)) {
        return fixed;
      }
    } catch (_e) {
      // If fix fails, return original
    }
  }
  return name;
}

class FileService extends BaseService {
  constructor() {
    super(new FileRepository());
  }

  async upload(patientId, file, folderId = null, examinationId = null) {
    return this.executeOperation(async () => {
      let relativePath = `patients/${patientId}`;
      if (folderId) {
        const { Folder } = require("../models");
        const folder = await Folder.findByPk(folderId);
        if (folder && folder.patientId === patientId) {
          relativePath = folder.path;
        }
      }

      const fullPath = path.resolve(config.upload.dir, relativePath);
      fs.mkdirSync(fullPath, { recursive: true });

      // Sanitize filename: replace non-ASCII chars to avoid filesystem encoding issues
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path.basename(file.originalname, ext);
      const safeBaseName = baseName
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "") // Remove non-ASCII characters
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "")
        .substring(0, 50) || "file";
      const fileName = `${Date.now()}-${safeBaseName}${ext}`;
      const filePath = path.resolve(fullPath, fileName);
      fs.renameSync(file.path, filePath);

      return this.repository.create({
        name: Buffer.from(file.originalname, "latin1").toString("utf8"),
        patientId,
        folderId: folderId || null,
        examinationId: examinationId || null,
        type: file.mimetype,
        size: file.size,
        path: `${relativePath}/${fileName}`,
      });
    }, MESSAGES.FILE.UPLOADED, "FILE_UPLOAD_ERROR");
  }

  async download(id) {
    return this.executeOperation(async () => {
      const file = await this.repository.findById(id);
      file.name = fixMojibakeName(file.name);
      const fullPath = path.resolve(config.upload.dir, file.path);
      if (!fs.existsSync(fullPath)) {
        throw new CustomError(MESSAGES.FILE.NOT_FOUND, "FILE_NOT_FOUND", 404);
      }
      return { file, fullPath };
    }, MESSAGES.FILE.RETRIEVED, "FILE_DOWNLOAD_ERROR");
  }

  async delete(id) {
    return this.executeOperation(async () => {
      const file = await this.repository.findById(id);
      const fullPath = path.resolve(config.upload.dir, file.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      await file.destroy();
      return true;
    }, MESSAGES.FILE.DELETED, "FILE_DELETE_ERROR");
  }

  async listByPatient(patientId, query = {}) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const where = { patientId };

      if (query.folderId !== undefined && query.folderId !== null && query.folderId !== "") {
        where.folderId = parseInt(query.folderId, 10);
      }

      if (query.examinationId !== undefined && query.examinationId !== null && query.examinationId !== "") {
        if (query.examinationId === "null") {
          where.examinationId = { [Op.is]: null };
        } else {
          where.examinationId = parseInt(query.examinationId, 10);
        }
      }

      if (query.search) {
        const term = `%${escapeLike(query.search)}%`;
        where[Op.or] = [
          { name: { [likeOp()]: term } },
        ];
      }

      if (query.type) {
        where.type = { [likeOp()]: `%${escapeLike(query.type)}%` };
      }

      const order = [[query.sortBy || "createdAt", query.sortOrder || "DESC"]];

      const { rows, count } = await this.repository.searchWithFilters({
        where, offset, limit, order,
      });

      const pagination = buildPaginationResponse(count, page, pageSize);
      const fixedRows = rows.map((f) => {
        f.name = fixMojibakeName(f.name);
        return f;
      });
      return { rows: fixedRows, pagination };
    }, MESSAGES.FILE.RETRIEVED, "FILE_LIST_ERROR");
  }
}

module.exports = FileService;

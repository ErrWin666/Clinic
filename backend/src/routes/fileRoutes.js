const express = require("express");
const router = express.Router({ mergeParams: true });
const FileFolderController = require("../controllers/FileFolderController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const audit = require("../middlewares/audit");
const { upload, verifyMagicBytes } = require("../utils/fileUpload");
const { createFolderSchema, updateFolderSchema, listFoldersSchema } = require("../schemas/folderSchema");
const { listFilesSchema } = require("../schemas/fileSchema");
const { fileIdParamSchema, folderIdParamSchema } = require("../schemas/commonSchema");

const controller = new FileFolderController();

router.use(auth);

// Folders
router.get("/folders", validate(listFoldersSchema), (req, res, next) => controller.listFolders(req, res, next));
router.post("/folders", validate(createFolderSchema), audit("CREATE"), (req, res, next) => controller.createFolder(req, res, next));
router.put("/folders/:folderId", validate(updateFolderSchema), audit("UPDATE"), (req, res, next) => controller.renameFolder(req, res, next));
router.delete("/folders/:folderId", validate(folderIdParamSchema), audit("DELETE"), (req, res, next) => controller.deleteFolder(req, res, next));

// Files
router.get("/files", validate(listFilesSchema), (req, res, next) => controller.listFiles(req, res, next));
router.post("/files", upload.single("file"), verifyMagicBytes, audit("CREATE"), (req, res, next) => controller.uploadFile(req, res, next));
router.get("/files/:fileId", validate(fileIdParamSchema), (req, res, next) => controller.downloadFile(req, res, next));
router.get("/files/:fileId/preview", validate(fileIdParamSchema), (req, res, next) => controller.previewFile(req, res, next));
router.delete("/files/:fileId", validate(fileIdParamSchema), audit("DELETE"), (req, res, next) => controller.deleteFile(req, res, next));

module.exports = router;

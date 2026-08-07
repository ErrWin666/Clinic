const express = require("express");
const router = express.Router();
const { uploadClinicNoteFile, verifyMagicBytes } = require("../utils/fileUpload");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const CustomError = require("../utils/CustomError");

router.use(auth);

router.post("/image", requirePermission("notes:write"), uploadClinicNoteFile.single("file"), verifyMagicBytes, (req, res, next) => {
  try {
    if (!req.file) {
      throw new CustomError("No file provided", "VALIDATION_ERROR", 400);
    }
    const src = `/uploads/clinic-notes/${req.file.filename}`;
    return res.json({
      success: true,
      data: { src },
      message: "File uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

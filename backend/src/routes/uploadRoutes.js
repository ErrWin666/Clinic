const express = require("express");
const router = express.Router({ mergeParams: true });
const { uploadImage, verifyMagicBytes } = require("../utils/fileUpload");
const auth = require("../middlewares/auth");
const CustomError = require("../utils/CustomError");
const path = require("path");

router.use(auth);

router.post("/image", uploadImage.single("file"), verifyMagicBytes, (req, res, next) => {
  try {
    if (!req.file) {
      throw new CustomError("No file provided", "VALIDATION_ERROR", 400);
    }
    const subdir = req.params.patientId ? `patients/${req.params.patientId}` : "admin";
    const src = `/uploads/${subdir}/${req.file.filename}`;
    return res.json({
      success: true,
      data: { src },
      message: "Image uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

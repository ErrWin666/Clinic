const express = require("express");
const router = express.Router();
const SettingsController = require("../controllers/SettingsController");
const { validate } = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/rbac");
const audit = require("../middlewares/audit");
const { uploadImage, uploadClinicLogo } = require("../utils/fileUpload");
const { updateSettingsSchema, updateAdminSchema } = require("../schemas/settingsSchema");

const settingsController = new SettingsController();

router.use(auth);

router.get("/", requirePermission("settings:read"), (req, res, next) => settingsController.getAll(req, res, next));
router.put("/", requirePermission("settings:write"), validate(updateSettingsSchema), audit("UPDATE"), (req, res, next) => settingsController.update(req, res, next));
router.put("/admin", requirePermission("settings:write"), validate(updateAdminSchema), audit("UPDATE"), (req, res, next) => settingsController.updateAdmin(req, res, next));
router.post("/admin/profile-image", requirePermission("settings:write"), uploadImage.single("image"), (req, res, next) => settingsController.uploadAdminImage(req, res, next));
router.delete("/admin/profile-image", requirePermission("settings:write"), (req, res, next) => settingsController.deleteAdminImage(req, res, next));
router.post("/clinic/logo", requirePermission("settings:write"), uploadClinicLogo.single("image"), audit("UPDATE"), (req, res, next) => settingsController.uploadClinicLogo(req, res, next));
router.delete("/clinic/logo", requirePermission("settings:write"), (req, res, next) => settingsController.deleteClinicLogo(req, res, next));

module.exports = router;

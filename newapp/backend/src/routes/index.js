const express = require("express");
const router = express.Router();

const setupRoutes = require("./setupRoutes");
const authRoutes = require("./authRoutes");
const patientRoutes = require("./patientRoutes");
const patientRelationshipRoutes = require("./patientRelationshipRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const examinationRoutes = require("./examinationRoutes");
const patientExaminationRoutes = require("./patientExaminationRoutes");
const invoiceRoutes = require("./invoiceRoutes");
const paymentRoutes = require("./paymentRoutes");
const fileRoutes = require("./fileRoutes");
const uploadRoutes = require("./uploadRoutes");
const notificationRoutes = require("./notificationRoutes");
const settingsRoutes = require("./settingsRoutes");
const backupRoutes = require("./backupRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const reportRoutes = require("./reportRoutes");
const auditLogRoutes = require("./auditLogRoutes");
const systemRoutes = require("./systemRoutes");
const userRoutes = require("./userRoutes");
const whatsappRoutes = require("./whatsappRoutes");
const telegramRoutes = require("./telegramRoutes");
const messageRoutes = require("./messageRoutes");
const productRoutes = require("./productRoutes");
const stockRoutes = require("./stockRoutes");
const supplierRoutes = require("./supplierRoutes");
const purchaseOrderRoutes = require("./purchaseOrderRoutes");
const examConsumableRoutes = require("./examConsumableRoutes");
const productBundleRoutes = require("./productBundleRoutes");
const packagingUnitRoutes = require("./packagingUnitRoutes");
const stocktakingRoutes = require("./stocktakingRoutes");
const clinicNoteRoutes = require("./clinicNoteRoutes");
const patientNoteRoutes = require("./patientNoteRoutes");
const generalUploadRoutes = require("./generalUploadRoutes");

router.use("/setup", setupRoutes);
router.use("/auth", authRoutes);

router.use("/patients", patientRoutes);
router.use("/patients/:patientId/relationships", patientRelationshipRoutes);
router.use("/patients/:patientId/examinations", patientExaminationRoutes);
router.use("/patients/:patientId", fileRoutes);
router.use("/patients/:patientId/upload", uploadRoutes);
router.use("/patients/:patientId/notes", patientNoteRoutes);

router.use("/appointments", appointmentRoutes);
router.use("/examinations", examinationRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/invoices/:invoiceId/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingsRoutes);
router.use("/backup", backupRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/system", systemRoutes);
router.use("/users", userRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/telegram", telegramRoutes);
router.use("/messages", messageRoutes);

// Inventory
router.use("/products", productRoutes);
router.use("/stock", stockRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);
router.use("/exam-consumables", examConsumableRoutes);
router.use("/product-bundles", productBundleRoutes);
router.use("/packaging-units", packagingUnitRoutes);
router.use("/stocktaking", stocktakingRoutes);

// Notes
router.use("/clinic-notes", clinicNoteRoutes);
router.use("/upload", generalUploadRoutes);

module.exports = router;

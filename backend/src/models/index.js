const { sequelize } = require("../database");

const User = require("./User");
const Patient = require("./Patient");
const PatientRelationship = require("./PatientRelationship");
const Appointment = require("./Appointment");
const EyeExamination = require("./EyeExamination");
const Invoice = require("./Invoice");
const InvoiceItem = require("./InvoiceItem");
const Payment = require("./Payment");
const Folder = require("./Folder");
const File = require("./File");
const Notification = require("./Notification");
const Settings = require("./Settings");
const AuditLog = require("./AuditLog");
const Backup = require("./Backup");
const RevokedToken = require("./RevokedToken");
// Inventory models
const Product = require("./Product");
const ProductVariant = require("./ProductVariant");
const Batch = require("./Batch");
const StockMovement = require("./StockMovement");
const Supplier = require("./Supplier");
const PurchaseOrder = require("./PurchaseOrder");
const PurchaseOrderItem = require("./PurchaseOrderItem");
const SupplierPayment = require("./SupplierPayment");
const ExamConsumableRule = require("./ExamConsumableRule");
const ProductBundle = require("./ProductBundle");
const ProductBundleItem = require("./ProductBundleItem");
const PackagingUnit = require("./PackagingUnit");
const Stocktaking = require("./Stocktaking");
const StocktakingItem = require("./StocktakingItem");
// Notes models
const ClinicNote = require("./ClinicNote");
const PatientNote = require("./PatientNote");

// User associations
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs", onDelete: "CASCADE" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

// Patient associations
Patient.hasMany(Appointment, { foreignKey: "patientId", as: "appointments", onDelete: "CASCADE" });
Patient.hasMany(EyeExamination, { foreignKey: "patientId", as: "eyeExaminations", onDelete: "CASCADE" });
Patient.hasMany(Invoice, { foreignKey: "patientId", as: "invoices", onDelete: "SET NULL" });
Patient.hasMany(File, { foreignKey: "patientId", as: "files", onDelete: "CASCADE" });
Patient.hasMany(Folder, { foreignKey: "patientId", as: "folders", onDelete: "CASCADE" });
Patient.hasMany(PatientRelationship, { foreignKey: "guardianId", as: "guardianRelationships", onDelete: "CASCADE" });
Patient.hasMany(PatientRelationship, { foreignKey: "childId", as: "childRelationships", onDelete: "CASCADE" });

// Appointment associations
Appointment.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
Appointment.belongsTo(EyeExamination, { foreignKey: "examinationId", as: "examination" });
Appointment.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });

// EyeExamination associations
EyeExamination.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
EyeExamination.hasMany(File, { foreignKey: "examinationId", as: "files", onDelete: "CASCADE" });

// Invoice associations
Invoice.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
Invoice.hasMany(InvoiceItem, { foreignKey: "invoiceId", as: "items", onDelete: "CASCADE" });
Invoice.hasMany(Payment, { foreignKey: "invoiceId", as: "payments", onDelete: "CASCADE" });
InvoiceItem.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });
Payment.belongsTo(Invoice, { foreignKey: "invoiceId", as: "invoice" });

// Folder associations (self-referencing)
Folder.belongsTo(Folder, { foreignKey: "parentFolderId", as: "parentFolder" });
Folder.hasMany(Folder, { foreignKey: "parentFolderId", as: "subFolders" });
Folder.hasMany(File, { foreignKey: "folderId", as: "files" });

// File associations
File.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
File.belongsTo(Folder, { foreignKey: "folderId", as: "folder" });
File.belongsTo(EyeExamination, { foreignKey: "examinationId", as: "examination" });

// PatientRelationship associations
PatientRelationship.belongsTo(Patient, { foreignKey: "guardianId", as: "guardian" });
PatientRelationship.belongsTo(Patient, { foreignKey: "childId", as: "child" });

// ClinicNote associations
ClinicNote.belongsTo(User, { foreignKey: "userId", as: "user" });
ClinicNote.hasMany(File, { foreignKey: "clinicNoteId", as: "attachments", onDelete: "CASCADE" });

// PatientNote associations
PatientNote.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });
PatientNote.belongsTo(User, { foreignKey: "userId", as: "user" });
PatientNote.hasMany(File, { foreignKey: "patientNoteId", as: "attachments", onDelete: "CASCADE" });
Patient.hasMany(PatientNote, { foreignKey: "patientId", as: "patientNotes", onDelete: "CASCADE" });

// File associations for notes
File.belongsTo(ClinicNote, { foreignKey: "clinicNoteId", as: "clinicNote" });
File.belongsTo(PatientNote, { foreignKey: "patientNoteId", as: "patientNote" });

// === Inventory associations ===

// Product → ProductVariant
Product.hasMany(ProductVariant, { foreignKey: "productId", as: "variants", onDelete: "CASCADE" });
ProductVariant.belongsTo(Product, { foreignKey: "productId", as: "product" });

// ProductVariant → Batch → StockMovement
ProductVariant.hasMany(Batch, { foreignKey: "productVariantId", as: "batches", onDelete: "CASCADE" });
Batch.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });
ProductVariant.hasMany(StockMovement, { foreignKey: "productVariantId", as: "movements" });
Batch.hasMany(StockMovement, { foreignKey: "batchId", as: "movements" });
StockMovement.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });
StockMovement.belongsTo(Batch, { foreignKey: "batchId", as: "batch" });
StockMovement.belongsTo(User, { foreignKey: "userId", as: "user" });

// Supplier associations
Supplier.hasMany(PurchaseOrder, { foreignKey: "supplierId", as: "purchaseOrders" });
PurchaseOrder.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
Supplier.hasMany(Batch, { foreignKey: "supplierId", as: "batches" });
Batch.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
Supplier.hasMany(SupplierPayment, { foreignKey: "supplierId", as: "payments", onDelete: "CASCADE" });
SupplierPayment.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });

// PurchaseOrder associations
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: "purchaseOrderId", as: "items", onDelete: "CASCADE" });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: "purchaseOrderId", as: "purchaseOrder" });
PurchaseOrderItem.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });
SupplierPayment.belongsTo(PurchaseOrder, { foreignKey: "purchaseOrderId", as: "purchaseOrder" });
PurchaseOrder.hasMany(SupplierPayment, { foreignKey: "purchaseOrderId", as: "payments" });

// InvoiceItem → ProductVariant + Batch (link invoices to inventory)
InvoiceItem.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "productVariant" });
InvoiceItem.belongsTo(Batch, { foreignKey: "batchId", as: "batch" });
ProductVariant.hasMany(InvoiceItem, { foreignKey: "productVariantId", as: "invoiceItems" });

// ExamConsumableRule associations
ExamConsumableRule.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });
ProductVariant.hasMany(ExamConsumableRule, { foreignKey: "productVariantId", as: "consumableRules" });

// ProductBundle associations
ProductBundle.belongsTo(Product, { foreignKey: "productId", as: "product" });
ProductBundle.hasMany(ProductBundleItem, { foreignKey: "bundleId", as: "items", onDelete: "CASCADE" });
ProductBundleItem.belongsTo(ProductBundle, { foreignKey: "bundleId", as: "bundle" });
ProductBundleItem.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });

// PackagingUnit associations
ProductVariant.hasMany(PackagingUnit, { foreignKey: "productVariantId", as: "packagingUnits", onDelete: "CASCADE" });
PackagingUnit.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });

// Stocktaking associations
Stocktaking.belongsTo(User, { foreignKey: "userId", as: "user" });
Stocktaking.hasMany(StocktakingItem, { foreignKey: "stocktakingId", as: "items", onDelete: "CASCADE" });
StocktakingItem.belongsTo(Stocktaking, { foreignKey: "stocktakingId", as: "stocktaking" });
StocktakingItem.belongsTo(ProductVariant, { foreignKey: "productVariantId", as: "variant" });
StocktakingItem.belongsTo(Batch, { foreignKey: "batchId", as: "batch" });

module.exports = {
  sequelize,
  User,
  Patient,
  PatientRelationship,
  Appointment,
  EyeExamination,
  Invoice,
  InvoiceItem,
  Payment,
  Folder,
  File,
  Notification,
  Settings,
  AuditLog,
  Backup,
  RevokedToken,
  // Inventory models
  Product,
  ProductVariant,
  Batch,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  SupplierPayment,
  ExamConsumableRule,
  ProductBundle,
  ProductBundleItem,
  PackagingUnit,
  Stocktaking,
  StocktakingItem,
  // Notes models
  ClinicNote,
  PatientNote,
};

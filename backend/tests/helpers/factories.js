const PatientService = require("../../src/services/PatientService");
const AppointmentService = require("../../src/services/AppointmentService");
const InvoiceService = require("../../src/services/InvoiceService");
const EyeExaminationService = require("../../src/services/EyeExaminationService");
const FolderService = require("../../src/services/FolderService");
const FileService = require("../../src/services/FileService");
const NotificationService = require("../../src/services/NotificationService");
const { Notification } = require("../../src/models");
const {
  Product,
  ProductVariant,
  Supplier,
  Batch,
  StockMovement,
  User,
  PackagingUnit,
  ProductBundle,
  ProductBundleItem,
  PurchaseOrder,
  PurchaseOrderItem,
  SupplierPayment,
  Stocktaking,
  StocktakingItem,
  ExamConsumableRule,
} = require("../../src/models");
const { generateDisplayId } = require("../../src/utils/displayId");

let counter = 0;

function uniquePhone() {
  counter += 1;
  return `555${String(counter).padStart(6, "0")}`;
}

function uniqueSku() {
  counter += 1;
  return `TEST-SKU-${String(counter).padStart(4, "0")}`;
}

function uniqueBarcode() {
  counter += 1;
  return `${String(counter).padStart(13, "0")}`;
}

async function createTestPatient(overrides = {}) {
  const service = new PatientService();
  return service.create({
    fullName: overrides.fullName || `Test Patient ${counter++}`,
    birthDate: overrides.birthDate || "1990-01-15",
    gender: overrides.gender || "male",
    phoneNumber: overrides.phoneNumber || uniquePhone(),
    email: overrides.email || undefined,
    patientType: overrides.patientType || "regular",
    notes: overrides.notes,
  });
}

async function createTestAppointment(patientId, overrides = {}) {
  const service = new AppointmentService();
  return service.create({
    appointmentDate: overrides.appointmentDate || "2026-09-01",
    startTime: overrides.startTime || "10:00",
    endTime: overrides.endTime || "11:00",
    appointmentType: overrides.appointmentType || "checkup",
    patientId: patientId !== undefined ? patientId : undefined,
    quickName: overrides.quickName,
    quickPhone: overrides.quickPhone,
    status: overrides.status,
    notes: overrides.notes,
  });
}

async function createTestInvoice(patientId, overrides = {}) {
  const service = new InvoiceService();
  return service.create({
    patientId: patientId !== undefined ? patientId : undefined,
    customerName: overrides.customerName,
    customerPhone: overrides.customerPhone,
    invoiceDate: overrides.invoiceDate || "2026-07-23",
    dueDate: overrides.dueDate,
    invoiceStatus: overrides.invoiceStatus,
    taxAmount: overrides.taxAmount,
    discountAmount: overrides.discountAmount,
    items: overrides.items || [{ description: "Test item", quantity: 1, unitPrice: 50.0 }],
  });
}

async function createTestExam(patientId, overrides = {}) {
  const service = new EyeExaminationService();
  return service.create(patientId, {
    examDate: overrides.examDate || "2026-07-23",
    examStatus: overrides.examStatus,
    rightEyeWithoutCorrection: overrides.rightEyeWithoutCorrection,
    leftEyeWithoutCorrection: overrides.leftEyeWithoutCorrection,
    followUpInstructions: overrides.followUpInstructions,
    generalNotes: overrides.generalNotes,
  });
}

async function createTestFolder(patientId, overrides = {}) {
  const service = new FolderService();
  return service.create(patientId, {
    name: overrides.name || `TestFolder${counter++}`,
    parentFolderId: overrides.parentFolderId,
  });
}

async function createTestNotification(overrides = {}) {
  return Notification.create({
    type: overrides.type || "appointment_reminder",
    title: overrides.title || "Test Notification",
    message: overrides.message || "Test message",
    isRead: overrides.isRead || false,
    entityId: overrides.entityId,
    entityType: overrides.entityType,
  });
}

async function createTestUser(overrides = {}) {
  return User.create({
    username: overrides.username || `testuser${counter++}`,
    password: overrides.password || "Test123!",
    role: overrides.role || "admin",
    isAdmin: overrides.isAdmin !== undefined ? overrides.isAdmin : true,
  });
}

async function createTestProduct(overrides = {}) {
  const displayId = overrides.displayId || await generateDisplayId(Product, "PRD");
  return Product.create({
    displayId,
    name: overrides.name || `Test Product ${counter++}`,
    category: overrides.category || "frames",
    costingMethod: overrides.costingMethod || "fifo",
    description: overrides.description,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
}

async function createTestProductVariant(productId, overrides = {}) {
  return ProductVariant.create({
    productId: productId,
    name: overrides.name || `Test Variant ${counter++}`,
    sku: overrides.sku || uniqueSku(),
    barcode: overrides.barcode !== undefined ? overrides.barcode : uniqueBarcode(),
    sellPrice: overrides.sellPrice || 100.0,
    costPrice: overrides.costPrice || 50.0,
    quantity: overrides.quantity !== undefined ? overrides.quantity : 0,
    minQuantity: overrides.minQuantity !== undefined ? overrides.minQuantity : 5,
    maxQuantity: overrides.maxQuantity !== undefined ? overrides.maxQuantity : 100,
    location: overrides.location,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
}

async function createTestSupplier(overrides = {}) {
  const displayId = overrides.displayId || await generateDisplayId(Supplier, "SUP");
  return Supplier.create({
    displayId,
    name: overrides.name || `Test Supplier ${counter++}`,
    phone: overrides.phone || uniquePhone(),
    email: overrides.email,
    address: overrides.address,
    contactPerson: overrides.contactPerson,
    taxNumber: overrides.taxNumber,
    openingBalance: overrides.openingBalance || 0,
    notes: overrides.notes,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
}

async function createTestBatch(variantId, overrides = {}) {
  const qty = overrides.quantity !== undefined ? overrides.quantity : 10;
  return Batch.create({
    productVariantId: variantId,
    batchNumber: overrides.batchNumber || `BATCH-${counter++}`,
    quantity: qty,
    initialQuantity: overrides.initialQuantity !== undefined ? overrides.initialQuantity : qty,
    unitCost: overrides.unitCost || 50.0,
    expiryDate: overrides.expiryDate || "2028-12-31",
    receivedDate: overrides.receivedDate || "2026-01-01",
  });
}

async function createTestStockMovement(overrides = {}) {
  const smDisplayId = await generateDisplayId(StockMovement, "MOV");
  return StockMovement.create({
    displayId: smDisplayId,
    productVariantId: overrides.productVariantId,
    batchId: overrides.batchId,
    type: overrides.type || "in",
    quantity: overrides.quantity || 5,
    unitCost: overrides.unitCost || 50.0,
    reason: overrides.reason || "opening_stock",
    referenceType: overrides.referenceType,
    referenceId: overrides.referenceId,
    notes: overrides.notes,
    movementDate: overrides.movementDate || new Date().toISOString().split("T")[0],
  });
}

async function createTestPackagingUnit(variantId, overrides = {}) {
  return PackagingUnit.create({
    productVariantId: variantId,
    name: overrides.name || `Box of 10 ${counter++}`,
    shortName: overrides.shortName || `B${counter++}`,
    factor: overrides.factor || 10,
    barcode: overrides.barcode || uniqueBarcode(),
    sellPrice: overrides.sellPrice,
    isBaseUnit: overrides.isBaseUnit || false,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
}

async function createTestProductBundle(productId, overrides = {}) {
  return ProductBundle.create({
    productId: productId,
    name: overrides.name || `Test Bundle ${counter++}`,
    description: overrides.description,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });
}

async function createTestPurchaseOrder(supplierId, overrides = {}) {
  const displayId = await generateDisplayId(PurchaseOrder, "PO");
  return PurchaseOrder.create({
    displayId,
    supplierId: supplierId,
    orderDate: overrides.orderDate || "2026-01-01",
    status: overrides.status || "pending",
    notes: overrides.notes,
  });
}

async function createTestSupplierPayment(supplierId, overrides = {}) {
  const displayId = await generateDisplayId(SupplierPayment, "PAY");
  return SupplierPayment.create({
    displayId,
    supplierId: supplierId,
    amount: overrides.amount || 100.0,
    paymentDate: overrides.paymentDate || "2026-01-01",
    paymentMethod: overrides.paymentMethod || overrides.method || "cash",
    reference: overrides.reference,
    note: overrides.notes,
  });
}

async function createTestStocktaking(overrides = {}) {
  const displayId = await generateDisplayId(Stocktaking, "STK");
  return Stocktaking.create({
    displayId,
    status: overrides.status || "pending",
    notes: overrides.notes,
    startDate: overrides.startDate || "2026-01-01",
    endDate: overrides.endDate,
  });
}

async function createTestExamConsumableRule(overrides = {}) {
  return ExamConsumableRule.create({
    examType: overrides.examType || "checkup",
    productVariantId: overrides.productVariantId,
    quantity: overrides.quantity || 1,
  });
}

module.exports = {
  uniquePhone,
  uniqueSku,
  uniqueBarcode,
  createTestPatient,
  createTestAppointment,
  createTestInvoice,
  createTestExam,
  createTestFolder,
  createTestNotification,
  createTestUser,
  createTestProduct,
  createTestProductVariant,
  createTestSupplier,
  createTestBatch,
  createTestStockMovement,
  createTestPackagingUnit,
  createTestProductBundle,
  createTestPurchaseOrder,
  createTestSupplierPayment,
  createTestStocktaking,
  createTestExamConsumableRule,
};

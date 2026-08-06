export const ENUMS = {
  USER_ROLE: ["admin", "doctor", "receptionist", "viewer"] as const,
  PATIENT_TYPE: ["regular", "guardian", "child"] as const,
  GENDER: ["male", "female"] as const,
  RELATION_TYPE: ["father", "mother", "guardian", "single-father", "single-mother"] as const,
  APPOINTMENT_STATUS: ["upcoming", "confirmed", "completed", "cancelled", "no-show", "rescheduled"] as const,
  EXAM_STATUS: ["pending", "completed", "cancelled"] as const,
  INVOICE_STATUS: ["unpaid", "paid", "partially-paid", "overdue", "cancelled"] as const,
  NOTIFICATION_TYPE: ["appointment_reminder", "overdue_invoice", "follow_up_due", "disk", "backup", "welcome", "age_transition", "low_stock", "out_of_stock", "expiring_soon", "expired", "overstock", "supplier_payment_due"] as const,
  AUDIT_ACTION: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"] as const,
  BACKUP_TYPE: ["manual", "auto", "restore"] as const,
  BACKUP_STATUS: ["success", "failed"] as const,
  SETTINGS_CATEGORY: ["clinic", "backup", "notification", "ui", "inventory"] as const,
  PRODUCT_CATEGORY: ["frames", "frames-luxury", "contact-lenses", "drops", "supplies", "equipment", "other"] as const,
  COSTING_METHOD: ["fefo", "fifo", "average"] as const,
  STOCK_MOVEMENT_TYPE: ["in", "out", "adjust"] as const,
  STOCK_MOVEMENT_REASON: ["purchase", "sale", "return", "damage", "expiry", "adjustment", "dispensing", "opening_stock", "recall"] as const,
  PURCHASE_ORDER_STATUS: ["draft", "ordered", "received", "cancelled"] as const,
  SUPPLIER_PAYMENT_METHOD: ["cash", "bank_transfer", "cheque", "other"] as const,
  STOCK_REFERENCE_TYPE: ["Invoice", "PurchaseOrder", "EyeExamination", "Manual"] as const,
  ALLOWED_FILE_TYPES: ["jpg", "jpeg", "png", "gif", "pdf", "docx", "xlsx", "webp"] as const,
  ALLOWED_IMAGE_TYPES: ["jpg", "jpeg", "png", "gif", "webp"] as const,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
} as const;

export type UserRole = (typeof ENUMS.USER_ROLE)[number];
export type PatientType = (typeof ENUMS.PATIENT_TYPE)[number];
export type Gender = (typeof ENUMS.GENDER)[number];
export type RelationType = (typeof ENUMS.RELATION_TYPE)[number];
export type AppointmentStatus = (typeof ENUMS.APPOINTMENT_STATUS)[number];
export type ExamStatus = (typeof ENUMS.EXAM_STATUS)[number];
export type InvoiceStatus = (typeof ENUMS.INVOICE_STATUS)[number];
export type NotificationType = (typeof ENUMS.NOTIFICATION_TYPE)[number];
export type AuditAction = (typeof ENUMS.AUDIT_ACTION)[number];
export type BackupType = (typeof ENUMS.BACKUP_TYPE)[number];
export type BackupStatus = (typeof ENUMS.BACKUP_STATUS)[number];
export type SettingsCategory = (typeof ENUMS.SETTINGS_CATEGORY)[number];
export type ProductCategory = (typeof ENUMS.PRODUCT_CATEGORY)[number];
export type CostingMethod = (typeof ENUMS.COSTING_METHOD)[number];
export type StockMovementType = (typeof ENUMS.STOCK_MOVEMENT_TYPE)[number];
export type StockMovementReason = (typeof ENUMS.STOCK_MOVEMENT_REASON)[number];
export type PurchaseOrderStatus = (typeof ENUMS.PURCHASE_ORDER_STATUS)[number];
export type SupplierPaymentMethod = (typeof ENUMS.SUPPLIER_PAYMENT_METHOD)[number];
export type StockReferenceType = (typeof ENUMS.STOCK_REFERENCE_TYPE)[number];

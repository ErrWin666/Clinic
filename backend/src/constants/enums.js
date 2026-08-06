const ENUMS = {
  USER_ROLE: ["admin", "doctor", "receptionist", "viewer"],
  PATIENT_TYPE: ["regular", "guardian", "child"],
  GENDER: ["male", "female"],
  RELATION_TYPE: ["father", "mother", "guardian", "single-father", "single-mother"],
  APPOINTMENT_STATUS: ["upcoming", "confirmed", "completed", "cancelled", "no-show", "rescheduled"],
  EXAM_STATUS: ["pending", "completed", "cancelled"],
  // NOTE: "overdue" is a DERIVED status (unpaid + dueDate < today) and is never
  // stored in the DB. It's kept in this array only for Joi validation of the
  // status filter param and for the frontend status badge rendering.
  INVOICE_STATUS: ["unpaid", "paid", "partially-paid", "overdue", "cancelled"],
  NOTIFICATION_TYPE: [
    "appointment_reminder", "overdue_invoice", "follow_up_due", "disk", "backup", "welcome", "age_transition",
    "low_stock", "out_of_stock", "expiring_soon", "expired", "overstock", "supplier_payment_due",
  ],
  AUDIT_ACTION: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
  BACKUP_TYPE: ["manual", "auto", "restore"],
  BACKUP_STATUS: ["success", "failed"],
  SETTINGS_CATEGORY: ["clinic", "backup", "notification", "ui", "inventory"],
  // Inventory enums
  PRODUCT_CATEGORY: ["frames", "frames-luxury", "contact-lenses", "drops", "supplies", "equipment", "other"],
  COSTING_METHOD: ["fefo", "fifo", "average"],
  STOCK_MOVEMENT_TYPE: ["in", "out", "adjust"],
  STOCK_MOVEMENT_REASON: ["purchase", "sale", "return", "damage", "expiry", "adjustment", "dispensing", "opening_stock", "recall"],
  STOCK_REFERENCE_TYPE: ["Invoice", "PurchaseOrder", "EyeExamination", "Manual"],
  PURCHASE_ORDER_STATUS: ["draft", "ordered", "received", "cancelled"],
  SUPPLIER_PAYMENT_METHOD: ["cash", "bank_transfer", "cheque", "other"],
  ALLOWED_FILE_TYPES: ["jpg", "jpeg", "png", "gif", "pdf", "docx", "xlsx", "webp"],
  ALLOWED_IMAGE_TYPES: ["jpg", "jpeg", "png", "gif", "webp"],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
};

module.exports = ENUMS;

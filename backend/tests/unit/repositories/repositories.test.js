const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestSupplier, createTestPatient, createTestNotification, createTestAppointment, createTestInvoice } = require("../../helpers/factories");
const PatientRepository = require("../../../src/repositories/PatientRepository");
const InvoiceRepository = require("../../../src/repositories/InvoiceRepository");
const SettingsRepository = require("../../../src/repositories/SettingsRepository");
const AuditLogRepository = require("../../../src/repositories/AuditLogRepository");
const FileRepository = require("../../../src/repositories/FileRepository");
const FolderRepository = require("../../../src/repositories/FolderRepository");
const SupplierRepository = require("../../../src/repositories/SupplierRepository");
const SupplierPaymentRepository = require("../../../src/repositories/SupplierPaymentRepository");
const AppointmentRepository = require("../../../src/repositories/AppointmentRepository");
const NotificationRepository = require("../../../src/repositories/NotificationRepository");
const EyeExaminationRepository = require("../../../src/repositories/EyeExaminationRepository");
const UserRepository = require("../../../src/repositories/UserRepository");
const { Settings, AuditLog, User, Patient, File, Folder, Supplier, SupplierPayment } = require("../../../src/models");

describe("Repository Tests", () => {
  let patientRepo, invoiceRepo, settingsRepo, auditLogRepo, fileRepo, folderRepo, supplierRepo, supplierPaymentRepo, appointmentRepo, notificationRepo, examRepo, userRepo;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientRepo = new PatientRepository();
    invoiceRepo = new InvoiceRepository();
    settingsRepo = new SettingsRepository();
    auditLogRepo = new AuditLogRepository();
    fileRepo = new FileRepository();
    folderRepo = new FolderRepository();
    supplierRepo = new SupplierRepository();
    supplierPaymentRepo = new SupplierPaymentRepository();
    appointmentRepo = new AppointmentRepository();
    notificationRepo = new NotificationRepository();
    examRepo = new EyeExaminationRepository();
    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("PatientRepository", () => {
    it("should create a patient", async () => {
      const patient = await patientRepo.create({
        fullName: "Repo Test",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000001",
        displayId: "P-0001",
      });
      expect(patient).toBeDefined();
      expect(patient.id).toBeGreaterThan(0);
    });

    it("should find by id", async () => {
      const created = await patientRepo.create({
        fullName: "Find Me",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550000002",
        displayId: "P-0002",
      });
      const found = await patientRepo.findById(created.id);
      expect(found).toBeDefined();
      expect(found.fullName).toBe("Find Me");
    });

    it("should find by email", async () => {
      await patientRepo.create({
        fullName: "Email Repo",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000003",
        email: "repotest@test.com",
        displayId: "P-0003",
      });
      const found = await patientRepo.findByEmail("repotest@test.com");
      expect(found).toBeDefined();
      expect(found.fullName).toBe("Email Repo");
    });

    it("should return null for non-existent email", async () => {
      const found = await patientRepo.findByEmail("nonexistent@test.com");
      expect(found).toBeNull();
    });

    it("should find by id with relations", async () => {
      const created = await patientRepo.create({
        fullName: "Relations Test",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000004",
        displayId: "P-0004",
      });
      const found = await patientRepo.findByIdWithRelations(created.id);
      expect(found).toBeDefined();
      expect(found.appointments).toBeDefined();
      expect(found.eyeExaminations).toBeDefined();
      expect(found.invoices).toBeDefined();
    });

    it("should search with filters", async () => {
      const { rows, count } = await patientRepo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
        order: [["createdAt", "DESC"]],
      });
      expect(rows).toBeDefined();
      expect(count).toBeGreaterThan(0);
    });

    it("should autocomplete", async () => {
      const results = await patientRepo.autocomplete("Repo", 5);
      expect(results).toBeDefined();
      expect(results.some((r) => r.fullName.includes("Repo"))).toBe(true);
    });

    it("should check unpaid invoices (false when none)", async () => {
      const patient = await patientRepo.create({
        fullName: "No Invoices",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000005",
        displayId: "P-0005",
      });
      const has = await patientRepo.hasUnpaidInvoices(patient.id);
      expect(has).toBe(false);
    });

    it("should update patient", async () => {
      const created = await patientRepo.create({
        fullName: "Update Repo",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550000006",
        displayId: "P-0006",
      });
      const updated = await patientRepo.update(created.id, { fullName: "Updated Repo" });
      expect(updated.fullName).toBe("Updated Repo");
    });

    it("should delete patient", async () => {
      const created = await patientRepo.create({
        fullName: "Delete Repo",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000007",
        displayId: "P-0007",
      });
      await patientRepo.delete(created.id);
      await expect(patientRepo.findById(created.id)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("SettingsRepository", () => {
    it("should get all settings", async () => {
      await Settings.create({ key: "test.key1", value: JSON.stringify("val1"), category: "test" });
      await Settings.create({ key: "test.key2", value: JSON.stringify("val2"), category: "test" });
      const all = await settingsRepo.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it("should upsert setting (create new)", async () => {
      await settingsRepo.upsert("new.key", JSON.stringify("newval"), "newcat");
      const all = await settingsRepo.getAll();
      expect(all.some((s) => s.key === "new.key")).toBe(true);
    });

    it("should upsert setting (update existing)", async () => {
      await settingsRepo.upsert("upsert.key", JSON.stringify("initial"), "test");
      await settingsRepo.upsert("upsert.key", JSON.stringify("updated"), "test");
      const all = await settingsRepo.getAll();
      const setting = all.find((s) => s.key === "upsert.key");
      expect(JSON.parse(setting.value)).toBe("updated");
    });
  });

  describe("AuditLogRepository", () => {
    it("should create audit log", async () => {
      const user = await User.findOne({ where: { username: "admin" } });
      const log = await auditLogRepo.create({
        userId: user.id,
        action: "CREATE",
        entity: "Patient",
        entityId: 1,
      });
      expect(log).toBeDefined();
      expect(log.id).toBeGreaterThan(0);
    });

    it("should find all with filters", async () => {
      const { rows, count } = await auditLogRepo.findAndCountAll({
        where: { action: "CREATE" },
        offset: 0,
        limit: 10,
      });
      expect(rows).toBeDefined();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe("FileRepository", () => {
    let testPatient, testFolder, testFile;

    beforeAll(async () => {
      testPatient = await patientRepo.create({
        fullName: "File Repo Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "1112223333",
        displayId: "P-FILE-001",
      });
      testFolder = await Folder.create({
        patientId: testPatient.id,
        name: "TestFolder",
        path: "/uploads/patients/1/TestFolder",
      });
      testFile = await File.create({
        patientId: testPatient.id,
        folderId: testFolder.id,
        name: "test.pdf",
        type: "application/pdf",
        path: "/uploads/test.pdf",
        size: 1024,
      });
    });

    it("should list files by patient", async () => {
      const files = await fileRepo.listByPatient(testPatient.id);
      expect(files).toBeDefined();
      expect(files.length).toBeGreaterThan(0);
    });

    it("should list files by patient with folderId filter", async () => {
      const files = await fileRepo.listByPatient(testPatient.id, testFolder.id);
      expect(files).toBeDefined();
      expect(files.length).toBeGreaterThan(0);
      expect(files[0].folderId).toBe(testFolder.id);
    });

    it("should list files by patient with null folderId", async () => {
      const files = await fileRepo.listByPatient(testPatient.id, null);
      expect(files).toBeDefined();
    });

    it("should search with filters", async () => {
      const { rows, count } = await fileRepo.searchWithFilters({
        where: { patientId: testPatient.id },
        offset: 0,
        limit: 10,
      });
      expect(rows).toBeDefined();
      expect(count).toBeGreaterThan(0);
    });

    it("should search with filters and default order", async () => {
      const { rows } = await fileRepo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
        order: [["name", "ASC"]],
      });
      expect(rows).toBeDefined();
    });
  });

  describe("FolderRepository", () => {
    let testPatient;

    beforeAll(async () => {
      testPatient = await patientRepo.create({
        fullName: "Folder Repo Patient",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "4445556666",
        displayId: "P-FOLDER-001",
      });
      await Folder.create({ patientId: testPatient.id, name: "FolderA", path: "/uploads/patients/2/FolderA" });
      await Folder.create({ patientId: testPatient.id, name: "FolderB", path: "/uploads/patients/2/FolderB" });
    });

    it("should list folders by patient ordered by name", async () => {
      const folders = await folderRepo.listByPatient(testPatient.id);
      expect(folders).toBeDefined();
      expect(folders.length).toBeGreaterThanOrEqual(2);
      expect(folders[0].name).toBe("FolderA");
    });

    it("should search with filters", async () => {
      const { rows, count } = await folderRepo.searchWithFilters({
        where: { patientId: testPatient.id },
        offset: 0,
        limit: 10,
      });
      expect(rows).toBeDefined();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it("should search with filters and default order", async () => {
      const { rows } = await folderRepo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
        order: [["name", "DESC"]],
      });
      expect(rows).toBeDefined();
    });
  });

  describe("BaseRepository core methods", () => {
    it("should findByIdOrNull and return null when not found", async () => {
      const result = await patientRepo.findByIdOrNull(99999);
      expect(result).toBeNull();
    });

    it("should findByIdOrNull and return record when found", async () => {
      const created = await patientRepo.create({
        fullName: "Find Null Test",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000099",
        displayId: "P-0099",
      });
      const result = await patientRepo.findByIdOrNull(created.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
    });

    it("should findOne with options", async () => {
      const created = await patientRepo.create({
        fullName: "FindOne Test",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550000088",
        displayId: "P-0088",
      });
      const result = await patientRepo.findOne({ where: { id: created.id } });
      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
    });

    it("should count records", async () => {
      const count = await patientRepo.count();
      expect(count).toBeGreaterThan(0);
    });

    it("should count with where filter", async () => {
      const created = await patientRepo.create({
        fullName: "Count Filter",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000077",
        displayId: "P-0077",
      });
      const count = await patientRepo.count({ id: created.id });
      expect(count).toBe(1);
    });

    it("should throw 404 when findById not found", async () => {
      await expect(patientRepo.findById(99999)).rejects.toThrow();
      try {
        await patientRepo.findById(99999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });

    it("should delete record", async () => {
      const created = await patientRepo.create({
        fullName: "Delete Me",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000066",
        displayId: "P-0066",
      });
      const result = await patientRepo.delete(created.id);
      expect(result).toBe(true);
    });

    it("should update record", async () => {
      const created = await patientRepo.create({
        fullName: "Update Me",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550000055",
        displayId: "P-0055",
      });
      await patientRepo.update(created.id, { fullName: "Updated Name" });
      const updated = await patientRepo.findByIdOrNull(created.id);
      expect(updated.fullName).toBe("Updated Name");
    });
  });

  describe("SupplierRepository", () => {
    it("should create a supplier", async () => {
      const supplier = await createTestSupplier({ name: "Repo Test Supplier" });
      expect(supplier).toBeDefined();
      expect(supplier.id).toBeGreaterThan(0);
    });

    it("should findByIdWithPurchaseOrders", async () => {
      const supplier = await createTestSupplier({ name: "PO Supplier" });
      const result = await supplierRepo.findByIdWithPurchaseOrders(supplier.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(supplier.id);
    });

    it("should findByIdWithPayments", async () => {
      const supplier = await createTestSupplier({ name: "Payment Supplier" });
      const result = await supplierRepo.findByIdWithPayments(supplier.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(supplier.id);
    });

    it("should findByIdWithAll", async () => {
      const supplier = await createTestSupplier({ name: "All Data Supplier" });
      const result = await supplierRepo.findByIdWithAll(supplier.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(supplier.id);
    });

    it("should searchWithFilters with default order", async () => {
      await createTestSupplier({ name: "Search Supplier" });
      const { rows, count } = await supplierRepo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
      });
      expect(rows).toBeDefined();
      expect(count).toBeGreaterThan(0);
    });

    it("should sumReceivedPOsTotal and return 0 for no POs", async () => {
      const supplier = await createTestSupplier({ name: "No PO Supplier" });
      const total = await supplierRepo.sumReceivedPOsTotal(supplier.id);
      expect(total).toBe(0);
    });

    it("should sumPaymentsTotal and return 0 for no payments", async () => {
      const supplier = await createTestSupplier({ name: "No Payment Supplier" });
      const total = await supplierRepo.sumPaymentsTotal(supplier.id);
      expect(total).toBe(0);
    });
  });

  describe("SupplierPaymentRepository", () => {
    it("should findBySupplier with pagination", async () => {
      const supplier = await createTestSupplier({ name: "Payment Repo Supplier" });
      const { rows, count } = await supplierPaymentRepo.findBySupplier(supplier.id, {
        offset: 0,
        limit: 10,
      });
      expect(rows).toBeDefined();
      expect(count).toBe(0);
    });

    it("should findBySupplier with default order", async () => {
      const supplier = await createTestSupplier({ name: "Payment Order Supplier" });
      const { rows } = await supplierPaymentRepo.findBySupplier(supplier.id, {
        offset: 0,
        limit: 10,
        order: [["createdAt", "ASC"]],
      });
      expect(rows).toBeDefined();
    });

    it("should findByPurchaseOrder", async () => {
      const result = await supplierPaymentRepo.findByPurchaseOrder(99999);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should findByDateRange", async () => {
      const supplier = await createTestSupplier({ name: "Date Range Supplier" });
      const result = await supplierPaymentRepo.findByDateRange(
        supplier.id,
        "2026-01-01",
        "2026-12-31"
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("AppointmentRepository", () => {
    it("should findConflicts with excludeId", async () => {
      const patient = await createTestPatient({ fullName: "Apt Repo Patient" });
      const apt = await createTestAppointment(patient.id, {
        appointmentDate: "2026-12-08",
        startTime: "10:00",
        endTime: "11:00",
      });
      const conflicts = await appointmentRepo.findConflicts("2026-12-08", "10:30", "11:30", apt.id);
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it("should findConflicts without excludeId", async () => {
      const conflicts = await appointmentRepo.findConflicts("2026-12-08", "10:00", "11:00");
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it("should findForCalendar", async () => {
      const result = await appointmentRepo.findForCalendar("2026-01-01", "2026-12-31");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should findByPatientId", async () => {
      const patient = await createTestPatient({ fullName: "Apt Patient Repo" });
      await createTestAppointment(patient.id, {
        appointmentDate: "2026-12-09",
        startTime: "10:00",
        endTime: "11:00",
      });
      const result = await appointmentRepo.findByPatientId(patient.id);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("NotificationRepository", () => {
    it("should findUnread", async () => {
      await createTestNotification({ message: "Unread test", isRead: false });
      const result = await notificationRepo.findUnread();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should markAsRead", async () => {
      const notif = await createTestNotification({ message: "Mark read repo", isRead: false });
      const result = await notificationRepo.markAsRead(notif.id);
      expect(result.isRead).toBe(true);
    });

    it("should markAllAsRead", async () => {
      await createTestNotification({ message: "Mark all 1", isRead: false });
      await createTestNotification({ message: "Mark all 2", isRead: false });
      await notificationRepo.markAllAsRead();
      const unread = await notificationRepo.findUnread();
      expect(unread.length).toBe(0);
    });
  });

  describe("EyeExaminationRepository", () => {
    it("should findByPatientId", async () => {
      const patient = await createTestPatient({ fullName: "Exam Repo Patient" });
      const result = await examRepo.findByPatientId(patient.id);
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    it("should findByIdWithPatient", async () => {
      const result = await examRepo.findByIdWithPatient(99999);
      expect(result).toBeNull();
    });
  });

  describe("InvoiceRepository", () => {
    it("should findByIdWithItems", async () => {
      const patient = await createTestPatient({ fullName: "Invoice Repo Patient" });
      const inv = await createTestInvoice(patient.id, {
        items: [{ description: "Test item", quantity: 1, unitPrice: 100 }],
      });
      const result = await invoiceRepo.findByIdWithItems(inv.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(inv.id);
    });

    it("should findByIdWithPatient", async () => {
      const patient = await createTestPatient({ fullName: "Invoice Patient Repo" });
      const inv = await createTestInvoice(patient.id, {
        items: [{ description: "Test item", quantity: 1, unitPrice: 100 }],
      });
      const result = await invoiceRepo.findByIdWithPatient(inv.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(inv.id);
    });

    it("should searchWithFilters", async () => {
      const result = await invoiceRepo.searchWithFilters({
        where: {},
        offset: 0,
        limit: 10,
      });
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
    });

    it("should findByPatientId", async () => {
      const patient = await createTestPatient({ fullName: "Invoice By Patient Repo" });
      await createTestInvoice(patient.id, {
        items: [{ description: "Test", quantity: 1, unitPrice: 50 }],
      });
      const result = await invoiceRepo.findByPatientId(patient.id);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("UserRepository", () => {
    it("should findByUsername", async () => {
      const result = await userRepo.findByUsername("admin");
      expect(result).toBeDefined();
      expect(result.username).toBe("admin");
    });

    it("should return null for non-existent username", async () => {
      const result = await userRepo.findByUsername("nonexistent");
      expect(result).toBeNull();
    });

    it("should findAdmin", async () => {
      const result = await userRepo.findAdmin();
      expect(result).toBeDefined();
      expect(result.role).toBe("admin");
    });
  });
});

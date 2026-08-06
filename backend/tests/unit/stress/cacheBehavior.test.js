const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const PatientService = require("../../../src/services/PatientService");
const InvoiceService = require("../../../src/services/InvoiceService");
const AppointmentService = require("../../../src/services/AppointmentService");

describe("Cache Behavior & Data Consistency Tests", () => {
  let patientService, invoiceService, appointmentService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
    invoiceService = new InvoiceService();
    appointmentService = new AppointmentService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("data consistency after mutations", () => {
    it("should reflect updates immediately on next read", async () => {
      const patient = await patientService.create({
        fullName: "Cache Test",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550001111",
      });
      await patientService.update(patient.id, { fullName: "Cache Updated" });
      const read1 = await patientService.getById(patient.id);
      expect(read1.fullName).toBe("Cache Updated");
      const read2 = await patientService.getById(patient.id);
      expect(read2.fullName).toBe("Cache Updated");
    });

    it("should reflect deletion immediately on next read", async () => {
      const patient = await patientService.create({
        fullName: "Delete Cache",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550002222",
      });
      await patientService.delete(patient.id);
      await expect(patientService.getById(patient.id)).rejects.toMatchObject({ statusCode: 404 });
      await expect(patientService.getById(patient.id)).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should not show stale data after status change", async () => {
      const patient = await patientService.create({
        fullName: "Status Cache",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550003333",
      });
      const invoice = await invoiceService.create({
        patientId: patient.id,
        invoiceDate: "2026-10-01",
        items: [{ description: "Test", quantity: 1, unitPrice: 50.0 }],
      });
      await invoiceService.changeStatus(invoice.id, "paid");
      const read = await invoiceService.getById(invoice.id);
      expect(read.invoiceStatus).toBe("paid");
    });

    it("should reflect new records in list immediately", async () => {
      const before = (await patientService.list({ page: 1, pageSize: 100 })).pagination.totalItems;
      await patientService.create({
        fullName: "New Record Cache",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550004444",
      });
      const after = (await patientService.list({ page: 1, pageSize: 100 })).pagination.totalItems;
      expect(after).toBe(before + 1);
    });

    it("should maintain referential integrity on patient list", async () => {
      const patient = await patientService.create({
        fullName: "Ref Integrity",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550005555",
      });
      await invoiceService.create({
        patientId: patient.id,
        invoiceDate: "2026-10-02",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const read = await patientService.getById(patient.id);
      expect(read).toBeDefined();
      expect(read.fullName).toBe("Ref Integrity");
    });
  });

  describe("repeated reads consistency", () => {
    it("should return same data on repeated reads", async () => {
      const patient = await patientService.create({
        fullName: "Repeat Read",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550006666",
      });
      const r1 = await patientService.getById(patient.id);
      const r2 = await patientService.getById(patient.id);
      const r3 = await patientService.getById(patient.id);
      expect(r1.fullName).toBe(r2.fullName);
      expect(r2.fullName).toBe(r3.fullName);
      expect(r1.id).toBe(r2.id);
      expect(r2.id).toBe(r3.id);
    });
  });
});

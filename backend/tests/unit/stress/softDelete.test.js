const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const { createTestPatient, createTestAppointment, createTestInvoice, createTestExam } = require("../../helpers/factories");
const PatientService = require("../../../src/services/PatientService");
const AppointmentService = require("../../../src/services/AppointmentService");
const InvoiceService = require("../../../src/services/InvoiceService");
const CustomError = require("../../../src/utils/CustomError");

describe("Soft Delete Behavior", () => {
  let patientService;
  let appointmentService;
  let invoiceService;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    patientService = new PatientService();
    appointmentService = new AppointmentService();
    invoiceService = new InvoiceService();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it("should soft delete patient and return 404 on getById", async () => {
    const patient = await createTestPatient({ fullName: "SoftDelete Patient" });
    await patientService.delete(patient.id);

    await expect(patientService.getById(patient.id)).rejects.toThrow(CustomError);
    try {
      await patientService.getById(patient.id);
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });

  it("should soft delete appointment via cancellation", async () => {
    const patient = await createTestPatient({ fullName: "Apt SoftDelete Patient" });
    const apt = await createTestAppointment(patient.id, {
      appointmentDate: "2026-08-01",
      startTime: "10:00",
      endTime: "11:00",
    });

    await appointmentService.changeStatus(apt.id, "cancelled");
    const updated = await appointmentService.getById(apt.id);
    expect(updated.status).toBe("cancelled");
  });

  it("should soft delete invoice", async () => {
    const patient = await createTestPatient({ fullName: "Inv SoftDelete Patient" });
    const inv = await createTestInvoice(patient.id, {
      invoiceDate: "2026-07-23",
      items: [{ description: "X", quantity: 1, unitPrice: 10 }],
    });

    await invoiceService.delete(inv.id);
    const found = await invoiceService.getById(inv.id);
    expect(found).toBeNull();
  });

  it("should not list soft-deleted records", async () => {
    const patient = await createTestPatient({ fullName: "List SoftDelete Patient" });
    await patientService.delete(patient.id);

    const { rows } = await patientService.list({ search: "List SoftDelete" });
    expect(rows.length).toBe(0);
  });
});

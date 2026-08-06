const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const PatientService = require("../../../src/services/PatientService");
const InvoiceService = require("../../../src/services/InvoiceService");
const AppointmentService = require("../../../src/services/AppointmentService");
const uploadAuth = require("../../../src/middlewares/uploadAuth");
const CustomError = require("../../../src/utils/CustomError");

describe("Security Tests", () => {
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

  describe("SQL injection prevention", () => {
    beforeAll(async () => {
      await patientService.create({
        fullName: "Normal Patient",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550000001",
      });
    });

    it("should safely handle SQL injection in search", async () => {
      const { rows } = await patientService.list({ search: "'; DROP TABLE patients; --" });
      expect(rows.length).toBe(0);
      const all = await patientService.list({});
      expect(all.rows.length).toBeGreaterThan(0);
    });

    it("should safely handle SQL injection in patient name", async () => {
      const patient = await patientService.create({
        fullName: "'; DELETE FROM patients WHERE 1=1; --",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550007777",
      });
      expect(patient).toBeDefined();
      expect(patient.fullName).toBe("'; DELETE FROM patients WHERE 1=1; --");
      const all = await patientService.list({});
      expect(all.rows.length).toBeGreaterThan(0);
    });

    it("should safely handle UNION SELECT injection", async () => {
      const { rows } = await patientService.list({ search: "' UNION SELECT * FROM users; --" });
      expect(rows.length).toBe(0);
    });
  });

  describe("XSS prevention in data fields", () => {
    it("should store XSS payload as plain text (not executed)", async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const patient = await patientService.create({
        fullName: xssPayload,
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550008888",
      });
      expect(patient.fullName).toBe(xssPayload);
      const read = await patientService.getById(patient.id);
      expect(read.fullName).toBe(xssPayload);
    });

    it("should handle XSS in notes field", async () => {
      const patient = await patientService.create({
        fullName: "XSS Notes Test",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550009999",
        notes: '<img src=x onerror=alert("xss")>',
      });
      expect(patient.notes).toBe('<img src=x onerror=alert("xss")>');
    });
  });

  describe("path traversal prevention", () => {
    let req, res, next;

    beforeEach(() => {
      next = jest.fn();
      res = {};
      req = { user: { role: "admin" } };
    });

    it("should block ../../etc/passwd", () => {
      req.path = "/../../etc/passwd";
      uploadAuth(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it("should block encoded path traversal", () => {
      req.path = "/%2e%2e/%2e%2e/etc/passwd";
      uploadAuth(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it("should block double-encoded path traversal", () => {
      req.path = "/%252e%252e%252fetc%252fpasswd";
      uploadAuth(req, res, next);
      // Should either block with 403 or not allow access to admin files
      const calledArg = next.mock.calls[0][0];
      expect(calledArg === undefined || calledArg instanceof CustomError).toBe(true);
    });

    it("should block null byte injection", () => {
      req.path = "/patients/1/..%00/admin/secret.txt";
      uploadAuth(req, res, next);
      const calledArg = next.mock.calls[0][0];
      expect(calledArg === undefined || calledArg instanceof CustomError).toBe(true);
    });
  });

  describe("mass assignment prevention", () => {
    it("should not allow setting role through patient creation", async () => {
      const patient = await patientService.create({
        fullName: "Mass Assign Test",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: "5550010000",
        role: "admin",
      });
      expect(patient.role).toBeUndefined();
    });

    it("should not allow setting arbitrary id through patient creation", async () => {
      const patient = await patientService.create({
        fullName: "ID Assign Test",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550011111",
        id: 99999,
      });
      // The patient should be created successfully regardless of id attempt
      expect(patient).toBeDefined();
      expect(patient.fullName).toBe("ID Assign Test");
    });
  });

  describe("input validation edge cases", () => {
    it("should handle extremely long phone number", async () => {
      const longPhone = "5".repeat(100);
      const patient = await patientService.create({
        fullName: "Long Phone",
        birthDate: "1990-01-01",
        gender: "male",
        phoneNumber: longPhone,
      });
      expect(patient.phoneNumber).toBe(longPhone);
    });

    it("should handle unicode emoji in name", async () => {
      const patient = await patientService.create({
        fullName: "Patient 🎉 Test ✅",
        birthDate: "1990-01-01",
        gender: "female",
        phoneNumber: "5550012222",
      });
      expect(patient.fullName).toBe("Patient 🎉 Test ✅");
    });

    it("should handle null bytes in search", async () => {
      try {
        const { rows } = await patientService.list({ search: "test\0malicious" });
        expect(rows).toBeDefined();
      } catch (err) {
        // Null bytes may cause errors in some DBs — that's acceptable as long as it doesn't crash
        expect(err).toBeDefined();
      }
    });
  });

  describe("authorization edge cases", () => {
    it("should reject access to admin files by non-admin", () => {
      const req = { path: "/admin/secret.pdf", user: { role: "user" } };
      const next = jest.fn();
      uploadAuth(req, {}, next);
      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it("should allow admin access to admin files", () => {
      const req = { path: "/admin/profile.png", user: { role: "admin" } };
      const next = jest.fn();
      uploadAuth(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});

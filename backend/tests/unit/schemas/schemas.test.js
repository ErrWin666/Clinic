const {
  createPatientSchema,
  updatePatientSchema,
  listPatientSchema,
  autocompleteSchema,
} = require("../../../src/schemas/patientSchema");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
  statusSchema,
  calendarSchema,
  listAppointmentSchema,
} = require("../../../src/schemas/appointmentSchema");
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceStatusSchema,
  listInvoiceSchema,
} = require("../../../src/schemas/invoiceSchema");
const { loginSchema, createAdminSchema } = require("../../../src/schemas/authSchema");
const { updateSettingsSchema, updateAdminSchema } = require("../../../src/schemas/settingsSchema");

describe("Patient Schemas", () => {
  describe("createPatientSchema", () => {
    const validBody = {
      fullName: "John Doe",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "1234567890",
    };

    it("should validate valid patient data", () => {
      const { error, value } = createPatientSchema.validate({ body: validBody });
      expect(error).toBeUndefined();
      expect(value.body.fullName).toBe("John Doe");
    });

    it("should reject missing fullName", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, fullName: undefined } });
      expect(error).toBeDefined();
    });

    it("should reject fullName shorter than 2 chars", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, fullName: "A" } });
      expect(error).toBeDefined();
    });

    it("should reject invalid gender", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, gender: "other" } });
      expect(error).toBeDefined();
    });

    it("should reject invalid email", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, email: "not-an-email" } });
      expect(error).toBeDefined();
    });

    it("should accept valid email", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, email: "test@test.com" } });
      expect(error).toBeUndefined();
    });

    it("should accept null email", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, email: null } });
      expect(error).toBeUndefined();
    });

    it("should default patientType to regular", () => {
      const { value } = createPatientSchema.validate({ body: validBody });
      expect(value.body.patientType).toBe("regular");
    });

    it("should reject phoneNumber shorter than 3 chars", () => {
      const { error } = createPatientSchema.validate({ body: { ...validBody, phoneNumber: "12" } });
      expect(error).toBeDefined();
    });
  });

  describe("updatePatientSchema", () => {
    it("should validate partial update", () => {
      const { error, value } = updatePatientSchema.validate({
        body: { fullName: "Updated" },
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
      expect(value.body.fullName).toBe("Updated");
    });

    it("should reject empty body", () => {
      const { error } = updatePatientSchema.validate({ body: {}, params: { id: 1 } });
      expect(error).toBeDefined();
    });

    it("should require id param", () => {
      const { error } = updatePatientSchema.validate({ body: { fullName: "Test" }, params: {} });
      expect(error).toBeDefined();
    });
  });

  describe("listPatientSchema", () => {
    it("should validate with defaults", () => {
      const { value } = listPatientSchema.validate({ query: {} });
      expect(value.query.page).toBe(1);
      expect(value.query.pageSize).toBe(20);
      expect(value.query.sortBy).toBe("createdAt");
      expect(value.query.sortOrder).toBe("desc");
    });

    it("should validate search and filters", () => {
      const { error } = listPatientSchema.validate({
        query: { search: "test", gender: "male", patientType: "regular", minAge: 20, maxAge: 50 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject invalid sortBy", () => {
      const { error } = listPatientSchema.validate({ query: { sortBy: "invalid" } });
      expect(error).toBeDefined();
    });

    it("should reject invalid sortOrder", () => {
      const { error } = listPatientSchema.validate({ query: { sortOrder: "random" } });
      expect(error).toBeDefined();
    });
  });

  describe("autocompleteSchema", () => {
    it("should validate q and limit", () => {
      const { value } = autocompleteSchema.validate({ query: { q: "test", limit: 5 } });
      expect(value.query.q).toBe("test");
      expect(value.query.limit).toBe(5);
    });

    it("should default limit to 10", () => {
      const { value } = autocompleteSchema.validate({ query: { q: "test" } });
      expect(value.query.limit).toBe(10);
    });

    it("should reject missing q", () => {
      const { error } = autocompleteSchema.validate({ query: {} });
      expect(error).toBeDefined();
    });

    it("should reject limit > 20", () => {
      const { error } = autocompleteSchema.validate({ query: { q: "test", limit: 50 } });
      expect(error).toBeDefined();
    });
  });
});

describe("Appointment Schemas", () => {
  describe("createAppointmentSchema", () => {
    const validBody = {
      appointmentDate: "2026-01-01",
      startTime: "10:00",
      endTime: "11:00",
      appointmentType: "checkup",
      patientId: 1,
    };

    it("should validate with patientId", () => {
      const { error } = createAppointmentSchema.validate({ body: validBody });
      expect(error).toBeUndefined();
    });

    it("should validate with quickName+quickPhone instead of patientId", () => {
      const { error } = createAppointmentSchema.validate({
        body: { ...validBody, patientId: null, quickName: "Walk-in", quickPhone: "123" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject when neither patientId nor quickName+quickPhone", () => {
      const { error } = createAppointmentSchema.validate({
        body: { ...validBody, patientId: null },
      });
      expect(error).toBeDefined();
    });

    it("should reject invalid time format", () => {
      const { error } = createAppointmentSchema.validate({
        body: { ...validBody, startTime: "25:00" },
      });
      expect(error).toBeDefined();
    });

    it("should reject appointmentType shorter than 2 chars", () => {
      const { error } = createAppointmentSchema.validate({
        body: { ...validBody, appointmentType: "x" },
      });
      expect(error).toBeDefined();
    });

    it("should reject when endTime <= startTime", () => {
      const { error } = createAppointmentSchema.validate({
        body: { ...validBody, startTime: "11:00", endTime: "11:00" },
      });
      expect(error).toBeDefined();
    });

    it("should reject when endTime is before startTime", () => {
      const { error } = createAppointmentSchema.validate({
        body: { ...validBody, startTime: "14:00", endTime: "10:00" },
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateAppointmentSchema", () => {
    it("should validate partial update", () => {
      const { error } = updateAppointmentSchema.validate({
        body: { notes: "Updated notes" },
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject empty body", () => {
      const { error } = updateAppointmentSchema.validate({ body: {}, params: { id: 1 } });
      expect(error).toBeDefined();
    });

    it("should reject when endTime <= startTime in update", () => {
      const { error } = updateAppointmentSchema.validate({
        body: { startTime: "11:00", endTime: "10:00" },
        params: { id: 1 },
      });
      expect(error).toBeDefined();
    });

    it("should validate when only startTime is provided in update", () => {
      const { error } = updateAppointmentSchema.validate({
        body: { startTime: "10:00" },
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });
  });

  describe("statusSchema", () => {
    it("should validate valid status", () => {
      const { error } = statusSchema.validate({ body: { status: "upcoming" }, params: { id: 1 } });
      expect(error).toBeUndefined();
    });

    it("should reject invalid status", () => {
      const { error } = statusSchema.validate({ body: { status: "random" }, params: { id: 1 } });
      expect(error).toBeDefined();
    });
  });

  describe("calendarSchema", () => {
    it("should validate date range", () => {
      const { error } = calendarSchema.validate({
        query: { startDate: "2026-01-01", endDate: "2026-01-31" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing startDate", () => {
      const { error } = calendarSchema.validate({ query: { endDate: "2026-01-31" } });
      expect(error).toBeDefined();
    });
  });

  describe("listAppointmentSchema", () => {
    it("should validate with defaults", () => {
      const { value } = listAppointmentSchema.validate({ query: {} });
      expect(value.query.page).toBe(1);
      expect(value.query.pageSize).toBe(20);
    });

    it("should validate filters", () => {
      const { error } = listAppointmentSchema.validate({
        query: { status: "upcoming", patientId: 1, appointmentType: "checkup" },
      });
      expect(error).toBeUndefined();
    });
  });
});

describe("Invoice Schemas", () => {
  describe("createInvoiceSchema", () => {
    const validBody = {
      patientId: 1,
      invoiceDate: "2026-01-01",
      items: [{ description: "Consultation", quantity: 1, unitPrice: 50.0 }],
    };

    it("should validate with patientId", () => {
      const { error } = createInvoiceSchema.validate({ body: validBody });
      expect(error).toBeUndefined();
    });

    it("should validate with customerName instead of patientId", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validBody, patientId: null, customerName: "Walk-in Customer" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject when neither patientId nor customerName", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validBody, patientId: null },
      });
      expect(error).toBeDefined();
    });

    it("should reject empty items array", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validBody, items: [] },
      });
      expect(error).toBeDefined();
    });

    it("should reject item with negative unitPrice", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validBody, items: [{ description: "Test", quantity: 1, unitPrice: -10 }] },
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateInvoiceSchema", () => {
    it("should validate partial update", () => {
      const { error } = updateInvoiceSchema.validate({
        body: { taxAmount: 5.0 },
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject empty body", () => {
      const { error } = updateInvoiceSchema.validate({ body: {}, params: { id: 1 } });
      expect(error).toBeDefined();
    });
  });

  describe("invoiceStatusSchema", () => {
    it("should validate valid status", () => {
      const { error } = invoiceStatusSchema.validate({ body: { status: "paid" }, params: { id: 1 } });
      expect(error).toBeUndefined();
    });

    it("should reject invalid status", () => {
      const { error } = invoiceStatusSchema.validate({ body: { status: "random" }, params: { id: 1 } });
      expect(error).toBeDefined();
    });
  });

  describe("listInvoiceSchema", () => {
    it("should validate with defaults", () => {
      const { value } = listInvoiceSchema.validate({ query: {} });
      expect(value.query.page).toBe(1);
      expect(value.query.pageSize).toBe(20);
    });

    it("should validate amount filters", () => {
      const { error } = listInvoiceSchema.validate({
        query: { minAmount: 10, maxAmount: 100 },
      });
      expect(error).toBeUndefined();
    });
  });
});

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("should validate valid login", () => {
      const { error } = loginSchema.validate({ body: { username: "admin", password: "pass123" } });
      expect(error).toBeUndefined();
    });

    it("should reject short username", () => {
      const { error } = loginSchema.validate({ body: { username: "ab", password: "pass123" } });
      expect(error).toBeDefined();
    });

    it("should reject short password", () => {
      const { error } = loginSchema.validate({ body: { username: "admin", password: "12345" } });
      expect(error).toBeDefined();
    });
  });

  describe("createAdminSchema", () => {
    it("should validate valid admin creation", () => {
      const { error } = createAdminSchema.validate({
        body: {
          username: "admin",
          password: "Pass1234",
          confirmPassword: "Pass1234",
          clinicName: "Test Clinic",
        },
      });
      expect(error).toBeUndefined();
    });

    it("should reject mismatched passwords", () => {
      const { error } = createAdminSchema.validate({
        body: {
          username: "admin",
          password: "Pass1234",
          confirmPassword: "different",
          clinicName: "Test Clinic",
        },
      });
      expect(error).toBeDefined();
    });

    it("should default currency to USD and language to ar", () => {
      const { value } = createAdminSchema.validate({
        body: {
          username: "admin",
          password: "Pass1234",
          confirmPassword: "Pass1234",
          clinicName: "Test Clinic",
        },
      });
      expect(value.body.currency).toBe("USD");
      expect(value.body.language).toBe("ar");
    });
  });
});

describe("Settings Schemas", () => {
  describe("updateSettingsSchema", () => {
    it("should validate valid settings array", () => {
      const { error } = updateSettingsSchema.validate({
        body: {
          settings: [{ key: "clinic.name", value: '"Test"', category: "clinic" }],
        },
      });
      expect(error).toBeUndefined();
    });

    it("should reject empty settings array", () => {
      const { error } = updateSettingsSchema.validate({ body: { settings: [] } });
      expect(error).toBeDefined();
    });

    it("should reject invalid category", () => {
      const { error } = updateSettingsSchema.validate({
        body: { settings: [{ key: "test", value: "val", category: "invalid" }] },
      });
      expect(error).toBeDefined();
    });
  });

  describe("updateAdminSchema", () => {
    it("should validate username change with currentPassword", () => {
      const { error } = updateAdminSchema.validate({
        body: { username: "newadmin", currentPassword: "pass123" },
      });
      expect(error).toBeUndefined();
    });

    it("should validate password change with currentPassword", () => {
      const { error } = updateAdminSchema.validate({
        body: { currentPassword: "pass123", newPassword: "newpass123" },
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing currentPassword", () => {
      const { error } = updateAdminSchema.validate({ body: { username: "newadmin" } });
      expect(error).toBeDefined();
    });

    it("should reject body with only currentPassword", () => {
      const { error } = updateAdminSchema.validate({ body: { currentPassword: "pass123" } });
      expect(error).toBeDefined();
    });
  });
});

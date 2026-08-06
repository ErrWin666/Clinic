const { createInvoiceSchema, invoiceStatusSchema, listInvoiceSchema } = require("../../../src/schemas/invoiceSchema");

describe("Invoice Schema Validation", () => {
  const validInvoice = {
    patientId: 1,
    invoiceDate: "2026-07-23",
    items: [{ description: "Test item", quantity: 1, unitPrice: 50.0 }],
  };

  describe("createInvoiceSchema", () => {
    it("should pass with valid data and items", () => {
      const { error } = createInvoiceSchema.validate({
        body: validInvoice,
        query: {},
        params: {},
      });
      expect(error).toBeUndefined();
    });

    it("should pass with customerName instead of patientId", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validInvoice, patientId: null, customerName: "Walk-in" },
        query: {},
        params: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing items", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validInvoice, items: undefined },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject items with negative quantity", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validInvoice, items: [{ description: "X", quantity: -1, unitPrice: 10 }] },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject items with negative unitPrice", () => {
      const { error } = createInvoiceSchema.validate({
        body: { ...validInvoice, items: [{ description: "X", quantity: 1, unitPrice: -10 }] },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });

    it("should reject without patientId or customerName", () => {
      const { error } = createInvoiceSchema.validate({
        body: { invoiceDate: "2026-07-23", items: [{ description: "X", quantity: 1, unitPrice: 10 }] },
        query: {},
        params: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe("invoiceStatusSchema", () => {
    it("should accept unpaid", () => {
      const { error } = invoiceStatusSchema.validate({
        body: { status: "unpaid" },
        query: {},
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    it("should accept paid", () => {
      const { error } = invoiceStatusSchema.validate({
        body: { status: "paid" },
        query: {},
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    it("should accept partially-paid", () => {
      const { error } = invoiceStatusSchema.validate({
        body: { status: "partially-paid" },
        query: {},
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    it("should accept overdue", () => {
      const { error } = invoiceStatusSchema.validate({
        body: { status: "overdue" },
        query: {},
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject invalid status", () => {
      const { error } = invoiceStatusSchema.validate({
        body: { status: "invalid" },
        query: {},
        params: { id: 1 },
      });
      expect(error).toBeDefined();
    });
  });
});

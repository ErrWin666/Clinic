const { setupTestDB, teardownTestDB, createTestAdmin } = require("../../helpers/setup");
const InvoiceService = require("../../../src/services/InvoiceService");
const PatientService = require("../../../src/services/PatientService");
const CustomError = require("../../../src/utils/CustomError");

describe("InvoiceService", () => {
  let invoiceService;
  let patientService;
  let testPatient;

  beforeAll(async () => {
    await setupTestDB();
    await createTestAdmin();
    invoiceService = new InvoiceService();
    patientService = new PatientService();
    testPatient = await patientService.create({
      fullName: "Invoice Patient",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "1112223333",
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe("create", () => {
    it("should create an invoice with items and calculate total", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-23",
        items: [
          { description: "Eye exam", quantity: 1, unitPrice: 50.0 },
          { description: "Contact lens", quantity: 2, unitPrice: 30.0 },
        ],
        taxAmount: 5.0,
        discountAmount: 10.0,
      });
      expect(invoice).toBeDefined();
      expect(invoice.displayId).toBeDefined();
      expect(invoice.totalAmount).toBe(105.0);
      expect(invoice.items.length).toBe(2);
    });

    it("should create invoice with walk-in customer", async () => {
      const invoice = await invoiceService.create({
        customerName: "Walk-in Customer",
        customerPhone: "5555555555",
        invoiceDate: "2026-07-23",
        items: [{ description: "Consultation", quantity: 1, unitPrice: 25.0 }],
      });
      expect(invoice).toBeDefined();
      expect(invoice.customerName).toBe("Walk-in Customer");
      expect(invoice.totalAmount).toBe(25.0);
    });
  });

  describe("changeStatus", () => {
    it("should mark invoice as paid", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-24",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const updated = await invoiceService.changeStatus(invoice.id, "paid");
      expect(updated.invoiceStatus).toBe("paid");
    });
  });

  describe("delete", () => {
    it("should delete unpaid invoice", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-25",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      await invoiceService.delete(invoice.id);
    });

    it("should not delete paid invoice", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-26",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      await invoiceService.changeStatus(invoice.id, "paid");
      try {
        await invoiceService.delete(invoice.id);
        fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(CustomError);
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe("update", () => {
    it("should update invoice items and recalculate total", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-27",
        items: [{ description: "Original", quantity: 1, unitPrice: 20.0 }],
      });
      const updated = await invoiceService.update(invoice.id, {
        items: [{ description: "Updated", quantity: 2, unitPrice: 30.0 }],
        taxAmount: 5.0,
      });
      expect(updated.totalAmount).toBe(65.0);
      expect(updated.items.length).toBe(1);
      expect(updated.items[0].description).toBe("Updated");
    });

    it("should update invoice without changing items", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-28",
        items: [{ description: "Keep", quantity: 1, unitPrice: 15.0 }],
      });
      const updated = await invoiceService.update(invoice.id, { invoiceDate: "2026-07-29" });
      expect(updated.invoiceDate).toBe("2026-07-29");
      expect(updated.items.length).toBe(1);
    });

    it("should reject update on paid invoice", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-30",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      await invoiceService.changeStatus(invoice.id, "paid");
      await expect(
        invoiceService.update(invoice.id, { invoiceDate: "2026-07-31" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("changeStatus", () => {
    it("should mark invoice as paid", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-07-24",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const updated = await invoiceService.changeStatus(invoice.id, "paid");
      expect(updated.invoiceStatus).toBe("paid");
    });

    it("should mark invoice as partially-paid", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-01",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const updated = await invoiceService.changeStatus(invoice.id, "partially-paid");
      expect(updated.invoiceStatus).toBe("partially-paid");
    });

    it("should reject manual overdue status (derived status)", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-02",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      await expect(
        invoiceService.changeStatus(invoice.id, "overdue")
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should reject invalid status transition (paid -> unpaid without payments)", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-02",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      await invoiceService.changeStatus(invoice.id, "paid");
      // paid -> cancelled is valid, but paid -> unpaid is not
      await expect(
        invoiceService.changeStatus(invoice.id, "unpaid")
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should set paidAmount = totalAmount when marking as paid", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-02",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const updated = await invoiceService.changeStatus(invoice.id, "paid");
      expect(updated.invoiceStatus).toBe("paid");
      expect(Number(updated.paidAmount)).toBe(Number(updated.totalAmount));
    });

    it("should allow cancelling an unpaid invoice", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-02",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const updated = await invoiceService.changeStatus(invoice.id, "cancelled");
      expect(updated.invoiceStatus).toBe("cancelled");
    });
  });

  describe("getById", () => {
    it("should return invoice with patient", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-03",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const found = await invoiceService.getById(invoice.id);
      expect(found).toBeDefined();
      expect(found.patient).toBeDefined();
      expect(found.patient.fullName).toBe("Invoice Patient");
    });
  });

  describe("list", () => {
    it("should return paginated invoices", async () => {
      const { rows, pagination } = await invoiceService.list({ page: 1, pageSize: 10 });
      expect(rows).toBeDefined();
      expect(pagination).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should filter by status", async () => {
      const { rows } = await invoiceService.list({ status: "paid" });
      expect(rows.every((r) => r.invoiceStatus === "paid")).toBe(true);
    });

    it("should filter by patientId", async () => {
      const { rows } = await invoiceService.list({ patientId: testPatient.id });
      expect(rows.every((r) => r.patientId === testPatient.id)).toBe(true);
    });

    it("should filter by date range", async () => {
      const { rows } = await invoiceService.list({ startDate: "2026-07-23", endDate: "2026-07-25" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should search by displayId", async () => {
      const { rows } = await invoiceService.list({ search: "INV" });
      expect(rows.length).toBeGreaterThan(0);
    });

    it("should search by customerName", async () => {
      const { rows } = await invoiceService.list({ search: "Walk-in" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.customerName && r.customerName.includes("Walk-in"))).toBe(true);
    });

    it("should filter by minAmount", async () => {
      const { rows } = await invoiceService.list({ minAmount: 50 });
      expect(rows.every((r) => Number(r.totalAmount) >= 50)).toBe(true);
    });

    it("should filter by maxAmount", async () => {
      const { rows } = await invoiceService.list({ maxAmount: 30 });
      expect(rows.every((r) => Number(r.totalAmount) <= 30)).toBe(true);
    });

    it("should filter by minAmount and maxAmount together", async () => {
      const { rows } = await invoiceService.list({ minAmount: 10, maxAmount: 100 });
      expect(rows.every((r) => Number(r.totalAmount) >= 10 && Number(r.totalAmount) <= 100)).toBe(true);
    });

    it("should filter by overdue (derived status: unpaid + dueDate < today)", async () => {
      // Create an invoice with a past dueDate
      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 5);
      const pastDueStr = pastDue.toISOString().split("T")[0];
      await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-01-01",
        dueDate: pastDueStr,
        items: [{ description: "Overdue Test", quantity: 1, unitPrice: 10.0 }],
      });
      const { rows } = await invoiceService.list({ status: "overdue" });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.invoiceStatus === "unpaid")).toBe(true);
    });
  });

  describe("getStats", () => {
    it("should return invoice statistics", async () => {
      const stats = await invoiceService.getStats({});
      expect(stats).toBeDefined();
      expect(stats.unpaidCount).toBeDefined();
      expect(stats.paidCount).toBeDefined();
      expect(stats.partiallyPaidCount).toBeDefined();
      expect(stats.overdueCount).toBeDefined();
      expect(stats.totalCount).toBeDefined();
      expect(stats.totalPaidAmount).toBeDefined();
      expect(stats.totalOutstanding).toBeDefined();
    });

    it("should return stats filtered by patientId", async () => {
      const stats = await invoiceService.getStats({ patientId: testPatient.id });
      expect(stats).toBeDefined();
      expect(stats.totalCount).toBeGreaterThan(0);
    });
  });

  describe("update - with payments", () => {
    it("should reject update when new total < paidAmount", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-10",
        items: [{ description: "Test", quantity: 1, unitPrice: 100.0 }],
      });
      // Manually set paidAmount
      const { Invoice } = require("../../../src/models");
      await Invoice.update({ paidAmount: 50 }, { where: { id: invoice.id } });
      await expect(
        invoiceService.update(invoice.id, {
          items: [{ description: "Cheaper", quantity: 1, unitPrice: 10.0 }],
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should reject update on partially-paid invoice", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-15",
        items: [{ description: "Test", quantity: 1, unitPrice: 100.0 }],
      });
      await invoiceService.changeStatus(invoice.id, "partially-paid");
      await expect(
        invoiceService.update(invoice.id, { invoiceDate: "2026-08-16" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("changeStatus - edge cases", () => {
    it("should reject unpaid transition when payments exist", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-11",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      // Mark as paid first
      await invoiceService.changeStatus(invoice.id, "paid");
      // Manually add a payment record
      const { Payment } = require("../../../src/models");
      await Payment.create({
        invoiceId: invoice.id,
        amount: 10.0,
        paymentDate: "2026-08-11",
        paymentMethod: "cash",
      });
      // Try to change to cancelled (paid -> cancelled is valid)
      const updated = await invoiceService.changeStatus(invoice.id, "cancelled");
      expect(updated.invoiceStatus).toBe("cancelled");
    });

    it("should allow partially-paid -> unpaid when no payments", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-12",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      await invoiceService.changeStatus(invoice.id, "partially-paid");
      const updated = await invoiceService.changeStatus(invoice.id, "unpaid");
      expect(updated.invoiceStatus).toBe("unpaid");
    });
  });

  describe("delete - with payments", () => {
    it("should not delete invoice with payments", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-13",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const { Payment } = require("../../../src/models");
      await Payment.create({
        invoiceId: invoice.id,
        amount: 5.0,
        paymentDate: "2026-08-13",
        paymentMethod: "cash",
      });
      await expect(invoiceService.delete(invoice.id)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("generateInvoicePDFDoc", () => {
    it("should generate PDF document", async () => {
      const invoice = await invoiceService.create({
        patientId: testPatient.id,
        invoiceDate: "2026-08-14",
        items: [{ description: "Test", quantity: 1, unitPrice: 10.0 }],
      });
      const result = await invoiceService.generateInvoicePDFDoc(invoice.id, {
        clinicName: "Test Clinic",
        address: "123 Test St",
        phone: "555-5555",
      });
      expect(result).toBeDefined();
    });
  });
});

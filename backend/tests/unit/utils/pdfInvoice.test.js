const mockDoc = {
  internal: { pageSize: { getWidth: jest.fn(() => 210), getHeight: jest.fn(() => 297) }, getNumberOfPages: jest.fn(() => 1), getCurrentPageInfo: jest.fn(() => ({ pageNumber: 1 })) },
  addFileToVFS: jest.fn(),
  addFont: jest.fn(),
  setFont: jest.fn(),
  setFontSize: jest.fn(),
  text: jest.fn(),
  setTextColor: jest.fn(),
  setDrawColor: jest.fn(),
  setFillColor: jest.fn(),
  setLineWidth: jest.fn(),
  line: jest.fn(),
  rect: jest.fn(),
  roundedRect: jest.fn(),
  addImage: jest.fn(),
  addPage: jest.fn(),
  splitTextToSize: jest.fn((text) => [text]),
  output: jest.fn(() => Buffer.from("PDF")),
};

jest.mock("jspdf", () => ({
  jsPDF: jest.fn(() => mockDoc),
}));

jest.mock("../../../src/utils/pdf/pdfLayout", () => ({
  embedFonts: jest.fn(),
  createDrawText: jest.fn(() => jest.fn()),
}));

jest.mock("../../../src/utils/pdf/pdfFonts", () => ({
  formatDate: jest.fn((date) => String(date || "")),
}));

jest.mock("../../../src/utils/pdf/pdfLabels", () => ({
  invoice: {
    en: { invoice: "Invoice", billTo: "Bill To:", invoiceDate: "Date:", dueDate: "Due Date:", description: "Description", qty: "Qty", unitPrice: "Price", amount: "Amount", subtotal: "Subtotal", tax: "Tax", discount: "Discount", paid: "Paid", balanceDue: "Balance Due", notes: "Notes", thankYou: "Thank You" },
    ar: { invoice: "فاتورة", billTo: "فاتورة إلى:", invoiceDate: "التاريخ:", dueDate: "تاريخ الاستحقاق:", description: "الوصف", qty: "الكمية", unitPrice: "السعر", amount: "المجموع", subtotal: "المجموع الفرعي", tax: "الضريبة", discount: "الخصم", paid: "مدفوع", balanceDue: "الرصيد المستحق", notes: "ملاحظات", thankYou: "شكراً" },
  },
}));

const { generateInvoicePDF } = require("../../../src/utils/pdf/pdfInvoice");

describe("pdfInvoice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateInvoicePDF", () => {
    it("should generate a basic invoice PDF in English", () => {
      const invoice = {
        id: 1,
        displayId: "INV-001",
        invoiceDate: "2026-07-01",
        dueDate: "2026-07-15",
        patient: { fullName: "John Doe", address: "123 Main St", phoneNumber: "01000000000" },
        items: [
          { description: "Consultation", quantity: 1, unitPrice: 100 },
          { description: "Eye Exam", quantity: 1, unitPrice: 50 },
        ],
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should generate invoice PDF in Arabic", () => {
      const invoice = {
        id: 2,
        displayId: "INV-002",
        invoiceDate: "2026-07-02",
        patient: { fullName: "مريض" },
        items: [{ description: "استشارة", quantity: 1, unitPrice: 200 }],
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "ar" });
      expect(result).toBeDefined();
    });

    it("should handle invoice with tax and discount", () => {
      const invoice = {
        id: 3,
        displayId: "INV-003",
        invoiceDate: "2026-07-03",
        items: [{ description: "Service", quantity: 2, unitPrice: 100 }],
        taxAmount: 30,
        discountAmount: 20,
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle invoice with paid amount", () => {
      const invoice = {
        id: 4,
        displayId: "INV-004",
        invoiceDate: "2026-07-04",
        items: [{ description: "Service", quantity: 1, unitPrice: 200 }],
        paidAmount: 100,
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle invoice with note message", () => {
      const invoice = {
        id: 5,
        displayId: "INV-005",
        invoiceDate: "2026-07-05",
        items: [{ description: "Service", quantity: 1, unitPrice: 100 }],
        noteMessage: "Please pay within 15 days",
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle invoice without patient (customer name)", () => {
      const invoice = {
        id: 6,
        displayId: "INV-006",
        invoiceDate: "2026-07-06",
        customerName: "Walk-in Customer",
        customerPhone: "01200000000",
        items: [{ description: "Service", quantity: 1, unitPrice: 50 }],
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle invoice with no items", () => {
      const invoice = {
        id: 7,
        displayId: "INV-007",
        invoiceDate: "2026-07-07",
        patient: { fullName: "No Items Patient" },
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle minimal invoice data", () => {
      const invoice = { id: 8, displayId: "INV-008" };
      const result = generateInvoicePDF(invoice, {});
      expect(result).toBeDefined();
    });

    it("should trigger page break with many items", () => {
      const items = [];
      for (let i = 0; i < 50; i++) {
        items.push({ description: `Item ${i} with a long description that wraps`, quantity: 2, unitPrice: 50 });
      }
      const invoice = {
        id: 9,
        displayId: "INV-009",
        invoiceDate: "2026-07-09",
        patient: { fullName: "Many Items Patient" },
        items,
      };
      const result = generateInvoicePDF(invoice, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
      expect(mockDoc.addPage).toHaveBeenCalled();
    });
  });
});

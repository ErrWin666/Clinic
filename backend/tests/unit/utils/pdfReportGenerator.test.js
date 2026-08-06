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
  roundedRect: jest.fn(),
  rect: jest.fn(),
  addImage: jest.fn(),
  output: jest.fn(() => Buffer.from("PDF")),
  save: jest.fn(),
  getLastAutoTable: jest.fn(() => ({ finalY: 100 })),
};

jest.mock("jspdf", () => ({
  jsPDF: jest.fn(() => mockDoc),
}));

jest.mock("jspdf-autotable", () => ({
  autoTable: jest.fn((doc, options) => {
    // Simulate autoTable adding content
    if (options && options.didDrawPage) {
      options.didDrawPage({});
    }
    doc.lastAutoTable = { finalY: 100 };
  }),
}));

jest.mock("../../../src/utils/money", () => ({
  roundTo2: jest.fn((v) => Math.round(v * 100) / 100),
}));

jest.mock("../../../src/utils/pdf/pdfFonts", () => ({
  amiriFontBase64: "base64fontdata",
  amiriBoldFontBase64: "base64bolddata",
}));

jest.mock("../../../src/utils/pdf/pdfLabels", () => ({
  report: {
    en: { page: "Page", of: "of", generated: "Generated" },
    ar: { page: "صفحة", of: "من", generated: "تم الإنشاء" },
  },
}));

const { generateReportPDF } = require("../../../src/utils/pdfReportGenerator");

describe("pdfReportGenerator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a PDF with minimal params (English)", () => {
    const result = generateReportPDF({
      title: "Test Report",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Row 1" }],
    });

    expect(result).toBeDefined();
    expect(mockDoc.text).toHaveBeenCalled();
  });

  it("should generate a PDF with clinic settings and logo", () => {
    const result = generateReportPDF({
      title: "Inventory Report",
      subtitle: "Jan 2026 - Jun 2026",
      columns: [
        { key: "sku", label: "SKU", width: 30 },
        { key: "name", label: "Name", width: 60 },
        { key: "qty", label: "Qty", align: "right", format: (v) => String(v) },
      ],
      rows: [
        { sku: "SKU1", name: "Product 1", qty: 10 },
        { sku: "SKU2", name: "Product 2", qty: 5 },
      ],
      summary: [
        { label: "Total Items", value: 15 },
        { label: "Total Value", value: 1000.5, format: (v) => `$${v}` },
      ],
      clinicSettings: {
        name: "Test Clinic",
        address: "123 Test St",
        phone: "555-1234",
        email: "test@clinic.com",
        logoBase64: "data:image/png;base64,iVBORw0KGgo=",
        lang: "en",
      },
      totalsRow: { name: "Total", qty: 15 },
    });

    expect(result).toBeDefined();
    expect(mockDoc.addImage).toHaveBeenCalled();
  });

  it("should generate Arabic PDF when lang is ar", () => {
    const result = generateReportPDF({
      title: "تقرير المخزون",
      columns: [{ key: "name", label: "الاسم" }],
      rows: [{ name: "منتج 1" }],
      lang: "ar",
    });

    expect(result).toBeDefined();
  });

  it("should handle empty rows", () => {
    const result = generateReportPDF({
      title: "Empty Report",
      columns: [{ key: "name", label: "Name" }],
      rows: [],
    });

    expect(result).toBeDefined();
  });

  it("should handle no summary cards", () => {
    const result = generateReportPDF({
      title: "No Summary",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Row 1" }],
      summary: [],
    });

    expect(result).toBeDefined();
  });

  it("should handle no totals row", () => {
    const result = generateReportPDF({
      title: "No Totals",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Row 1" }],
    });

    expect(result).toBeDefined();
  });

  it("should handle column format functions", () => {
    const result = generateReportPDF({
      title: "Formatted Report",
      columns: [
        { key: "price", label: "Price", format: (v) => `$${v.toFixed(2)}` },
      ],
      rows: [{ price: 99.999 }],
    });

    expect(result).toBeDefined();
  });

  it("should handle invalid logo gracefully", async () => {
    const result = generateReportPDF({
      title: "Bad Logo",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Row 1" }],
      clinicSettings: {
        logoBase64: "INVALID_BASE64",
      },
    });

    expect(result).toBeDefined();
  });

  it("should format currency values", () => {
    const result = generateReportPDF({
      title: "Currency Report",
      columns: [{ key: "amount", label: "Amount", format: "currency" }],
      rows: [{ amount: 1234.56 }],
    });
    expect(result).toBeDefined();
  });

  it("should format number values", () => {
    const result = generateReportPDF({
      title: "Number Report",
      columns: [{ key: "count", label: "Count", format: "number" }],
      rows: [{ count: 12345 }],
    });
    expect(result).toBeDefined();
  });

  it("should format integer values", () => {
    const result = generateReportPDF({
      title: "Integer Report",
      columns: [{ key: "qty", label: "Qty", format: "integer" }],
      rows: [{ qty: 42.7 }],
    });
    expect(result).toBeDefined();
  });

  it("should format percentage values", () => {
    const result = generateReportPDF({
      title: "Percentage Report",
      columns: [{ key: "rate", label: "Rate", format: "percentage" }],
      rows: [{ rate: 15.5 }],
    });
    expect(result).toBeDefined();
  });

  it("should format date values", () => {
    const result = generateReportPDF({
      title: "Date Report",
      columns: [{ key: "date", label: "Date", format: "date" }],
      rows: [{ date: "2026-06-15" }],
    });
    expect(result).toBeDefined();
  });

  it("should handle null and empty values in formatValue", () => {
    const result = generateReportPDF({
      title: "Null Report",
      columns: [{ key: "empty", label: "Empty", format: "currency" }],
      rows: [{ empty: null }, { empty: "" }, { empty: undefined }],
    });
    expect(result).toBeDefined();
  });

  it("should handle center alignment columns", () => {
    const result = generateReportPDF({
      title: "Center Align",
      columns: [
        { key: "name", label: "Name" },
        { key: "status", label: "Status", align: "center" },
      ],
      rows: [{ name: "Item 1", status: "Active" }],
    });
    expect(result).toBeDefined();
  });

  it("should generate Arabic PDF with Amiri fonts", () => {
    const result = generateReportPDF({
      title: "تقرير المخزون",
      columns: [{ key: "name", label: "الاسم", align: "right" }],
      rows: [{ name: "منتج 1" }],
      lang: "ar",
      clinicSettings: { name: "عيادة", address: "العنوان", phone: "123" },
    });
    expect(result).toBeDefined();
    expect(mockDoc.addFileToVFS).toHaveBeenCalled();
    expect(mockDoc.addFont).toHaveBeenCalled();
  });

  it("should use clinicSettings lang when lang param not provided", () => {
    const result = generateReportPDF({
      title: "Lang from Settings",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Row 1" }],
      clinicSettings: { lang: "ar" },
    });
    expect(result).toBeDefined();
  });

  it("should handle totalsRow with undefined values", () => {
    const result = generateReportPDF({
      title: "Totals with gaps",
      columns: [
        { key: "name", label: "Name" },
        { key: "total", label: "Total", format: "currency" },
      ],
      rows: [{ name: "Item 1", total: 100 }],
      totalsRow: { name: "Total" },
    });
    expect(result).toBeDefined();
  });
});

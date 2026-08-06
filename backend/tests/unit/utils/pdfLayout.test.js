jest.mock("../../../src/utils/pdf/pdfFonts", () => ({
  amiriFontBase64: null,
  amiriBoldFontBase64: null,
  formatDate: jest.fn((d) => String(d)),
}));

const {
  embedFonts,
  createDrawText,
  drawClinicHeader,
  drawSeparator,
  drawSectionTitle,
  drawFieldRow,
  checkPageBreak,
  drawTableHeader,
  drawTableRow,
  drawFooter,
} = require("../../../src/utils/pdf/pdfLayout");

function createMockDoc() {
  return {
    internal: {
      pageSize: { getWidth: jest.fn(() => 210), getHeight: jest.fn(() => 297) },
      getNumberOfPages: jest.fn(() => 2),
      getCurrentPageInfo: jest.fn(() => ({ pageNumber: 1 })),
    },
    addFileToVFS: jest.fn(),
    addFont: jest.fn(),
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    setTextColor: jest.fn(),
    setDrawColor: jest.fn(),
    setFillColor: jest.fn(),
    line: jest.fn(),
    rect: jest.fn(),
    addPage: jest.fn(),
  };
}

describe("pdfLayout", () => {
  let doc;

  beforeEach(() => {
    doc = createMockDoc();
  });

  describe("embedFonts", () => {
    it("should not embed fonts when amiriFontBase64 is null", () => {
      embedFonts(doc);
      expect(doc.addFileToVFS).not.toHaveBeenCalled();
    });
  });

  describe("createDrawText", () => {
    it("should create a drawText function for English", () => {
      const drawText = createDrawText(doc, false);
      drawText("Hello", 10, 20);
      expect(doc.text).toHaveBeenCalledWith("Hello", 10, 20, undefined);
    });

    it("should create a drawText function with options", () => {
      const drawText = createDrawText(doc, false);
      drawText("Hello", 10, 20, { align: "center" });
      expect(doc.text).toHaveBeenCalledWith("Hello", 10, 20, { align: "center" });
    });

    it("should use Amiri font for Arabic when font is available", () => {
      jest.resetModules();
      jest.doMock("../../../src/utils/pdf/pdfFonts", () => ({
        amiriFontBase64: "base64font",
        amiriBoldFontBase64: "base64bold",
        formatDate: jest.fn(),
      }));
      const layout = require("../../../src/utils/pdf/pdfLayout");
      const drawText = layout.createDrawText(doc, true);
      drawText("مرحبا", 10, 20);
      expect(doc.setFont).toHaveBeenCalledWith("Amiri", "normal");
      expect(doc.text).toHaveBeenCalledWith("مرحبا", 10, 20, expect.objectContaining({ lang: "ar" }));
      jest.dontMock("../../../src/utils/pdf/pdfFonts");
      jest.resetModules();
    });
  });

  describe("drawClinicHeader", () => {
    it("should draw header with clinic name only", () => {
      const drawText = jest.fn();
      const y = drawClinicHeader(doc, { name: "Test Clinic" }, false, drawText);
      expect(y).toBe(28);
      expect(drawText).toHaveBeenCalledWith("Test Clinic", 105, 20, { align: "center" });
    });

    it("should draw header with all settings", () => {
      const drawText = jest.fn();
      const y = drawClinicHeader(doc, {
        name: "Clinic",
        address: "123 St",
        phone: "555-1234",
        email: "test@clinic.com",
      }, false, drawText);
      expect(y).toBe(43);
      expect(drawText).toHaveBeenCalledTimes(4);
    });

    it("should return 20 when no settings", () => {
      const drawText = jest.fn();
      const y = drawClinicHeader(doc, null, false, drawText);
      expect(y).toBe(20);
      expect(drawText).not.toHaveBeenCalled();
    });

    it("should handle settings with only address", () => {
      const drawText = jest.fn();
      const y = drawClinicHeader(doc, { address: "123 St" }, false, drawText);
      expect(y).toBe(25);
    });
  });

  describe("drawSeparator", () => {
    it("should draw a separator line", () => {
      const result = drawSeparator(doc, 30, 15, 210);
      expect(result).toBe(30);
      expect(doc.setDrawColor).toHaveBeenCalledWith(220);
      expect(doc.line).toHaveBeenCalledWith(15, 30, 195, 30);
    });
  });

  describe("drawSectionTitle", () => {
    it("should draw section title and return new y", () => {
      const drawText = jest.fn();
      const y = drawSectionTitle(doc, "Section", 30, 15, drawText);
      expect(y).toBe(36);
      expect(drawText).toHaveBeenCalledWith("Section", 15, 30);
    });
  });

  describe("drawFieldRow", () => {
    it("should draw field row when value exists", () => {
      const drawText = jest.fn();
      const y = drawFieldRow(drawText, "Label", "Value", 30, 15);
      expect(y).toBe(35);
      expect(drawText).toHaveBeenCalledWith("Label:", 20, 30);
      expect(drawText).toHaveBeenCalledWith("Value", 75, 30);
    });

    it("should skip when value is falsy", () => {
      const drawText = jest.fn();
      const y = drawFieldRow(drawText, "Label", "", 30, 15);
      expect(y).toBe(30);
      expect(drawText).not.toHaveBeenCalled();
    });

    it("should truncate value to maxWidth", () => {
      const drawText = jest.fn();
      drawFieldRow(drawText, "Label", "A very long value that exceeds max width", 30, 15, 10);
      expect(drawText).toHaveBeenCalledWith("A very lon", 75, 30);
    });
  });

  describe("checkPageBreak", () => {
    it("should add page when y exceeds available space", () => {
      const result = checkPageBreak(doc, 280, 30, 297, 20);
      expect(doc.addPage).toHaveBeenCalled();
      expect(result).toBe(20);
    });

    it("should not add page when y is within bounds", () => {
      const result = checkPageBreak(doc, 100, 30, 297, 20);
      expect(doc.addPage).not.toHaveBeenCalled();
      expect(result).toBe(100);
    });

    it("should use default margin of 20", () => {
      const result = checkPageBreak(doc, 280, 30, 297);
      expect(doc.addPage).toHaveBeenCalled();
    });
  });

  describe("drawTableHeader", () => {
    it("should draw table header row", () => {
      const drawText = jest.fn();
      const columns = [
        { label: "Col1", x: 15 },
        { label: "Col2", x: 60 },
      ];
      const y = drawTableHeader(doc, columns, 30, 15, 180, drawText);
      expect(y).toBe(37);
      expect(doc.rect).toHaveBeenCalledWith(15, 30, 180, 7, "F");
      expect(drawText).toHaveBeenCalledWith("Col1", 17, 35);
      expect(drawText).toHaveBeenCalledWith("Col2", 62, 35);
    });
  });

  describe("drawTableRow", () => {
    it("should draw table row with values", () => {
      const drawText = jest.fn();
      const columns = [
        { label: "Col1", x: 15 },
        { label: "Col2", x: 60 },
      ];
      const y = drawTableRow(doc, ["Val1", "Val2"], columns, 37, 15, 210, drawText);
      expect(y).toBe(43);
      expect(doc.line).toHaveBeenCalledWith(15, 37, 195, 37);
      expect(drawText).toHaveBeenCalledWith("Val1", 17, 42);
      expect(drawText).toHaveBeenCalledWith("Val2", 62, 42);
    });

    it("should handle empty values", () => {
      const drawText = jest.fn();
      const columns = [{ label: "Col1", x: 15 }];
      const y = drawTableRow(doc, [null], columns, 37, 15, 210, drawText);
      expect(y).toBe(43);
      expect(drawText).toHaveBeenCalledWith("", 17, 42);
    });
  });

  describe("drawFooter", () => {
    it("should draw English footer", () => {
      drawFooter(doc, 0, false, 210, 297);
      expect(doc.setFontSize).toHaveBeenCalledWith(7);
      expect(doc.setTextColor).toHaveBeenCalledWith(150);
      expect(doc.text).toHaveBeenCalledWith(
        expect.stringContaining("Page 1 of 2"),
        105,
        289,
        { align: "center" }
      );
      expect(doc.setTextColor).toHaveBeenCalledWith(0);
    });

    it("should draw Arabic footer", () => {
      drawFooter(doc, 0, true, 210, 297);
      expect(doc.text).toHaveBeenCalledWith(
        expect.stringContaining("صفحة"),
        105,
        289,
        { align: "center" }
      );
    });
  });
});

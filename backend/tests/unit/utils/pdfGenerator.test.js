const { generateInvoicePDF, generateExaminationPDF } = require("../../../src/utils/pdf");

jest.mock("jspdf", () => {
  const mockDoc = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    setFillColor: jest.fn(),
    setDrawColor: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    rect: jest.fn(),
    addImage: jest.fn(),
    addPage: jest.fn(),
    addFileToVFS: jest.fn(),
    addFont: jest.fn(),
    splitTextToSize: jest.fn((text) => [text]),
    output: jest.fn(() => new ArrayBuffer(100)),
  };
  return { jsPDF: jest.fn(() => mockDoc) };
});

describe("pdfGenerator", () => {
  let mockDoc;

  beforeEach(() => {
    const { jsPDF } = require("jspdf");
    mockDoc = new jsPDF();
    jest.clearAllMocks();
  });

  describe("generateInvoicePDF", () => {
    const baseInvoice = {
      displayId: "INV-2026-0001",
      invoiceDate: "2026-01-15",
      dueDate: "2026-02-15",
      patient: { fullName: "John Doe", address: "123 Main St", phoneNumber: "555-1234" },
      items: [
        { description: "Consultation", quantity: 1, unitPrice: 50 },
        { description: "Eye drops", quantity: 2, unitPrice: 15 },
      ],
      taxAmount: 8,
      discountAmount: 5,
      noteMessage: "Thank you for visiting",
      noteContactLine: "123 Clinic St",
      notePhone: "555-9999",
      noteEmail: "clinic@test.com",
    };

    it("should generate invoice PDF with English labels", () => {
      const doc = generateInvoicePDF(baseInvoice, { name: "Test Clinic", lang: "en" });
      expect(doc).toBeDefined();
      expect(mockDoc.text).toHaveBeenCalled();
      expect(mockDoc.setFont).toHaveBeenCalled();
      expect(mockDoc.setFontSize).toHaveBeenCalled();
    });

    it("should generate invoice PDF with Arabic labels", () => {
      const doc = generateInvoicePDF(baseInvoice, { name: "عيادة тест", lang: "ar" });
      expect(doc).toBeDefined();
      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should default to English when no clinicSettings", () => {
      const doc = generateInvoicePDF(baseInvoice, null);
      expect(doc).toBeDefined();
    });

    it("should default to English when no lang", () => {
      const doc = generateInvoicePDF(baseInvoice, { name: "Test" });
      expect(doc).toBeDefined();
    });

    it("should handle invoice without patient (customerName)", () => {
      const inv = { ...baseInvoice, patient: null, customerName: "Walk-in Customer", customerPhone: "555-0000" };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle invoice with logo", () => {
      const inv = { ...baseInvoice, logo: "data:image/png;base64,abc" };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
      expect(mockDoc.addImage).toHaveBeenCalled();
    });

    it("should handle invoice without logo", () => {
      const inv = { ...baseInvoice, logo: null };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
      expect(mockDoc.addImage).not.toHaveBeenCalled();
    });

    it("should handle empty items array", () => {
      const inv = { ...baseInvoice, items: [] };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle no items property", () => {
      const inv = { ...baseInvoice, items: undefined };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle tax=0 and discount=0", () => {
      const inv = { ...baseInvoice, taxAmount: 0, discountAmount: 0 };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle noteMessage null", () => {
      const inv = { ...baseInvoice, noteMessage: null };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle patient with address and phone", () => {
      const inv = { ...baseInvoice, patient: { fullName: "Jane", address: "456 Oak Ave", phoneNumber: "123-4567" } };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle patient without address", () => {
      const inv = { ...baseInvoice, patient: { fullName: "Jane", address: null, phoneNumber: null } };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle no dueDate", () => {
      const inv = { ...baseInvoice, dueDate: null };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle no noteContactLine/phone/email", () => {
      const inv = { ...baseInvoice, noteContactLine: null, notePhone: null, noteEmail: null };
      const doc = generateInvoicePDF(inv, { name: "Test", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should handle clinic name empty", () => {
      const doc = generateInvoicePDF(baseInvoice, { name: "", lang: "en" });
      expect(doc).toBeDefined();
    });

    it("should call output method to get buffer", () => {
      const doc = generateInvoicePDF(baseInvoice, { name: "Test", lang: "en" });
      const buffer = doc.output("arraybuffer");
      expect(buffer).toBeDefined();
    });
  });

  describe("generateExaminationPDF", () => {
    const baseExam = {
      displayId: "EX-0001",
      examDate: "2026-01-15",
      patient: { fullName: "John Doe", displayId: "P-0001" },
      rightEyeWithoutCorrection: "20/20",
      rightEyeWithCorrection: "20/15",
      rightEyePressure: "14",
      leftEyeWithoutCorrection: "20/25",
      leftEyeWithCorrection: "20/20",
      leftEyePressure: "16",
      cornealShapeRightEye: "Normal",
      cornealSurfaceRightEye: "Clear",
      rightEyeRetinaExamination: "Normal",
      presenceOfCataractRightEye: "None",
      lensClarityRightEye: "Clear",
      rightEyeFundusExamination: "Normal",
      cornealShapeLeftEye: "Normal",
      cornealSurfaceLeftEye: "Clear",
      leftEyeRetinaExamination: "Normal",
      presenceOfCataractLeftEye: "None",
      lensClarityLeftEye: "Clear",
      leftEyeFundusExamination: "Normal",
      rightEyeRefraction: "-1.00",
      rightEyeSphericalPower: "-1.00",
      rightEyeCylindricalPower: "-0.50",
      rightEyeAxis: "180",
      rightEyeAdditionForReading: "+1.00",
      leftEyeRefraction: "-1.25",
      leftEyeSphericalPower: "-1.25",
      leftEyeCylindricalPower: "-0.75",
      leftEyeAxis: "175",
      leftEyeAdditionForReading: "+1.00",
      rightEyeLensType: "Soft",
      rightEyeLensDiameter: "14.0",
      rightEyeBaseCurve: "8.6",
      leftEyeLensType: "Soft",
      leftEyeLensDiameter: "14.0",
      leftEyeBaseCurve: "8.6",
      frameType: "Full Rim",
      frameManufacturer: "Ray-Ban",
      frameModel: "RB2140",
      frameSize: "50-22",
      frameMaterial: "Acetate",
      frameColor: "Black",
      frameShape: "Round",
      frameLensType: "Single Vision",
      frameLensIndex: "1.5",
      frameLensCoating: "Anti-reflective",
      frameLensUVProtection: "Yes",
      frameLensColor: "Clear",
      eyeglassesPrescription: "Rx given",
      contactLensesPrescription: "CL Rx given",
      additionalTreatments: "Artificial tears",
      followUpInstructions: "Return in 2 weeks",
      generalNotes: "Patient shows mild astigmatism",
    };

    it("should generate examination PDF with all sections", () => {
      const doc = generateExaminationPDF(baseExam, { name: "Test Clinic" });
      expect(doc).toBeDefined();
      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should generate without clinic name", () => {
      const doc = generateExaminationPDF(baseExam, null);
      expect(doc).toBeDefined();
    });

    it("should generate with empty clinic name", () => {
      const doc = generateExaminationPDF(baseExam, { name: "" });
      expect(doc).toBeDefined();
    });

    it("should handle examination without patient", () => {
      const exam = { ...baseExam, patient: null };
      const doc = generateExaminationPDF(exam, { name: "Test" });
      expect(doc).toBeDefined();
    });

    it("should handle examination with minimal fields", () => {
      const exam = { displayId: "EX-0002", examDate: "2026-01-15" };
      const doc = generateExaminationPDF(exam, { name: "Test" });
      expect(doc).toBeDefined();
    });

    it("should handle generalNotes null", () => {
      const exam = { ...baseExam, generalNotes: null };
      const doc = generateExaminationPDF(exam, { name: "Test" });
      expect(doc).toBeDefined();
    });

    it("should handle generalNotes with content", () => {
      const exam = { ...baseExam, generalNotes: "Long notes that need to be rendered" };
      const doc = generateExaminationPDF(exam, { name: "Test" });
      expect(doc).toBeDefined();
    });

    it("should handle all fields null (only displayId and examDate)", () => {
      const exam = { displayId: "EX-0003", examDate: "2026-01-15", patient: { fullName: "Test", displayId: "P-0001" } };
      const doc = generateExaminationPDF(exam, { name: "Test" });
      expect(doc).toBeDefined();
    });

    it("should call output method", () => {
      const doc = generateExaminationPDF(baseExam, { name: "Test" });
      const buffer = doc.output("arraybuffer");
      expect(buffer).toBeDefined();
    });

    it("should generate examination PDF with Arabic labels", () => {
      const doc = generateExaminationPDF(baseExam, { name: "عيادة test", lang: "ar" });
      expect(doc).toBeDefined();
      expect(mockDoc.text).toHaveBeenCalled();
    });

    it("should default to English when no lang for examination", () => {
      const doc = generateExaminationPDF(baseExam, { name: "Test" });
      expect(doc).toBeDefined();
    });
  });
});

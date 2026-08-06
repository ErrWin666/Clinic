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
  splitTextToSize: jest.fn((text) => [text]),
  output: jest.fn(() => Buffer.from("PDF")),
};

jest.mock("jspdf", () => ({
  jsPDF: jest.fn(() => mockDoc),
}));

jest.mock("../../../src/utils/pdf/pdfLayout", () => ({
  embedFonts: jest.fn(),
  createDrawText: jest.fn(() => jest.fn()),
  drawClinicHeader: jest.fn(() => 30),
  drawSeparator: jest.fn(),
  drawSectionTitle: jest.fn(() => 40),
  drawFieldRow: jest.fn(() => 45),
  checkPageBreak: jest.fn((doc, y) => y),
}));

jest.mock("../../../src/utils/pdf/pdfLabels", () => ({
  examination: {
    en: { examination: "Examination", date: "Date:", vision: "Vision", contactLenses: "Contact Lenses", lensType: "Lens Type", baseCurve: "Base Curve", diameter: "Diameter", rightEye: "Right", leftEye: "Left" },
    ar: { examination: "فحص", date: "التاريخ:", vision: "الرؤية", contactLenses: "العدسات", lensType: "نوع العدسة", baseCurve: "المنحنى", diameter: "القطر", rightEye: "يمين", leftEye: "يسار" },
  },
  prescription: {
    en: { rx: "Prescription", patient: "Patient", date: "Date", eyeglasses: "Eyeglasses", sign: "Signature", contactLenses: "Contact Lenses", lensType: "Lens Type", baseCurve: "Base Curve", diameter: "Diameter", rightEye: "Right", leftEye: "Left", spherical: "SPH", cylindrical: "CYL", axis: "AXIS", addition: "ADD" },
    ar: { rx: "وصفة", patient: "المريض", date: "التاريخ", eyeglasses: "النظارات", sign: "التوقيع", contactLenses: "العدسات", lensType: "نوع العدسة", baseCurve: "المنحنى", diameter: "القطر", rightEye: "يمين", leftEye: "يسار", spherical: "SPH", cylindrical: "CYL", axis: "AXIS", addition: "ADD" },
  },
}));

const { generateExaminationPDF, generatePrescriptionPDF } = require("../../../src/utils/pdf/pdfExamination");

describe("pdfExamination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateExaminationPDF", () => {
    it("should generate examination PDF in English", () => {
      const exam = {
        id: 1,
        displayId: "EX-001",
        examDate: "2026-07-01",
        patient: { fullName: "John Doe", displayId: "PAT-001" },
        rightEyeWithoutCorrection: "20/20",
        leftEyeWithoutCorrection: "20/40",
      };
      const result = generateExaminationPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should generate examination PDF in Arabic", () => {
      const exam = {
        id: 2,
        displayId: "EX-002",
        examDate: "2026-07-02",
        patient: { fullName: "مريض", displayId: "PAT-002" },
      };
      const result = generateExaminationPDF(exam, { name: "Clinic", lang: "ar" });
      expect(result).toBeDefined();
    });

    it("should handle minimal exam data", () => {
      const exam = { id: 3, displayId: "EX-003", examDate: "2026-07-03" };
      const result = generateExaminationPDF(exam, {});
      expect(result).toBeDefined();
    });

    it("should handle exam with all fields populated", () => {
      const exam = {
        id: 4,
        displayId: "EX-004",
        examDate: "2026-07-04",
        patient: { fullName: "Jane", displayId: "PAT-004" },
        rightEyeWithoutCorrection: "20/20",
        leftEyeWithoutCorrection: "20/20",
        rightEyeWithCorrection: "20/15",
        leftEyeWithCorrection: "20/15",
        rightEyePressure: "14",
        leftEyePressure: "16",
        cornealShapeRightEye: "normal",
        cornealShapeLeftEye: "normal",
        rightEyeRefraction: "sphere",
        leftEyeRefraction: "sphere",
        rightEyeSphericalPower: "-1.00",
        leftEyeSphericalPower: "-0.75",
        eyeglassesPrescription: "Glasses",
        contactLensesPrescription: "Contacts",
        additionalTreatments: "Drops",
        followUpInstructions: "Return in 1 month",
      };
      const result = generateExaminationPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle exam with contact lens data", () => {
      const exam = {
        id: 5,
        displayId: "EX-005",
        examDate: "2026-07-05",
        patient: { fullName: "Lens Patient", displayId: "PAT-005" },
        rightEyeLensType: "Soft",
        leftEyeLensType: "RGP",
        rightEyeBaseCurve: "8.4",
        leftEyeBaseCurve: "8.6",
        rightEyeLensDiameter: "14.0",
        leftEyeLensDiameter: "14.2",
      };
      const result = generateExaminationPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle exam with partial contact lens data (only right eye)", () => {
      const exam = {
        id: 6,
        displayId: "EX-006",
        examDate: "2026-07-06",
        patient: { fullName: "Partial Lens", displayId: "PAT-006" },
        rightEyeLensType: "Soft",
      };
      const result = generateExaminationPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });
  });

  describe("generatePrescriptionPDF", () => {
    it("should generate prescription PDF in English", () => {
      const exam = {
        id: 1,
        displayId: "EX-001",
        examDate: "2026-07-01",
        patient: { fullName: "John Doe", displayId: "PAT-001" },
        rightEyeSphericalPower: "-1.00",
        leftEyeSphericalPower: "-0.75",
      };
      const result = generatePrescriptionPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should generate prescription PDF in Arabic", () => {
      const exam = {
        id: 2,
        displayId: "EX-002",
        examDate: "2026-07-02",
        patient: { fullName: "مريض", displayId: "PAT-002" },
      };
      const result = generatePrescriptionPDF(exam, { name: "Clinic", lang: "ar" });
      expect(result).toBeDefined();
    });

    it("should handle minimal prescription data", () => {
      const exam = { id: 3, displayId: "EX-003", examDate: "2026-07-03" };
      const result = generatePrescriptionPDF(exam, {});
      expect(result).toBeDefined();
    });

    it("should handle prescription with all fields", () => {
      const exam = {
        id: 4,
        displayId: "EX-004",
        examDate: "2026-07-04",
        patient: { fullName: "Jane", displayId: "PAT-004" },
        rightEyeSphericalPower: "-1.00",
        leftEyeSphericalPower: "-0.75",
        rightEyeCylindricalPower: "-0.50",
        leftEyeCylindricalPower: "-0.25",
        rightEyeAxis: "180",
        leftEyeAxis: "175",
        rightEyeAdditionForReading: "+1.00",
        leftEyeAdditionForReading: "+1.00",
        rightEyeContactLensBrand: "Acuvue",
        leftEyeContactLensBrand: "Acuvue",
        rightEyeContactLensBC: "8.4",
        leftEyeContactLensBC: "8.4",
        rightEyeContactLensDiameter: "14.0",
        leftEyeContactLensDiameter: "14.0",
        rightEyeContactLensPower: "-1.00",
        leftEyeContactLensPower: "-0.75",
        followUpInstructions: "Return in 2 weeks",
      };
      const result = generatePrescriptionPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle prescription with contact lens section data", () => {
      const exam = {
        id: 5,
        displayId: "EX-005",
        examDate: "2026-07-05",
        patient: { fullName: "Lens Patient", displayId: "PAT-005" },
        rightEyeSphericalPower: "-1.00",
        leftEyeSphericalPower: "-0.75",
        rightEyeLensType: "Soft",
        leftEyeLensType: "RGP",
        rightEyeBaseCurve: "8.4",
        leftEyeBaseCurve: "8.6",
        rightEyeLensDiameter: "14.0",
        leftEyeLensDiameter: "14.2",
      };
      const result = generatePrescriptionPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });

    it("should handle prescription with partial contact lens data (only right eye)", () => {
      const exam = {
        id: 6,
        displayId: "EX-006",
        examDate: "2026-07-06",
        patient: { fullName: "Partial Lens", displayId: "PAT-006" },
        rightEyeSphericalPower: "-1.00",
        leftEyeSphericalPower: "-0.75",
        rightEyeLensType: "Soft",
      };
      const result = generatePrescriptionPDF(exam, { name: "Clinic", lang: "en" });
      expect(result).toBeDefined();
    });
  });
});

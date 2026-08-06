const mockDoc = {
  internal: { pageSize: { getWidth: jest.fn(() => 210), getHeight: jest.fn(() => 297) } },
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

jest.mock("../../../src/utils/pdf/pdfFonts", () => ({
  formatDate: jest.fn((d) => String(d)),
  amiriFontBase64: null,
  amiriBoldFontBase64: null,
}));

jest.mock("../../../src/utils/pdf/pdfLayout", () => ({
  embedFonts: jest.fn(),
  createDrawText: jest.fn(() => jest.fn()),
  drawClinicHeader: jest.fn(() => 30),
  drawSeparator: jest.fn(),
  checkPageBreak: jest.fn(),
}));

jest.mock("../../../src/utils/pdf/pdfLabels", () => ({
  patientSummary: {
    en: {
      summary: "Patient Summary", patientInfo: "Patient Information",
      name: "Name", displayId: "ID", birthDate: "Birth Date",
      gender: "Gender", male: "Male", female: "Female",
      phone: "Phone", email: "Email", address: "Address",
      type: "Type", vip: "VIP", regular: "Regular", notes: "Notes",
      appointments: "Appointments", examDate: "Date", examTime: "Time",
      examType: "Type", examStatus: "Status", examReason: "Reason",
      examinations: "Examinations", examId: "Exam ID", examStatusLabel: "Status",
      invoices: "Invoices", invId: "Invoice ID", invDate: "Date",
      invStatus: "Status", invTotal: "Total", invPaid: "Paid",
      invRemaining: "Remaining", noData: "No records found",
    },
    ar: {
      summary: "ملخص المريض", patientInfo: "معلومات المريض",
      name: "الاسم", displayId: "رقم", birthDate: "تاريخ الميلاد",
      gender: "الجنس", male: "ذكر", female: "أنثى",
      phone: "الهاتف", email: "البريد", address: "العنوان",
      type: "النوع", vip: "VIP", regular: "عادي", notes: "ملاحظات",
      appointments: "المواعيد", examDate: "التاريخ", examTime: "الوقت",
      examType: "النوع", examStatus: "الحالة", examReason: "السبب",
      examinations: "الفحوصات", examId: "رقم الفحص", examStatusLabel: "الحالة",
      invoices: "الفواتير", invId: "رقم الفاتورة", invDate: "التاريخ",
      invStatus: "الحالة", invTotal: "الإجمالي", invPaid: "المدفوع",
      invRemaining: "المتبقي", noData: "لا توجد سجلات",
    },
  },
}));

const { generatePatientSummaryPDF } = require("../../../src/utils/pdf/pdfPatientSummary");

describe("pdfPatientSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate PDF with minimal patient data", () => {
    const patient = {
      fullName: "John Doe",
      displayId: "PAT-001",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "555-1234",
    };
    const result = generatePatientSummaryPDF(patient, { name: "Clinic" });
    expect(result).toBeDefined();
  });

  it("should generate PDF with full patient data including notes", () => {
    const patient = {
      fullName: "Jane Doe",
      displayId: "PAT-002",
      birthDate: "1985-05-15",
      gender: "female",
      phoneNumber: "555-5678",
      email: "jane@test.com",
      address: "123 Test St",
      patientType: "vip",
      notes: "This is a test note for the patient",
    };
    const result = generatePatientSummaryPDF(patient, { name: "Clinic", lang: "en" });
    expect(result).toBeDefined();
  });

  it("should generate PDF with appointments", () => {
    const patient = {
      fullName: "Patient with Appointments",
      displayId: "PAT-003",
      gender: "male",
      appointments: [
        { appointmentDate: "2026-07-01", startTime: "10:00", endTime: "11:00", appointmentType: "checkup", status: "upcoming", reason: "Annual checkup" },
        { appointmentDate: "2026-08-01", startTime: "14:00", endTime: "15:00", appointmentType: "followup", status: "completed", reason: "Follow-up" },
      ],
    };
    const result = generatePatientSummaryPDF(patient, {});
    expect(result).toBeDefined();
  });

  it("should generate PDF with examinations", () => {
    const patient = {
      fullName: "Patient with Exams",
      displayId: "PAT-004",
      gender: "male",
      eyeExaminations: [
        { displayId: "EX-001", examDate: "2026-06-01", examStatus: "completed" },
      ],
    };
    const result = generatePatientSummaryPDF(patient, {});
    expect(result).toBeDefined();
  });

  it("should generate PDF with invoices", () => {
    const patient = {
      fullName: "Patient with Invoices",
      displayId: "PAT-005",
      gender: "male",
      invoices: [
        { displayId: "INV-001", invoiceDate: "2026-06-01", invoiceStatus: "paid", totalAmount: 100, paidAmount: 100 },
        { displayId: "INV-002", invoiceDate: "2026-07-01", invoiceStatus: "unpaid", totalAmount: 200, paidAmount: 50 },
      ],
    };
    const result = generatePatientSummaryPDF(patient, {});
    expect(result).toBeDefined();
  });

  it("should generate PDF with all sections", () => {
    const patient = {
      fullName: "Full Patient",
      displayId: "PAT-006",
      birthDate: "1990-01-01",
      gender: "male",
      phoneNumber: "555-0000",
      email: "full@test.com",
      address: "123 Full St",
      patientType: "regular",
      notes: "Full notes",
      appointments: [{ appointmentDate: "2026-07-01", startTime: "10:00", endTime: "11:00", appointmentType: "checkup", status: "upcoming" }],
      eyeExaminations: [{ displayId: "EX-001", examDate: "2026-06-01", examStatus: "completed" }],
      invoices: [{ displayId: "INV-001", invoiceDate: "2026-06-01", invoiceStatus: "paid", totalAmount: 100, paidAmount: 100 }],
    };
    const result = generatePatientSummaryPDF(patient, { name: "Clinic", lang: "en" });
    expect(result).toBeDefined();
  });

  it("should show no data message when patient has no records", () => {
    const patient = {
      fullName: "Empty Patient",
      displayId: "PAT-007",
      gender: "male",
    };
    const result = generatePatientSummaryPDF(patient, {});
    expect(result).toBeDefined();
  });

  it("should generate Arabic PDF when lang is ar", () => {
    const patient = {
      fullName: "مريض عربي",
      displayId: "PAT-008",
      gender: "male",
      phoneNumber: "555-0000",
    };
    const result = generatePatientSummaryPDF(patient, { lang: "ar" });
    expect(result).toBeDefined();
  });
});

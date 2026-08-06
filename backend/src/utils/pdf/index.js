const { generateInvoicePDF } = require("./pdfInvoice");
const { generateExaminationPDF, generatePrescriptionPDF } = require("./pdfExamination");
const { generatePatientSummaryPDF } = require("./pdfPatientSummary");

module.exports = {
  generateInvoicePDF,
  generateExaminationPDF,
  generatePrescriptionPDF,
  generatePatientSummaryPDF,
};

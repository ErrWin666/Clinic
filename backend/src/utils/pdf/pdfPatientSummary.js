const { jsPDF } = require("jspdf");
const { formatDate } = require("./pdfFonts");
const { embedFonts, createDrawText, drawClinicHeader, drawSeparator, checkPageBreak } = require("./pdfLayout");
const { patientSummary: summaryLabels } = require("./pdfLabels");

function generatePatientSummaryPDF(patient, clinicSettings) {
  const lang = (clinicSettings && clinicSettings.lang) || "en";
  const isArabic = lang === "ar";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  embedFonts(doc);
  const drawText = createDrawText(doc, isArabic);
  const L = isArabic ? summaryLabels.ar : summaryLabels.en;

  // Clinic header
  y = drawClinicHeader(doc, clinicSettings, isArabic, drawText);

  y += 3;
  drawSeparator(doc, y, margin, pageWidth);
  y += 8;

  // Title
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  drawText(L.summary, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  // Patient info section
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  drawText(L.patientInfo, margin, y);
  y += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  const infoFields = [
    [L.name, patient.fullName],
    [L.displayId, patient.displayId],
    [L.birthDate, patient.birthDate ? formatDate(patient.birthDate) : ""],
    [L.gender, patient.gender === "male" ? L.male : patient.gender === "female" ? L.female : patient.gender],
    [L.phone, patient.phoneNumber || ""],
    [L.email, patient.email || ""],
    [L.address, patient.address || ""],
    [L.type, patient.patientType === "vip" ? L.vip : L.regular],
  ];

  for (const [label, value] of infoFields) {
    if (value) {
      checkPageBreak(6);
      drawText(`${label}:`, margin, y);
      drawText(String(value).substring(0, 70), margin + 40, y);
      y += 5;
    }
  }

  if (patient.notes) {
    checkPageBreak(10);
    drawText(`${L.notes}:`, margin, y);
    y += 5;
    const noteLines = doc.splitTextToSize(patient.notes, contentWidth - 5);
    drawText(noteLines, margin, y);
    y += noteLines.length * 5 + 3;
  }

  y += 4;

  // Appointments
  if (patient.appointments && patient.appointments.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    drawText(L.appointments, margin, y);
    y += 6;
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);

    const colX = [margin, margin + 45, margin + 80, margin + 115, margin + 145];
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, 7, "F");
    drawText(L.examDate, colX[0] + 2, y + 5);
    drawText(L.examTime, colX[1] + 2, y + 5);
    drawText(L.examType, colX[2] + 2, y + 5);
    drawText(L.examStatus, colX[3] + 2, y + 5);
    drawText(L.examReason, colX[4] + 2, y + 5);
    y += 7;

    for (const appt of patient.appointments) {
      checkPageBreak(7);
      doc.setDrawColor(235);
      doc.line(margin, y, pageWidth - margin, y);
      drawText(formatDate(appt.appointmentDate), colX[0] + 2, y + 5);
      drawText(`${appt.startTime || ""}-${appt.endTime || ""}`, colX[1] + 2, y + 5);
      drawText(String(appt.appointmentType || "").substring(0, 20), colX[2] + 2, y + 5);
      drawText(String(appt.status || ""), colX[3] + 2, y + 5);
      drawText(String(appt.reason || "").substring(0, 25), colX[4] + 2, y + 5);
      y += 6;
    }
    y += 5;
  }

  // Examinations
  if (patient.eyeExaminations && patient.eyeExaminations.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    drawText(L.examinations, margin, y);
    y += 6;
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);

    const colX2 = [margin, margin + 50, margin + 120];
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, 7, "F");
    drawText(L.examId, colX2[0] + 2, y + 5);
    drawText(L.examDate, colX2[1] + 2, y + 5);
    drawText(L.examStatusLabel, colX2[2] + 2, y + 5);
    y += 7;

    for (const exam of patient.eyeExaminations) {
      checkPageBreak(7);
      doc.setDrawColor(235);
      doc.line(margin, y, pageWidth - margin, y);
      drawText(exam.displayId || "", colX2[0] + 2, y + 5);
      drawText(formatDate(exam.examDate), colX2[1] + 2, y + 5);
      drawText(String(exam.examStatus || ""), colX2[2] + 2, y + 5);
      y += 6;
    }
    y += 5;
  }

  // Invoices
  if (patient.invoices && patient.invoices.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    drawText(L.invoices, margin, y);
    y += 6;
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);

    const colX3 = [margin, margin + 40, margin + 75, margin + 105, margin + 130, margin + 155];
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, 7, "F");
    drawText(L.invId, colX3[0] + 2, y + 5);
    drawText(L.invDate, colX3[1] + 2, y + 5);
    drawText(L.invStatus, colX3[2] + 2, y + 5);
    drawText(L.invTotal, colX3[3] + 2, y + 5);
    drawText(L.invPaid, colX3[4] + 2, y + 5);
    drawText(L.invRemaining, colX3[5] + 2, y + 5);
    y += 7;

    for (const inv of patient.invoices) {
      checkPageBreak(7);
      doc.setDrawColor(235);
      doc.line(margin, y, pageWidth - margin, y);
      drawText(inv.displayId || "", colX3[0] + 2, y + 5);
      drawText(formatDate(inv.invoiceDate), colX3[1] + 2, y + 5);
      drawText(String(inv.invoiceStatus || ""), colX3[2] + 2, y + 5);
      drawText(Number(inv.totalAmount || 0).toFixed(2), colX3[3] + 2, y + 5);
      drawText(Number(inv.paidAmount || 0).toFixed(2), colX3[4] + 2, y + 5);
      const remaining = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
      drawText(remaining.toFixed(2), colX3[5] + 2, y + 5);
      y += 6;
    }
  }

  if (!patient.appointments?.length && !patient.eyeExaminations?.length && !patient.invoices?.length) {
    checkPageBreak(8);
    doc.setFontSize(9);
    doc.setTextColor(150);
    drawText(L.noData, pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0);
  }

  return doc;
}

module.exports = { generatePatientSummaryPDF };

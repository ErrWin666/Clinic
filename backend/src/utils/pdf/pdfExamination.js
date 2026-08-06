const { jsPDF } = require("jspdf");
const { embedFonts, createDrawText, drawClinicHeader, drawSeparator, drawSectionTitle, drawFieldRow, checkPageBreak } = require("./pdfLayout");
const { examination: examLabels, prescription: rxLabels } = require("./pdfLabels");

const EXAM_SECTIONS_AR = (L, ex) => [
  { title: L.vision, fields: [
    [L.rightEyeWithout, ex.rightEyeWithoutCorrection],
    [L.rightEyeWith, ex.rightEyeWithCorrection],
    [L.rightEyePressure, ex.rightEyePressure],
    [L.leftEyeWithout, ex.leftEyeWithoutCorrection],
    [L.leftEyeWith, ex.leftEyeWithCorrection],
    [L.leftEyePressure, ex.leftEyePressure],
  ]},
  { title: L.corneaLens, fields: [
    [L.cornealShapeR, ex.cornealShapeRightEye],
    [L.cornealSurfaceR, ex.cornealSurfaceRightEye],
    [L.retinaR, ex.rightEyeRetinaExamination],
    [L.cataractR, ex.presenceOfCataractRightEye],
    [L.lensClarityR, ex.lensClarityRightEye],
    [L.fundusR, ex.rightEyeFundusExamination],
    [L.cornealShapeL, ex.cornealShapeLeftEye],
    [L.cornealSurfaceL, ex.cornealSurfaceLeftEye],
    [L.retinaL, ex.leftEyeRetinaExamination],
    [L.cataractL, ex.presenceOfCataractLeftEye],
    [L.lensClarityL, ex.lensClarityLeftEye],
    [L.fundusL, ex.leftEyeFundusExamination],
  ]},
  { title: L.prescription, fields: [
    [L.refractionR, ex.rightEyeRefraction],
    [L.sphericalR, ex.rightEyeSphericalPower],
    [L.cylindricalR, ex.rightEyeCylindricalPower],
    [L.axisR, ex.rightEyeAxis],
    [L.additionR, ex.rightEyeAdditionForReading],
    [L.refractionL, ex.leftEyeRefraction],
    [L.sphericalL, ex.leftEyeSphericalPower],
    [L.cylindricalL, ex.leftEyeCylindricalPower],
    [L.axisL, ex.leftEyeAxis],
    [L.additionL, ex.leftEyeAdditionForReading],
  ]},
  { title: L.contactLenses, fields: [
    [L.lensTypeR, ex.rightEyeLensType],
    [L.lensDiameterR, ex.rightEyeLensDiameter],
    [L.baseCurveR, ex.rightEyeBaseCurve],
    [L.lensTypeL, ex.leftEyeLensType],
    [L.lensDiameterL, ex.leftEyeLensDiameter],
    [L.baseCurveL, ex.leftEyeBaseCurve],
  ]},
  { title: L.frame, fields: [
    [L.frameType, ex.frameType],
    [L.manufacturer, ex.frameManufacturer],
    [L.model, ex.frameModel],
    [L.size, ex.frameSize],
    [L.material, ex.frameMaterial],
    [L.color, ex.frameColor],
    [L.shape, ex.frameShape],
  ]},
  { title: L.frameLenses, fields: [
    [L.frameLensType, ex.frameLensType],
    [L.frameLensIndex, ex.frameLensIndex],
    [L.coating, ex.frameLensCoating],
    [L.uvProtection, ex.frameLensUVProtection],
    [L.frameLensColor, ex.frameLensColor],
  ]},
  { title: L.prescriptions, fields: [
    [L.eyeglassesRx, ex.eyeglassesPrescription],
    [L.contactLensesRx, ex.contactLensesPrescription],
    [L.additionalTreatments, ex.additionalTreatments],
    [L.followUp, ex.followUpInstructions],
  ]},
];

const EXAM_SECTIONS_EN = (ex) => [
  { title: "Vision & Eye Pressure", fields: [
    ["Right Eye (Without Correction)", ex.rightEyeWithoutCorrection],
    ["Right Eye (With Correction)", ex.rightEyeWithCorrection],
    ["Right Eye Pressure", ex.rightEyePressure],
    ["Left Eye (Without Correction)", ex.leftEyeWithoutCorrection],
    ["Left Eye (With Correction)", ex.leftEyeWithCorrection],
    ["Left Eye Pressure", ex.leftEyePressure],
  ]},
  { title: "Cornea & Lens", fields: [
    ["Corneal Shape (Right)", ex.cornealShapeRightEye],
    ["Corneal Surface (Right)", ex.cornealSurfaceRightEye],
    ["Retina (Right)", ex.rightEyeRetinaExamination],
    ["Cataract (Right)", ex.presenceOfCataractRightEye],
    ["Lens Clarity (Right)", ex.lensClarityRightEye],
    ["Fundus (Right)", ex.rightEyeFundusExamination],
    ["Corneal Shape (Left)", ex.cornealShapeLeftEye],
    ["Corneal Surface (Left)", ex.cornealSurfaceLeftEye],
    ["Retina (Left)", ex.leftEyeRetinaExamination],
    ["Cataract (Left)", ex.presenceOfCataractLeftEye],
    ["Lens Clarity (Left)", ex.lensClarityLeftEye],
    ["Fundus (Left)", ex.leftEyeFundusExamination],
  ]},
  { title: "Prescription", fields: [
    ["Refraction (Right)", ex.rightEyeRefraction],
    ["Spherical Power (Right)", ex.rightEyeSphericalPower],
    ["Cylindrical Power (Right)", ex.rightEyeCylindricalPower],
    ["Axis (Right)", ex.rightEyeAxis],
    ["Addition (Right)", ex.rightEyeAdditionForReading],
    ["Refraction (Left)", ex.leftEyeRefraction],
    ["Spherical Power (Left)", ex.leftEyeSphericalPower],
    ["Cylindrical Power (Left)", ex.leftEyeCylindricalPower],
    ["Axis (Left)", ex.leftEyeAxis],
    ["Addition (Left)", ex.leftEyeAdditionForReading],
  ]},
  { title: "Contact Lenses", fields: [
    ["Lens Type (Right)", ex.rightEyeLensType],
    ["Lens Diameter (Right)", ex.rightEyeLensDiameter],
    ["Base Curve (Right)", ex.rightEyeBaseCurve],
    ["Lens Type (Left)", ex.leftEyeLensType],
    ["Lens Diameter (Left)", ex.leftEyeLensDiameter],
    ["Base Curve (Left)", ex.leftEyeBaseCurve],
  ]},
  { title: "Frame", fields: [
    ["Type", ex.frameType],
    ["Manufacturer", ex.frameManufacturer],
    ["Model", ex.frameModel],
    ["Size", ex.frameSize],
    ["Material", ex.frameMaterial],
    ["Color", ex.frameColor],
    ["Shape", ex.frameShape],
  ]},
  { title: "Frame Lenses", fields: [
    ["Lens Type", ex.frameLensType],
    ["Lens Index", ex.frameLensIndex],
    ["Coating", ex.frameLensCoating],
    ["UV Protection", ex.frameLensUVProtection],
    ["Color", ex.frameLensColor],
  ]},
  { title: "Prescriptions & Instructions", fields: [
    ["Eyeglasses Prescription", ex.eyeglassesPrescription],
    ["Contact Lenses Prescription", ex.contactLensesPrescription],
    ["Additional Treatments", ex.additionalTreatments],
    ["Follow-up Instructions", ex.followUpInstructions],
  ]},
];

function generateExaminationPDF(examination, clinicSettings) {
  const lang = (clinicSettings && clinicSettings.lang) || "en";
  const isArabic = lang === "ar";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  embedFonts(doc);
  const drawText = createDrawText(doc, isArabic);

  let y = drawClinicHeader(doc, clinicSettings, isArabic, drawText);

  const L = examLabels.ar;
  doc.setFontSize(14);
  drawText(`${isArabic ? L.examination : "Examination"} ${examination.displayId}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  drawText(`${isArabic ? L.date : "Date:"} ${examination.examDate}`, margin, y);
  y += 7;

  if (examination.patient) {
    drawText(`${isArabic ? L.patient : "Patient:"} ${examination.patient.fullName} (${examination.patient.displayId})`, margin, y);
    y += 7;
  }

  y += 5;
  drawSeparator(doc, y, margin, pageWidth);
  y += 7;

  const sections = isArabic
    ? EXAM_SECTIONS_AR(examLabels.ar, examination)
    : EXAM_SECTIONS_EN(examination);

  for (const section of sections) {
    y = checkPageBreak(doc, y, 15, pageHeight, margin);
    y = drawSectionTitle(doc, section.title, y, margin, drawText);

    for (const [label, value] of section.fields) {
      y = checkPageBreak(doc, y, 8, pageHeight, margin);
      y = drawFieldRow(drawText, label, value, y, margin);
    }
    y += 4;
  }

  return doc;
}

function generatePrescriptionPDF(examination, clinicSettings) {
  const lang = (clinicSettings && clinicSettings.lang) || "en";
  const isArabic = lang === "ar";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  embedFonts(doc);
  const drawText = createDrawText(doc, isArabic);
  const L = isArabic ? rxLabels.ar : rxLabels.en;

  let y = drawClinicHeader(doc, clinicSettings, isArabic, drawText);

  y += 5;
  drawSeparator(doc, y, margin, pageWidth);
  y += 10;

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  drawText(L.rx, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  if (examination.patient) {
    drawText(`${L.patient} ${examination.patient.fullName} (${examination.patient.displayId})`, margin, y);
  }
  drawText(`${L.date} ${examination.examDate}`, pageWidth - margin, y, { align: "right" });
  y += 10;

  y = drawEyeglassesTable(doc, drawText, L, examination, y, pageWidth, margin);
  y = drawContactLensesSection(doc, drawText, L, examination, y, pageWidth, pageHeight, margin);
  y = drawFollowUpSection(doc, drawText, L, examination, y, pageWidth, pageHeight, margin);

  y += 15;
  y = checkPageBreak(doc, y, 10, pageHeight, margin);
  doc.setDrawColor(200);
  doc.line(pageWidth - 80, y, pageWidth - margin, y);
  doc.setFontSize(8);
  drawText(L.sign, pageWidth - 50, y + 5, { align: "center" });

  return doc;
}

function drawEyeglassesTable(doc, drawText, L, ex, y, pageWidth, margin) {
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  drawText(L.eyeglasses, margin, y);
  y += 7;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  let colX = [30, 75, 120, 165];
  const headers = ["", L.spherical, L.cylindrical, L.axis];
  const isArabic = L === rxLabels.ar;
  if (isArabic) {
    headers.reverse();
    colX.reverse();
    colX = colX.map((x) => pageWidth - x);
  }

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setFont(undefined, "bold");
  drawText(L.rightEye, colX[0], y + 5.5);
  drawText(headers[1], colX[1], y + 5.5);
  drawText(headers[2], colX[2], y + 5.5);
  drawText(headers[3], colX[3], y + 5.5);
  y += 8;
  doc.setFont(undefined, "normal");

  const rows = [
    [String(ex.rightEyeRefraction || ""), String(ex.rightEyeSphericalPower || ""), String(ex.rightEyeCylindricalPower || ""), String(ex.rightEyeAxis || "")],
    [L.leftEye, String(ex.leftEyeSphericalPower || ""), String(ex.leftEyeCylindricalPower || ""), String(ex.leftEyeAxis || "")],
    [L.addition, String(ex.rightEyeAdditionForReading || ""), String(ex.leftEyeAdditionForReading || ""), ""],
  ];

  for (const row of rows) {
    doc.setDrawColor(235);
    doc.line(margin, y, pageWidth - margin, y);
    drawText(row[0], colX[0], y + 5.5);
    drawText(row[1], colX[1], y + 5.5);
    drawText(row[2], colX[2], y + 5.5);
    drawText(row[3], colX[3], y + 5.5);
    y += 8;
  }
  doc.line(margin, y, pageWidth - margin, y);
  return y + 10;
}

function drawContactLensesSection(doc, drawText, L, ex, y, pageWidth, pageHeight, margin) {
  const hasData = ex.rightEyeLensType || ex.leftEyeLensType ||
    ex.rightEyeBaseCurve || ex.leftEyeBaseCurve ||
    ex.rightEyeLensDiameter || ex.leftEyeLensDiameter;

  if (!hasData) return y;

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  drawText(L.contactLenses, margin, y);
  y += 7;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  const fields = [
    [L.lensType, ex.rightEyeLensType, ex.leftEyeLensType],
    [L.baseCurve, ex.rightEyeBaseCurve, ex.leftEyeBaseCurve],
    [L.diameter, ex.rightEyeLensDiameter, ex.leftEyeLensDiameter],
  ];

  for (const [label, rv, lv] of fields) {
    if (rv || lv) {
      drawText(`${label}:`, margin + 5, y);
      drawText(`${L.rightEye}: ${rv || "—"}`, margin + 50, y);
      drawText(`${L.leftEye}: ${lv || "—"}`, margin + 110, y);
      y += 6;
    }
  }
  return y + 5;
}

function drawFollowUpSection(doc, drawText, L, ex, y, pageWidth, pageHeight, margin) {
  if (!ex.followUpInstructions) return y;

  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  drawText(L.followUp, margin, y);
  y += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(String(ex.followUpInstructions), pageWidth - margin * 2);
  drawText(lines, margin, y);
  y += lines.length * 5 + 5;
  return y;
}

module.exports = { generateExaminationPDF, generatePrescriptionPDF };

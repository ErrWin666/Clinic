const { amiriFontBase64, amiriBoldFontBase64 } = require("./pdfFonts");

function embedFonts(doc) {
  if (amiriFontBase64) {
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  }
  if (amiriBoldFontBase64) {
    doc.addFileToVFS("Amiri-Bold.ttf", amiriBoldFontBase64);
    doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
  }
}

function createDrawText(doc, isArabic) {
  return function drawText(text, x, y, options) {
    if (isArabic && amiriFontBase64) {
      doc.setFont("Amiri", (options && options.bold) ? "bold" : "normal");
      doc.text(text, x, y, { ...options, lang: "ar" });
    } else {
      doc.text(text, x, y, options);
    }
  };
}

function drawClinicHeader(doc, settings, isArabic, drawText) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  if (settings && settings.name) {
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    drawText(settings.name, pageWidth / 2, y, { align: "center" });
    y += 8;
  }
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  if (settings && settings.address) {
    drawText(settings.address, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  if (settings && settings.phone) {
    drawText(settings.phone, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  if (settings && settings.email) {
    drawText(settings.email, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  return y;
}

function drawSeparator(doc, y, margin, pageWidth) {
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  return y;
}

function drawSectionTitle(doc, title, y, margin, drawText) {
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  drawText(title, margin, y);
  y += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  return y;
}

function drawFieldRow(drawText, label, value, y, margin, maxWidth) {
  if (value) {
    drawText(`${label}:`, margin + 5, y);
    drawText(String(value).substring(0, maxWidth || 60), margin + 60, y);
    y += 5;
  }
  return y;
}

function checkPageBreak(doc, y, neededSpace, pageHeight, margin) {
  if (y + neededSpace > pageHeight - (margin || 20)) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawTableHeader(doc, columns, y, margin, contentWidth, drawText) {
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 7, "F");
  for (let i = 0; i < columns.length; i++) {
    drawText(columns[i].label, columns[i].x + 2, y + 5);
  }
  return y + 7;
}

function drawTableRow(doc, values, columns, y, margin, pageWidth, drawText) {
  doc.setDrawColor(235);
  doc.line(margin, y, pageWidth - margin, y);
  for (let i = 0; i < columns.length; i++) {
    drawText(String(values[i] || ""), columns[i].x + 2, y + 5);
  }
  return y + 6;
}

function drawFooter(doc, pageIndex, isArabic, pageWidth, pageHeight) {
  const pageCount = doc.internal.getNumberOfPages();
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(7);
  doc.setTextColor(150);
  const footerText = isArabic
    ? `صفحة ${currentPage} من ${pageCount} — ${new Date().toLocaleDateString("ar")}`
    : `Page ${currentPage} of ${pageCount} — ${new Date().toLocaleDateString()}`;
  doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: "center" });
  doc.setTextColor(0);
}

module.exports = {
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
};

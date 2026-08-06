const { jsPDF } = require("jspdf");
const { autoTable } = require("jspdf-autotable");
const { roundTo2 } = require("./money");
const { amiriFontBase64, amiriBoldFontBase64 } = require("./pdf/pdfFonts");
const { report: reportLabels } = require("./pdf/pdfLabels");

const COLORS = {
  primary: [37, 99, 235],      // blue-600
  primaryLight: [219, 234, 254], // blue-100
  headerBg: [37, 99, 235],
  headerText: [255, 255, 255],
  rowAlt: [248, 250, 252],     // slate-50
  border: [226, 232, 240],     // slate-200
  text: [30, 41, 59],          // slate-800
  muted: [100, 116, 139],      // slate-500
  totalBg: [241, 245, 249],    // slate-100
};

/**
 * Generate a PDF report with header, summary cards, data table, and footer.
 *
 * @param {Object} params
 * @param {string} params.title - Report title (already translated)
 * @param {string} [params.subtitle] - Subtitle (e.g., date range)
 * @param {Array} params.columns - Column definitions: { key, label, width?, align?, format? }
 * @param {Array} params.rows - Array of row objects keyed by column.key
 * @param {Array} [params.summary] - Summary cards: { label, value, format? }
 * @param {Object} [params.clinicSettings] - Clinic info: { name, address, phone, email, logoBase64, lang }
 * @param {string} [params.lang] - Language: "en" or "ar"
 * @param {Object} [params.totalsRow] - Optional totals row: { [key]: value }
 * @returns {jsPDF} The generated PDF document
 */
function generateReportPDF({
  title,
  subtitle,
  columns,
  rows,
  summary,
  clinicSettings,
  lang,
  totalsRow,
}) {
  const language = lang || (clinicSettings && clinicSettings.lang) || "en";
  const isArabic = language === "ar";
  const L = isArabic ? reportLabels.ar : reportLabels.en;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Embed Amiri fonts for Arabic support
  if (amiriFontBase64) {
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  }
  if (amiriBoldFontBase64) {
    doc.addFileToVFS("Amiri-Bold.ttf", amiriBoldFontBase64);
    doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
  }

  function setFont(size, style) {
    if (isArabic && amiriFontBase64) {
      doc.setFont("Amiri", style || "normal");
    } else {
      doc.setFont("helvetica", style || "normal");
    }
    doc.setFontSize(size);
  }

  function drawText(text, x, y, options) {
    if (isArabic && amiriFontBase64) {
      doc.text(String(text), x, y, { ...options, lang: "ar" });
    } else {
      doc.text(String(text), x, y, options);
    }
  }

  // === Header ===
  const headerY = margin;
  const logoSize = 20;
  const logoBase64 = (clinicSettings && clinicSettings.logoBase64) || "";
  const hasLogo = !!logoBase64;

  if (hasLogo) {
    try {
      doc.addImage(logoBase64, "PNG", margin, headerY, logoSize, logoSize, undefined, "FAST");
    } catch (_e) {
      // skip if image format unsupported
    }
  }

  const infoX = hasLogo ? margin + logoSize + 5 : margin;
  const clinicName = (clinicSettings && clinicSettings.name) || (isArabic ? "عيادة" : "Clinic");

  setFont(13, "bold");
  drawText(clinicName, infoX, headerY + 5);
  if (clinicSettings && clinicSettings.address) {
    setFont(7, "normal");
    drawText(clinicSettings.address, infoX, headerY + 10);
  }
  if (clinicSettings && clinicSettings.phone) {
    setFont(7, "normal");
    drawText(clinicSettings.phone, infoX, headerY + 14);
  }

  // Report title (right side)
  setFont(16, "bold");
  doc.setTextColor(...COLORS.primary);
  const titleX = isArabic ? margin : pageWidth - margin;
  drawText(title, titleX, headerY + 6, { align: isArabic ? "left" : "right" });
  doc.setTextColor(...COLORS.text);

  if (subtitle) {
    setFont(8, "normal");
    doc.setTextColor(...COLORS.muted);
    drawText(subtitle, titleX, headerY + 12, { align: isArabic ? "left" : "right" });
    doc.setTextColor(...COLORS.text);
  }

  // Separator line
  const sepY = headerY + logoSize + 4;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, sepY, pageWidth - margin, sepY);

  let y = sepY + 6;

  // === Summary cards ===
  if (summary && summary.length > 0) {
    const cardCount = summary.length;
    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * (cardCount - 1)) / cardCount;
    const cardHeight = 16;

    summary.forEach((card, index) => {
      const cardX = margin + index * (cardWidth + cardGap);

      // Card background
      doc.setFillColor(...COLORS.primaryLight);
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, "F");

      // Label
      setFont(7, "normal");
      doc.setTextColor(...COLORS.muted);
      drawText(card.label, cardX + 3, y + 5);

      // Value
      setFont(11, "bold");
      doc.setTextColor(...COLORS.primary);
      const formattedValue = formatValue(card.value, card.format, isArabic);
      drawText(formattedValue, cardX + 3, y + 12);
      doc.setTextColor(...COLORS.text);
    });

    y += cardHeight + 6;
  }

  // === Data table ===
  const tableColumns = columns.map((col) => ({
    header: col.label,
    dataKey: col.key,
  }));

  // Format row data
  const tableRows = rows.map((row) => {
    const formatted = {};
    for (const col of columns) {
      const rawValue = row[col.key];
      formatted[col.key] = formatValue(rawValue, col.format, isArabic);
    }
    return formatted;
  });

  // Add totals row if provided
  let footRows = [];
  if (totalsRow) {
    const formattedTotals = {};
    for (const col of columns) {
      const rawValue = totalsRow[col.key];
      formattedTotals[col.key] = rawValue !== undefined ? formatValue(rawValue, col.format, isArabic) : "";
    }
    footRows = [formattedTotals];
  }

  autoTable(doc, {
    startY: y,
    head: [tableColumns.map((c) => c.header)],
    body: tableRows.map((r) => columns.map((c) => r[c.dataKey])),
    foot: footRows.length > 0 ? [columns.map((c) => footRows[0][c.dataKey] || "")] : undefined,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: isArabic && amiriFontBase64 ? "Amiri" : "helvetica",
      fontSize: 8,
      cellPadding: 2,
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: COLORS.headerText,
      fontStyle: "bold",
      fontSize: 8,
    },
    footStyles: {
      fillColor: COLORS.totalBg,
      textColor: COLORS.text,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.align === "right") {
        acc[index] = { halign: "right" };
      } else if (col.align === "center") {
        acc[index] = { halign: "center" };
      }
      return acc;
    }, {}),
    didDrawPage: () => {
      // Footer with page number
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      setFont(7, "normal");
      doc.setTextColor(...COLORS.muted);
      const footerText = isArabic
        ? `صفحة ${currentPage} من ${pageCount} — ${new Date().toLocaleDateString("ar")}`
        : `Page ${currentPage} of ${pageCount} — ${new Date().toLocaleDateString()}`;
      drawText(footerText, pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.setTextColor(...COLORS.text);
    },
  });

  // Signature line at the bottom of the last page
  const finalY = doc.lastAutoTable.finalY + 15;
  if (finalY < pageHeight - 30) {
    setFont(8, "normal");
    doc.setTextColor(...COLORS.muted);
    const sigLabel = isArabic ? "توقيع المسؤول: ____________________" : "Authorized Signature: ____________________";
    const sigX = isArabic ? margin : pageWidth - margin - 80;
    drawText(sigLabel, sigX, finalY);
    doc.setTextColor(...COLORS.text);
  }

  return doc;
}

/**
 * Format a value based on its type for display in the PDF.
 */
function formatValue(value, format, isArabic) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);

  if (format === "currency") {
    return isArabic
      ? `${roundTo2(num).toLocaleString("ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : roundTo2(num).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (format === "number") {
    return num.toLocaleString(isArabic ? "ar" : "en");
  }
  if (format === "integer") {
    return Math.round(num).toLocaleString(isArabic ? "ar" : "en");
  }
  if (format === "percentage") {
    return `${roundTo2(num)}%`;
  }
  if (format === "date") {
    try {
      return new Date(value).toLocaleDateString(isArabic ? "ar" : "en");
    } catch {
      return String(value);
    }
  }
  return String(value);
}

module.exports = { generateReportPDF };

const { jsPDF } = require("jspdf");
const { formatDate } = require("./pdfFonts");
const { embedFonts, createDrawText } = require("./pdfLayout");
const { invoice: invoiceLabels } = require("./pdfLabels");

function generateInvoicePDF(invoice, clinicSettings) {
  const lang = (clinicSettings && clinicSettings.lang) || "en";
  const isArabic = lang === "ar";
  const L = isArabic ? invoiceLabels.ar : invoiceLabels.en;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  embedFonts(doc);
  const drawText = createDrawText(doc, isArabic);

  let y = 20;

  const clinicName = (clinicSettings && clinicSettings.name) || "";
  const clinicAddress = (clinicSettings && clinicSettings.address) || invoice.noteContactLines || "";
  const clinicPhone = (clinicSettings && clinicSettings.phone) || invoice.notePhone || "";
  const clinicEmail = (clinicSettings && clinicSettings.email) || invoice.noteEmail || "";

  // --- Helper: draw page header (for multi-page) ---
  function drawPageHeader() {
    const headerY = 20;
    const logoSize = 30; // Increased from 18 to 30mm

    // Logo priority: invoice.logo (per-invoice base64) > clinicSettings.logoBase64 (clinic-wide)
    const logoBase64 = invoice.logo || (clinicSettings && clinicSettings.logoBase64) || "";
    const hasLogo = !!logoBase64;

    if (hasLogo) {
      try {
        doc.addImage(logoBase64, "PNG", margin, headerY, logoSize, logoSize, undefined, "FAST");
      } catch (_e) {
        // skip if image format unsupported
      }
    }

    // Clinic info (left side, after logo)
    const infoX = hasLogo ? margin + logoSize + 6 : margin;
    const textDir = isArabic ? "right" : "left";

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    drawText(clinicName || (isArabic ? "عيادة" : "Clinic"), infoX, headerY + 6);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    let infoY = headerY + 12;
    if (clinicAddress) {
      drawText(clinicAddress, infoX, infoY);
      infoY += 5;
    }
    if (clinicPhone) {
      drawText(clinicPhone, infoX, infoY);
      infoY += 5;
    }
    if (clinicEmail) {
      drawText(clinicEmail, infoX, infoY);
    }

    // INVOICE label (right side)
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    drawText(L.invoice, pageWidth - margin, headerY + 6, { align: "right" });
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(invoice.displayId || "", pageWidth - margin, headerY + 13, { align: "right" });

    // Separator line
    doc.setDrawColor(220);
    const sepY = headerY + logoSize + 6;
    doc.line(margin, sepY, pageWidth - margin, sepY);

    // Return with proper spacing after separator
    return sepY + 10;
  }

  // --- Helper: check page break ---
  function checkPageBreak(neededSpace) {
    if (y + neededSpace > pageHeight - 20) {
      doc.addPage();
      y = drawPageHeader();
      return true;
    }
    return false;
  }

  // --- Draw initial header ---
  y = drawPageHeader();

  // --- Bill To + Dates ---
  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  drawText(L.billTo, margin, y);
  doc.setFont(undefined, "normal");

  y += 6;
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  const billToName = invoice.patient
    ? invoice.patient.fullName
    : invoice.customerName || "";
  drawText(billToName, margin, y);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);

  y += 5;
  if (invoice.patient && invoice.patient.address) {
    const addrLines = doc.splitTextToSize(invoice.patient.address, 70);
    drawText(addrLines, margin, y);
    y += addrLines.length * 5;
  }
  if (invoice.patient && invoice.patient.phoneNumber) {
    drawText(invoice.patient.phoneNumber, margin, y);
    y += 5;
  }
  if (!invoice.patient && invoice.customerPhone) {
    drawText(invoice.customerPhone, margin, y);
    y += 5;
  }

  // Dates (right side)
  const dateX = pageWidth - margin - 65;
  const dateValX = dateX + 35;

  doc.setFontSize(8);
  doc.setTextColor(150);
  drawText(L.invoiceDate, dateX, y - 10);
  doc.setTextColor(0);
  doc.setFont(undefined, "bold");
  doc.text(formatDate(invoice.invoiceDate), dateValX, y - 10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(150);
  drawText(L.dueDate, dateX, y - 5);
  doc.setTextColor(0);
  doc.setFont(undefined, "bold");
  doc.text(invoice.dueDate ? formatDate(invoice.dueDate) : "—", dateValX, y - 5);
  doc.setFont(undefined, "normal");

  y += 10;

  // --- Items table ---
  const tableY = y;
  const colDesc = margin;
  const colQty = margin + 110;
  const colPrice = margin + 135;
  const colAmount = pageWidth - margin;

  // Header row
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, tableY, contentWidth, 9, "F");
  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  drawText(L.description, colDesc + 3, tableY + 6);
  drawText(L.qty, colQty + 3, tableY + 6, { align: "center" });
  drawText(L.unitPrice, colPrice + 3, tableY + 6, { align: "center" });
  drawText(L.amount, colAmount - 3, tableY + 6, { align: "right" });
  doc.setFont(undefined, "normal");

  y = tableY + 9;

  // Item rows
  if (invoice.items && invoice.items.length > 0) {
    for (const item of invoice.items) {
      checkPageBreak(12);

      const descLines = doc.splitTextToSize(String(item.description || "—"), 105);
      const rowHeight = Math.max(descLines.length * 5 + 3, 8);

      // Row border
      doc.setDrawColor(235);
      doc.line(margin, y, pageWidth - margin, y);

      doc.setFontSize(8);
      drawText(descLines, colDesc + 3, y + 5);
      doc.text(String(item.quantity), colQty + 3, y + 5, { align: "center" });
      doc.text(Number(item.unitPrice).toFixed(2), colPrice + 3, y + 5, { align: "center" });
      const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      doc.setFont(undefined, "bold");
      doc.text(itemTotal.toFixed(2), colAmount - 3, y + 5, { align: "right" });
      doc.setFont(undefined, "normal");

      y += rowHeight;
    }
  }

  // Table bottom border
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- Totals ---
  const subtotal = (invoice.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const tax = Number(invoice.taxAmount) || 0;
  const discount = Number(invoice.discountAmount) || 0;
  const total = subtotal + tax - discount;
  const paidAmount = Number(invoice.paidAmount) || 0;
  const balanceDue = Math.max(0, total - paidAmount);

  const totalsX = pageWidth - margin - 60;
  const totalsValX = pageWidth - margin;

  checkPageBreak(35);

  doc.setFontSize(9);
  doc.setTextColor(100);
  drawText(L.subtotal, totalsX, y);
  doc.setTextColor(0);
  doc.text(subtotal.toFixed(2), totalsValX, y, { align: "right" });
  y += 7;

  if (tax > 0) {
    doc.setTextColor(100);
    drawText(L.tax, totalsX, y);
    doc.setTextColor(0);
    doc.text("+" + tax.toFixed(2), totalsValX, y, { align: "right" });
    y += 7;
  }

  if (discount > 0) {
    doc.setTextColor(100);
    drawText(L.discount, totalsX, y);
    doc.setTextColor(200, 0, 0);
    doc.text("-" + discount.toFixed(2), totalsValX, y, { align: "right" });
    doc.setTextColor(0);
    y += 7;
  }

  // Paid amount line (if any payments recorded)
  if (paidAmount > 0) {
    doc.setTextColor(100);
    drawText(L.paid || "Paid", totalsX, y);
    doc.setTextColor(0, 128, 0);
    doc.text(paidAmount.toFixed(2), totalsValX, y, { align: "right" });
    doc.setTextColor(0);
    y += 7;
  }

  // Balance due line
  doc.setDrawColor(220);
  doc.line(totalsX - 5, y, totalsValX, y);
  y += 7;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  drawText(L.balanceDue, totalsX, y);
  doc.text(balanceDue.toFixed(2), totalsValX, y, { align: "right" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  y += 12;

  // --- Notes ---
  if (invoice.noteMessage) {
    checkPageBreak(18);
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
    doc.setFontSize(7);
    doc.setFont(undefined, "bold");
    doc.setTextColor(150);
    drawText(L.notes, margin, y);
    doc.setTextColor(0);
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    y += 5;
    const noteLines = doc.splitTextToSize(invoice.noteMessage, contentWidth);
    drawText(noteLines, margin, y);
    y += noteLines.length * 5 + 5;
  }

  // --- Thank you ---
  checkPageBreak(12);
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  drawText(L.thankYou, pageWidth / 2, y, { align: "center" });
  doc.setFont(undefined, "normal");

  return doc;
}

module.exports = { generateInvoicePDF };

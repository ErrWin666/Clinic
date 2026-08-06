const { generateReportPDF } = require("../../utils/pdfReportGenerator");

class InventoryReportPDFService {
  constructor(reportService, settingsService) {
    this.reportService = reportService;
    this.settingsService = settingsService;
  }

  async _getSettings() {
    return this.settingsService.getClinicSettings();
  }

  async generateInventoryValuationPDF() {
    const report = await this.reportService.getInventoryValuationReport();
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "تقييم المخزون" : "Inventory Valuation",
      subtitle: new Date().toLocaleDateString(isArabic ? "ar" : "en"),
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "sku", label: "SKU" },
        { key: "quantity", label: isArabic ? "الكمية" : "Qty", align: "right", format: "integer" },
        { key: "avgCost", label: isArabic ? "متوسط التكلفة" : "Avg Cost", align: "right", format: "currency" },
        { key: "totalCost", label: isArabic ? "إجمالي التكلفة" : "Total Cost", align: "right", format: "currency" },
        { key: "sellPrice", label: isArabic ? "سعر البيع" : "Sell Price", align: "right", format: "currency" },
        { key: "potentialProfit", label: isArabic ? "الربح المحتمل" : "Potential Profit", align: "right", format: "currency" },
      ],
      rows: report.items,
      summary: [
        { label: isArabic ? "إجمالي القيمة" : "Total Cost Value", value: report.summary.totalCostValue, format: "currency" },
        { label: isArabic ? "إجمالي البيع" : "Total Sell Value", value: report.summary.totalSellValue, format: "currency" },
        { label: isArabic ? "الربح المحتمل" : "Potential Profit", value: report.summary.potentialProfit, format: "currency" },
        { label: isArabic ? "عدد الأصناف" : "Variants", value: report.summary.totalVariants, format: "integer" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateLowStockPDF() {
    const report = await this.reportService.getLowStockReport();
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "تقرير النواقص" : "Low Stock Report",
      subtitle: new Date().toLocaleDateString(isArabic ? "ar" : "en"),
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "sku", label: "SKU" },
        { key: "quantity", label: isArabic ? "الكمية الحالية" : "Current Qty", align: "right", format: "integer" },
        { key: "minQuantity", label: isArabic ? "الحد الأدنى" : "Min Qty", align: "right", format: "integer" },
        { key: "shortfall", label: isArabic ? "النقص" : "Shortfall", align: "right", format: "integer" },
      ],
      rows: report.items,
      summary: [
        { label: isArabic ? "عدد الأصناف الناقصة" : "Low Stock Items", value: report.count, format: "integer" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateExpiryPDF(days = 30) {
    const report = await this.reportService.getExpiryReport(days);
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    const allItems = [
      ...report.expiringSoon.map((b) => ({ ...b, status: isArabic ? "قاربت الانتهاء" : "Expiring Soon" })),
      ...report.expired.map((b) => ({ ...b, status: isArabic ? "منتهي" : "Expired" })),
    ];

    return generateReportPDF({
      title: isArabic ? "تقرير الانتهاءات" : "Expiry Report",
      subtitle: isArabic ? `خلال ${days} يوم` : `Next ${days} days`,
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "batchNumber", label: isArabic ? "رقم الدفعة" : "Batch" },
        { key: "quantity", label: isArabic ? "الكمية" : "Qty", align: "right", format: "integer" },
        { key: "expiryDate", label: isArabic ? "تاريخ الانتهاء" : "Expiry Date", align: "right", format: "date" },
        { key: "unitCost", label: isArabic ? "التكلفة" : "Unit Cost", align: "right", format: "currency" },
        { key: "status", label: isArabic ? "الحالة" : "Status" },
      ],
      rows: allItems,
      summary: [
        { label: isArabic ? "قاربت الانتهاء" : "Expiring Soon", value: report.expiringSoon.length, format: "integer" },
        { label: isArabic ? "منتهية" : "Expired", value: report.expired.length, format: "integer" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateDeadStockPDF(months = 3) {
    const report = await this.reportService.getDeadStockReport(months);
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "تقرير البضاعة الراكدة" : "Dead Stock Report",
      subtitle: isArabic ? `بدون حركة منذ ${months} أشهر` : `No movement for ${months} months`,
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "sku", label: "SKU" },
        { key: "quantity", label: isArabic ? "الكمية" : "Qty", align: "right", format: "integer" },
        { key: "totalCost", label: isArabic ? "القيمة" : "Total Cost", align: "right", format: "currency" },
      ],
      rows: report.items,
      summary: [
        { label: isArabic ? "عدد الأصناف" : "Items", value: report.count, format: "integer" },
        { label: isArabic ? "إجمالي القيمة" : "Total Value Tied", value: report.totalValue, format: "currency" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateStockAgingPDF() {
    const report = await this.reportService.getStockAgingReport();
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "تقرير تقادم المخزون" : "Stock Aging Report",
      subtitle: new Date().toLocaleDateString(isArabic ? "ar" : "en"),
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "batchNumber", label: isArabic ? "رقم الدفعة" : "Batch" },
        { key: "quantity", label: isArabic ? "الكمية" : "Qty", align: "right", format: "integer" },
        { key: "receivedDate", label: isArabic ? "تاريخ الاستلام" : "Received", align: "right", format: "date" },
        { key: "ageDays", label: isArabic ? "العمر (يوم)" : "Age (days)", align: "right", format: "integer" },
        { key: "bucket", label: isArabic ? "الفئة" : "Bucket" },
        { key: "totalValue", label: isArabic ? "القيمة" : "Value", align: "right", format: "currency" },
      ],
      rows: report.items,
      summary: report.summary.map((s) => ({
        label: `${s.bucket} — ${isArabic ? "قيمة" : "value"}`,
        value: s.totalValue,
        format: "currency",
      })),
      totalsRow: { totalValue: report.totalValue },
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateMovementsSummaryPDF(startDate, endDate) {
    const report = await this.reportService.getMovementsSummaryReport(startDate, endDate);
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "ملخص الحركات" : "Movements Summary",
      subtitle: isArabic
        ? `من ${startDate || "-"} إلى ${endDate || "-"}`
        : `From ${startDate || "-"} to ${endDate || "-"}`,
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "sku", label: "SKU" },
        { key: "inQuantity", label: isArabic ? "الوارد" : "In Qty", align: "right", format: "integer" },
        { key: "outQuantity", label: isArabic ? "الصادر" : "Out Qty", align: "right", format: "integer" },
        { key: "netQuantity", label: isArabic ? "الصافي" : "Net", align: "right", format: "integer" },
        { key: "inValue", label: isArabic ? "قيمة الوارد" : "In Value", align: "right", format: "currency" },
        { key: "outValue", label: isArabic ? "قيمة الصادر" : "Out Value", align: "right", format: "currency" },
      ],
      rows: report.items,
      summary: [
        { label: isArabic ? "إجمالي قيمة الوارد" : "Total In Value", value: report.totalInValue, format: "currency" },
        { label: isArabic ? "إجمالي قيمة الصادر" : "Total Out Value", value: report.totalOutValue, format: "currency" },
        { label: isArabic ? "عدد الأصناف" : "Variants", value: report.count, format: "integer" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateProfitLossPDF(startDate, endDate) {
    const report = await this.reportService.getProfitLossReport(startDate, endDate);
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "الأرباح والخسائر" : "Profit & Loss",
      subtitle: isArabic
        ? `من ${startDate || "-"} إلى ${endDate || "-"}`
        : `From ${startDate || "-"} to ${endDate || "-"}`,
      columns: [
        { key: "invoiceDisplayId", label: isArabic ? "الفاتورة" : "Invoice" },
        { key: "description", label: isArabic ? "الوصف" : "Description" },
        { key: "quantity", label: isArabic ? "الكمية" : "Qty", align: "right", format: "integer" },
        { key: "unitPrice", label: isArabic ? "سعر الوحدة" : "Unit Price", align: "right", format: "currency" },
        { key: "lineTotal", label: isArabic ? "الإجمالي" : "Line Total", align: "right", format: "currency" },
        { key: "costAmount", label: isArabic ? "التكلفة" : "Cost", align: "right", format: "currency" },
        { key: "profit", label: isArabic ? "الربح" : "Profit", align: "right", format: "currency" },
      ],
      rows: report.items,
      summary: [
        { label: isArabic ? "الإيراد" : "Revenue", value: report.revenue, format: "currency" },
        { label: isArabic ? "تكلفة البضاعة" : "COGS", value: report.cogs, format: "currency" },
        { label: isArabic ? "الربح الإجمالي" : "Gross Profit", value: report.grossProfit, format: "currency" },
        { label: isArabic ? "هامش الربح" : "Margin %", value: report.grossMargin, format: "percentage" },
        { label: isArabic ? "خسائر التلف" : "Damage Loss", value: report.damageLoss, format: "currency" },
        { label: isArabic ? "خسائر الانتهاء" : "Expiry Loss", value: report.expiryLoss, format: "currency" },
        { label: isArabic ? "صافي الربح" : "Net Profit", value: report.netProfit, format: "currency" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }

  async generateStocktakingPDF(id) {
    const StocktakingService = require("../StocktakingService");
    const stocktakingService = new StocktakingService();
    const report = await stocktakingService.getById(id);
    const clinicSettings = await this._getSettings();
    const isArabic = clinicSettings.lang === "ar";

    return generateReportPDF({
      title: isArabic ? "نتيجة الجرد" : "Stocktaking Result",
      subtitle: `${report.displayId || ""} — ${report.status || ""}`,
      columns: [
        { key: "productName", label: isArabic ? "المنتج" : "Product" },
        { key: "variantName", label: isArabic ? "الصنف" : "Variant" },
        { key: "batchNumber", label: isArabic ? "رقم الدفعة" : "Batch" },
        { key: "systemQuantity", label: isArabic ? "الكمية النظامية" : "System Qty", align: "right", format: "integer" },
        { key: "countedQuantity", label: isArabic ? "الكمية المعدودة" : "Counted Qty", align: "right", format: "integer" },
        { key: "difference", label: isArabic ? "الفرق" : "Difference", align: "right", format: "integer" },
      ],
      rows: report.items || [],
      summary: [
        { label: isArabic ? "إجمالي العناصر" : "Total Items", value: (report.items || []).length, format: "integer" },
      ],
      clinicSettings,
      lang: clinicSettings.lang,
    });
  }
}

module.exports = InventoryReportPDFService;

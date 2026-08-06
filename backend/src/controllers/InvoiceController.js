const BaseController = require("./BaseController");
const InvoiceService = require("../services/InvoiceService");
const SettingsService = require("../services/SettingsService");
const { buildCSV, sendCSV } = require("../utils/csvExport");
const MESSAGES = require("../constants/messages");

class InvoiceController extends BaseController {
  constructor() {
    super();
    this.invoiceService = new InvoiceService();
    this.settingsService = new SettingsService();
  }

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.invoiceService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.INVOICE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.invoiceService.getStats(req.query);
      return this.sendSuccess(res, stats, MESSAGES.INVOICE.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const invoice = await this.invoiceService.getById(id);
      return this.sendSuccess(res, invoice, MESSAGES.INVOICE.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const invoice = await this.invoiceService.create(req.body);
      return this.sendSuccess(res, invoice, MESSAGES.INVOICE.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const invoice = await this.invoiceService.update(id, req.body);
      return this.sendSuccess(res, invoice, MESSAGES.INVOICE.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const invoice = await this.invoiceService.changeStatus(id, req.body.status);
      return this.sendSuccess(res, invoice, MESSAGES.INVOICE.STATUS_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.invoiceService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.INVOICE.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async getPDF(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const clinicSettings = await this.settingsService.getClinicSettings();
      const doc = await this.invoiceService.generateInvoicePDFDoc(id, clinicSettings);
      const invoice = await this.invoiceService.getById(id);
      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.displayId}.pdf`);
      return res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      next(error);
    }
  }

  async export(req, res, next) {
    try {
      const exportQuery = { ...req.query, page: 1, pageSize: 100000 };
      const { rows } = await this.invoiceService.list(exportQuery);
      const headers = ["ID", "DisplayID", "Date", "Patient/Customer", "Status", "Total", "Paid", "Balance", "Tax", "Discount"];
      const csvRows = rows.map((inv) => {
        const name = inv.patient ? inv.patient.fullName : (inv.customerName || "");
        const paidAmount = Number(inv.paidAmount || 0).toFixed(2);
        const balance = (Number(inv.totalAmount) - Number(inv.paidAmount || 0)).toFixed(2);
        return [inv.id, inv.displayId, inv.invoiceDate, name, inv.invoiceStatus, inv.totalAmount, paidAmount, balance, inv.taxAmount || 0, inv.discountAmount || 0];
      });
      const csv = buildCSV(headers, csvRows);
      return sendCSV(res, csv, "invoices.csv");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InvoiceController;

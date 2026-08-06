const BaseController = require("./BaseController");
const SupplierService = require("../services/SupplierService");
const SupplierPaymentService = require("../services/SupplierPaymentService");
const MESSAGES = require("../constants/messages");

class SupplierController extends BaseController {
  constructor() {
    super();
    this.supplierService = new SupplierService();
    this.paymentService = new SupplierPaymentService();
  }

  // === Suppliers ===

  async list(req, res, next) {
    try {
      const { rows, pagination } = await this.supplierService.list(req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.SUPPLIER.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const supplier = await this.supplierService.getById(id);
      return this.sendSuccess(res, supplier, MESSAGES.SUPPLIER.RETRIEVED_ONE);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const supplier = await this.supplierService.create(req.body);
      return this.sendSuccess(res, supplier, MESSAGES.SUPPLIER.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const supplier = await this.supplierService.update(id, req.body);
      return this.sendSuccess(res, supplier, MESSAGES.SUPPLIER.UPDATED);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      await this.supplierService.delete(id);
      return this.sendSuccess(res, null, MESSAGES.SUPPLIER.DELETED);
    } catch (error) {
      next(error);
    }
  }

  async getStatement(req, res, next) {
    try {
      const id = this.validateId(req.params.id);
      const { startDate, endDate } = req.query;
      const statement = await this.supplierService.getStatement(id, startDate, endDate);
      return this.sendSuccess(res, statement, MESSAGES.SUPPLIER.STATEMENT_RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  // === Payments ===

  async listPayments(req, res, next) {
    try {
      const supplierId = this.validateId(req.params.supplierId);
      const { rows, pagination } = await this.paymentService.listBySupplier(supplierId, req.query);
      return this.sendPaginated(res, rows, pagination, MESSAGES.SUPPLIER_PAYMENT.RETRIEVED);
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req, res, next) {
    try {
      const supplierId = this.validateId(req.params.supplierId);
      const userId = req.user?.id;
      const payment = await this.paymentService.create(supplierId, req.body, userId);
      return this.sendSuccess(res, payment, MESSAGES.SUPPLIER_PAYMENT.CREATED, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SupplierController;

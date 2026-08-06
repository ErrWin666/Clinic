const BaseService = require("./BaseService");
const SupplierPaymentRepository = require("../repositories/SupplierPaymentRepository");
const SupplierRepository = require("../repositories/SupplierRepository");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { SupplierPayment } = require("../models");
const { generateDisplayId } = require("../utils/displayId");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");

class SupplierPaymentService extends BaseService {
  constructor() {
    super(new SupplierPaymentRepository());
    this._supplierRepository = new SupplierRepository();
  }

  async listBySupplier(supplierId, query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);
      const { rows, count } = await this.repository.findBySupplier(supplierId, { offset, limit });
      return {
        rows,
        pagination: buildPaginationResponse(count, page, pageSize),
      };
    }, MESSAGES.SUPPLIER_PAYMENT.RETRIEVED, "PAYMENT_LIST_ERROR");
  }

  async create(supplierId, data, userId) {
    return this.executeOperation(async () => {
      const supplier = await this._supplierRepository.findById(supplierId);
      if (!supplier) {
        throw new CustomError(MESSAGES.SUPPLIER.NOT_FOUND, "SUPPLIER_NOT_FOUND", 404);
      }

      const displayId = await generateDisplayId(SupplierPayment, "SPM");
      return this.repository.create({
        ...data,
        displayId,
        supplierId,
        userId: userId || null,
      });
    }, MESSAGES.SUPPLIER_PAYMENT.CREATED, "PAYMENT_CREATE_ERROR");
  }
}

module.exports = SupplierPaymentService;

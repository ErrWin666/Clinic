const BaseService = require("./BaseService");
const PurchaseOrderRepository = require("../repositories/PurchaseOrderRepository");
const SupplierRepository = require("../repositories/SupplierRepository");
const StockService = require("./stock");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");
const { PurchaseOrder, PurchaseOrderItem } = require("../models");
const { generateDisplayId } = require("../utils/displayId");
const { parsePagination, buildPaginationResponse } = require("../utils/pagination");
const { Op } = require("sequelize");
const { sequelize } = require("../database");

class PurchaseOrderService extends BaseService {
  constructor() {
    super(new PurchaseOrderRepository());
    this._supplierRepository = new SupplierRepository();
    this._stockService = new StockService();
  }

  async list(query) {
    return this.executeOperation(async () => {
      const { page, pageSize, offset, limit } = parsePagination(query);

      const where = {};
      if (query.supplierId) where.supplierId = query.supplierId;
      if (query.status) where.status = query.status;
      if (query.startDate && query.endDate) {
        where.orderDate = { [Op.gte]: query.startDate, [Op.lte]: query.endDate };
      }

      const { rows, count } = await this.repository.searchWithFilters({
        where,
        offset,
        limit,
      });

      return {
        rows,
        pagination: buildPaginationResponse(count, page, pageSize),
      };
    }, MESSAGES.PURCHASE_ORDER.RETRIEVED, "PO_LIST_ERROR");
  }

  async getById(id) {
    return this.executeOperation(async () => {
      const po = await this.repository.findByIdWithAll(id);
      if (!po) {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.NOT_FOUND, "PO_NOT_FOUND", 404);
      }
      return po;
    }, MESSAGES.PURCHASE_ORDER.RETRIEVED_ONE, "PO_GET_ERROR");
  }

  async create(data, userId) {
    return this.executeOperation(async () => {
      const supplier = await this._supplierRepository.findById(data.supplierId);
      if (!supplier) {
        throw new CustomError(MESSAGES.SUPPLIER.NOT_FOUND, "SUPPLIER_NOT_FOUND", 404);
      }

      // Calculate total
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0
      );

      const displayId = await generateDisplayId(PurchaseOrder, "PO");

      const po = await this.repository.create({
        displayId,
        supplierId: data.supplierId,
        status: "draft",
        totalAmount: Number(totalAmount.toFixed(2)),
        orderDate: data.orderDate,
        userId: userId || null,
        note: data.note || null,
      });

      // Create items
      const items = await Promise.all(
        data.items.map((item) =>
          PurchaseOrderItem.create({
            purchaseOrderId: po.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            receivedQuantity: 0,
            batchNumber: item.batchNumber || null,
            expiryDate: item.expiryDate || null,
          })
        )
      );

      return { ...po.toJSON(), items };
    }, MESSAGES.PURCHASE_ORDER.CREATED, "PO_CREATE_ERROR");
  }

  async update(id, data) {
    return this.executeOperation(async () => {
      const po = await this.repository.findById(id);
      if (!po) {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.NOT_FOUND, "PO_NOT_FOUND", 404);
      }
      if (po.status !== "draft") {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.ONLY_DRAFT_EDITABLE, "PO_NOT_EDITABLE", 400);
      }

      const transaction = await sequelize.transaction();
      try {
        // Update PO fields
        const updateData = {};
        if (data.orderDate) updateData.orderDate = data.orderDate;
        if (data.note !== undefined) updateData.note = data.note;

        // If items provided, replace them
        if (data.items) {
          await PurchaseOrderItem.destroy({
            where: { purchaseOrderId: id },
            transaction,
          });
          await Promise.all(
            data.items.map((item) =>
              PurchaseOrderItem.create(
                {
                  purchaseOrderId: id,
                  productVariantId: item.productVariantId,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  receivedQuantity: 0,
                  batchNumber: item.batchNumber || null,
                  expiryDate: item.expiryDate || null,
                },
                { transaction }
              )
            )
          );
          // Recalculate total
          updateData.totalAmount = Number(
            data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toFixed(2)
          );
        }

        await po.update(updateData, { transaction });
        await transaction.commit();

        return this.repository.findByIdWithAll(id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.PURCHASE_ORDER.UPDATED, "PO_UPDATE_ERROR");
  }

  /**
   * Receive a purchase order: create batches + stock movements for each item.
   */
  async receive(id, receivedItems, userId) {
    return this.executeOperation(async () => {
      const po = await this.repository.findByIdWithItems(id);
      if (!po) {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.NOT_FOUND, "PO_NOT_FOUND", 404);
      }
      if (po.status === "received") {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.ALREADY_RECEIVED, "PO_ALREADY_RECEIVED", 400);
      }
      if (po.status === "cancelled") {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.ALREADY_CANCELLED, "PO_CANCELLED", 400);
      }

      const transaction = await sequelize.transaction();
      try {
        // Process each received item
        for (const received of receivedItems) {
          const poItem = po.items.find((i) => i.id === received.id);
          if (!poItem) {
            throw new CustomError(`Item ${received.id} not found in PO`, "PO_ITEM_NOT_FOUND", 400);
          }

          // Validate received quantity does not exceed ordered quantity
          if (received.receivedQuantity > poItem.quantity) {
            throw new CustomError(
              MESSAGES.PURCHASE_ORDER.RECEIVED_EXCEEDS_ORDERED,
              "RECEIVED_EXCEEDS_ORDERED",
              400
            );
          }

          // Update received quantity + unit
          await poItem.update(
            {
              receivedQuantity: received.receivedQuantity,
              receivedUnit: received.receivedUnit || poItem.receivedUnit || "piece",
              batchNumber: received.batchNumber || poItem.batchNumber,
              expiryDate: received.expiryDate || poItem.expiryDate,
            },
            { transaction }
          );

          // Only create batch + movement if quantity > 0
          if (received.receivedQuantity > 0) {
            await this._stockService.receivePurchaseOrderItem(
              {
                ...poItem.toJSON(),
                receivedQuantity: received.receivedQuantity,
                receivedUnit: received.receivedUnit || poItem.receivedUnit || "piece",
                batchNumber: received.batchNumber || poItem.batchNumber,
                expiryDate: received.expiryDate || poItem.expiryDate,
              },
              po.supplierId,
              userId,
              transaction
            );
          }
        }

        // Mark PO as received
        const today = new Date().toISOString().split("T")[0];
        await po.update(
          { status: "received", receivedDate: today },
          { transaction }
        );

        await transaction.commit();
        return this.repository.findByIdWithAll(id);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, MESSAGES.PURCHASE_ORDER.RECEIVED, "PO_RECEIVE_ERROR");
  }

  async cancel(id) {
    return this.executeOperation(async () => {
      const po = await this.repository.findByIdWithItems(id);
      if (!po) {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.NOT_FOUND, "PO_NOT_FOUND", 404);
      }
      if (po.status === "received") {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.CANNOT_CANCEL_RECEIVED, "PO_RECEIVED", 400);
      }
      if (po.status === "cancelled") {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.ALREADY_CANCELLED, "PO_CANCELLED", 400);
      }
      // Prevent cancellation if any items have been partially received
      const hasPartialReceipts = po.items && po.items.some((i) => Number(i.receivedQuantity) > 0);
      if (hasPartialReceipts) {
        throw new CustomError(MESSAGES.PURCHASE_ORDER.CANNOT_CANCEL_PARTIAL, "PO_PARTIALLY_RECEIVED", 400);
      }
      return po.update({ status: "cancelled" });
    }, MESSAGES.PURCHASE_ORDER.CANCELLED, "PO_CANCEL_ERROR");
  }
}

module.exports = PurchaseOrderService;

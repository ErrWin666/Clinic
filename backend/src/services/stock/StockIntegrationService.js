const BaseService = require("../BaseService");
const PackagingUnitRepository = require("../../repositories/PackagingUnitRepository");
const CustomError = require("../../utils/CustomError");
const MESSAGES = require("../../constants/messages");
const { StockMovement, Batch, InvoiceItem, ExamConsumableRule } = require("../../models");
const { Op } = require("sequelize");
const logger = require("../../utils/logger");
const { multiplyQtyPrice, sumMoney, convertToBase } = require("../../utils/money");

class StockIntegrationService extends BaseService {
  constructor(stockMovementService) {
    super(null);
    this._movementService = stockMovementService;
    this._packagingRepository = new PackagingUnitRepository();
  }

  async processInvoiceSale(invoiceId, transaction) {
    // Idempotency: skip if stock already deducted for this invoice
    const existing = await StockMovement.count({
      where: { referenceType: "Invoice", referenceId: invoiceId, type: "out", reason: "sale" },
      transaction,
    });
    if (existing > 0) return;

    const items = await InvoiceItem.findAll({
      where: { invoiceId, productVariantId: { [Op.ne]: null } },
      transaction,
    });

    for (const item of items) {
      const unitName = item.unit || "piece";
      const pkgUnit = await this._packagingRepository.findByVariantAndName(item.productVariantId, unitName);
      const factor = pkgUnit ? pkgUnit.factor : 1;
      const baseQuantity = convertToBase(item.quantity, factor);

      const selections = await this._movementService.selectBatchesForSale(item.productVariantId, baseQuantity, { transaction });
      const costValues = [];
      let firstBatchId = null;

      for (const sel of selections) {
        await this._movementService.createMovement(
          {
            productVariantId: item.productVariantId,
            batchId: sel.batchId,
            type: "out",
            quantity: -sel.quantity,
            reason: "sale",
            unitCost: sel.unitCost,
            referenceType: "Invoice",
            referenceId: invoiceId,
          },
          transaction
        );
        costValues.push(multiplyQtyPrice(sel.quantity, sel.unitCost));
        if (!firstBatchId) firstBatchId = sel.batchId;
      }

      const totalCost = sumMoney(costValues);
      await item.update({ batchId: firstBatchId, costAmount: totalCost, baseQuantity }, { transaction });
    }
  }

  async processInvoiceReturn(invoiceId, transaction) {
    // Idempotency: skip if stock already returned for this invoice
    const existingReturn = await StockMovement.count({
      where: { referenceType: "Invoice", referenceId: invoiceId, type: "in", reason: "return" },
      transaction,
    });
    if (existingReturn > 0) return;

    const movements = await StockMovement.findAll({
      where: { referenceType: "Invoice", referenceId: invoiceId, type: "out", reason: "sale" },
      transaction,
    });

    for (const movement of movements) {
      await this._movementService.createMovement(
        {
          productVariantId: movement.productVariantId,
          batchId: movement.batchId,
          type: "in",
          quantity: -movement.quantity,
          reason: "return",
          unitCost: movement.unitCost,
          referenceType: "Invoice",
          referenceId: invoiceId,
        },
        transaction
      );
    }
  }

  async processExamConsumables(examId, examType, transaction) {
    // Idempotency: skip if consumables already deducted for this exam
    const existing = await StockMovement.count({
      where: { referenceType: "EyeExamination", referenceId: examId, type: "out", reason: "dispensing" },
      transaction,
    });
    if (existing > 0) return [];

    const rules = await ExamConsumableRule.findAll({
      where: { examType, isActive: true },
      transaction,
    });

    const results = [];
    for (const rule of rules) {
      try {
        const selections = await this._movementService.selectBatchesForSale(rule.productVariantId, rule.quantity, { transaction });
        for (const sel of selections) {
          const movement = await this._movementService.createMovement(
            {
              productVariantId: rule.productVariantId,
              batchId: sel.batchId,
              type: "out",
              quantity: -sel.quantity,
              reason: "dispensing",
              unitCost: sel.unitCost,
              referenceType: "EyeExamination",
              referenceId: examId,
            },
            transaction
          );
          results.push(movement);
        }
      } catch (err) {
        // Insufficient stock is non-fatal for exam consumables — exam can proceed without dispensing
        if (err.code === "INSUFFICIENT_STOCK") {
          logger.warn(`Exam ${examId}: insufficient stock for variant ${rule.productVariantId}`);
        } else {
          throw err;
        }
      }
    }
    return results;
  }

  async reverseExamConsumables(examId, transaction) {
    // Idempotency: skip if consumables already reversed for this exam
    const existingReversal = await StockMovement.count({
      where: { referenceType: "EyeExamination", referenceId: examId, type: "in", reason: "return" },
      transaction,
    });
    if (existingReversal > 0) return;

    const movements = await StockMovement.findAll({
      where: { referenceType: "EyeExamination", referenceId: examId, type: "out", reason: "dispensing" },
      transaction,
    });

    for (const movement of movements) {
      await this._movementService.createMovement(
        {
          productVariantId: movement.productVariantId,
          batchId: movement.batchId,
          type: "in",
          quantity: -movement.quantity,
          reason: "return",
          unitCost: movement.unitCost,
          referenceType: "EyeExamination",
          referenceId: examId,
        },
        transaction
      );
    }
  }

  async receivePurchaseOrderItem(purchaseOrderItem, supplierId, userId, transaction) {
    const today = new Date().toISOString().split("T")[0];
    const receivedQtyRaw = purchaseOrderItem.receivedQuantity || purchaseOrderItem.quantity;

    const unitName = purchaseOrderItem.receivedUnit || "piece";
    const pkgUnit = await this._packagingRepository.findByVariantAndName(purchaseOrderItem.productVariantId, unitName);
    const factor = pkgUnit ? pkgUnit.factor : 1;
    const receivedQty = convertToBase(receivedQtyRaw, factor);

    const batch = await Batch.create(
      {
        productVariantId: purchaseOrderItem.productVariantId,
        batchNumber: purchaseOrderItem.batchNumber || `PO-${Date.now()}`,
        quantity: 0,
        initialQuantity: receivedQty,
        unitCost: purchaseOrderItem.unitCost,
        expiryDate: purchaseOrderItem.expiryDate || null,
        receivedDate: today,
        supplierId,
        isActive: true,
      },
      { transaction }
    );

    await this._movementService.createMovement(
      {
        productVariantId: purchaseOrderItem.productVariantId,
        batchId: batch.id,
        type: "in",
        quantity: receivedQty,
        reason: "purchase",
        unitCost: purchaseOrderItem.unitCost,
        referenceType: "PurchaseOrder",
        referenceId: purchaseOrderItem.purchaseOrderId,
        userId,
      },
      transaction
    );

    await batch.reload({ transaction });
    return batch;
  }
}

module.exports = StockIntegrationService;

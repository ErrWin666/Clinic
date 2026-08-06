const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const PurchaseOrderItem = sequelize.define(
  "PurchaseOrderItem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchaseOrderId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "purchase_orders", key: "id" } },
    productVariantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "product_variants", key: "id" } },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    receivedQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    receivedUnit: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "piece" },
    batchNumber: { type: DataTypes.STRING, allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
  },
  {
    tableName: "purchase_order_items",
    paranoid: true,
    indexes: [
      { fields: ["purchaseOrderId"] },
      { fields: ["productVariantId"] },
    ],
    hooks: {},
  }
);

module.exports = PurchaseOrderItem;

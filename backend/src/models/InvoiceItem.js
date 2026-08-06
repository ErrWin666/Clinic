const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const { multiplyQtyPrice } = require("../utils/money");

const InvoiceItem = sequelize.define(
  "InvoiceItem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "invoices", key: "id" } },
    description: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    productVariantId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "product_variants", key: "id" } },
    batchId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "batches", key: "id" } },
    costAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "piece" },
    baseQuantity: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "invoice_items",
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ["invoiceId"] },
      { fields: ["productVariantId"] },
      { fields: ["batchId"] },
    ],
    hooks: {
      beforeCreate: (item) => {
        item.total = multiplyQtyPrice(item.quantity, item.unitPrice);
      },
      beforeUpdate: (item) => {
        // Only recompute total if quantity or unitPrice actually changed
        if (item.changed("quantity") || item.changed("unitPrice")) {
          item.total = multiplyQtyPrice(item.quantity, item.unitPrice);
        }
      },
    },
  }
);

module.exports = InvoiceItem;

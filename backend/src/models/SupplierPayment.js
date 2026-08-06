const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const SupplierPayment = sequelize.define(
  "SupplierPayment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    supplierId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "id" } },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    paymentMethod: {
      type: DataTypes.ENUM(...ENUMS.SUPPLIER_PAYMENT_METHOD),
      allowNull: false,
      defaultValue: "cash",
    },
    reference: { type: DataTypes.STRING, allowNull: true },
    purchaseOrderId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "purchase_orders", key: "id" } },
    note: { type: DataTypes.TEXT, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" } },
  },
  {
    tableName: "supplier_payments",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["supplierId"] },
      { fields: ["purchaseOrderId"] },
      { fields: ["paymentDate"] },
    ],
    hooks: {},
  }
);

module.exports = SupplierPayment;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const PurchaseOrder = sequelize.define(
  "PurchaseOrder",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    supplierId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "id" } },
    status: {
      type: DataTypes.ENUM(...ENUMS.PURCHASE_ORDER_STATUS),
      allowNull: false,
      defaultValue: "draft",
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    orderDate: { type: DataTypes.DATEONLY, allowNull: false },
    receivedDate: { type: DataTypes.DATEONLY, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" } },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "purchase_orders",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["supplierId"] },
      { fields: ["status"] },
      { fields: ["orderDate"] },
    ],
    hooks: {},
  }
);

module.exports = PurchaseOrder;

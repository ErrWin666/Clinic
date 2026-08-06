const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "invoices", key: "id" } },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    paymentMethod: {
      type: DataTypes.ENUM("cash", "card", "transfer", "cheque", "other"),
      allowNull: false,
      defaultValue: "cash",
    },
    note: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "payments",
    paranoid: true,
    indexes: [
      { fields: ["invoiceId"] },
      { fields: ["paymentDate"] },
    ],
  }
);

module.exports = Payment;

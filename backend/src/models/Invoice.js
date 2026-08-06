const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Invoice = sequelize.define(
  "Invoice",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    patientId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "patients", key: "id" } },
    customerName: { type: DataTypes.STRING, allowNull: true },
    customerPhone: { type: DataTypes.STRING, allowNull: true },
    invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    invoiceStatus: {
      type: DataTypes.ENUM(...ENUMS.INVOICE_STATUS),
      allowNull: false,
      defaultValue: "unpaid",
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    logo: { type: DataTypes.TEXT, allowNull: true },
    noteMessage: { type: DataTypes.TEXT, allowNull: true },
    noteContactLine: { type: DataTypes.STRING, allowNull: true },
    notePhone: { type: DataTypes.STRING, allowNull: true },
    noteEmail: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "invoices",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["patientId"] },
      { fields: ["invoiceStatus"] },
      { fields: ["invoiceDate"] },
    ],
    hooks: {},
  }
);

module.exports = Invoice;

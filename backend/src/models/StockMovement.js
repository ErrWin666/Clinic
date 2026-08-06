const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const StockMovement = sequelize.define(
  "StockMovement",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    productVariantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "product_variants", key: "id" } },
    batchId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "batches", key: "id" } },
    type: {
      type: DataTypes.ENUM(...ENUMS.STOCK_MOVEMENT_TYPE),
      allowNull: false,
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: {
      type: DataTypes.ENUM(...ENUMS.STOCK_MOVEMENT_REASON),
      allowNull: false,
    },
    unitCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    referenceType: {
      type: DataTypes.ENUM(...ENUMS.STOCK_REFERENCE_TYPE),
      allowNull: true,
    },
    referenceId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" } },
    note: { type: DataTypes.TEXT, allowNull: true },
    movementDate: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    tableName: "stock_movements",
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["productVariantId"] },
      { fields: ["batchId"] },
      { fields: ["type"] },
      { fields: ["referenceType", "referenceId"] },
      { fields: ["movementDate"] },
      { fields: ["userId"] },
      { fields: ["reason"] },
    ],
    hooks: {
      beforeCreate: (movement) => {
        movement.totalCost = Number(movement.quantity) * Number(movement.unitCost);
      },
    },
  }
);

module.exports = StockMovement;

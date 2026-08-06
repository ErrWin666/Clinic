const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Batch = sequelize.define(
  "Batch",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productVariantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "product_variants", key: "id" } },
    batchNumber: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    initialQuantity: { type: DataTypes.INTEGER, allowNull: false },
    unitCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    receivedDate: { type: DataTypes.DATEONLY, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "suppliers", key: "id" } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "batches",
    paranoid: true,
    indexes: [
      { fields: ["productVariantId"] },
      { fields: ["supplierId"] },
      { fields: ["expiryDate"] },
      { fields: ["isActive"] },
      { unique: true, fields: ["batchNumber", "productVariantId"] },
    ],
    hooks: {
      // Auto-deactivate batch when quantity reaches 0 (only on update, not create)
      beforeUpdate: (batch) => {
        if (batch.quantity <= 0 && batch.isActive) {
          batch.isActive = false;
        }
      },
    },
  }
);

module.exports = Batch;

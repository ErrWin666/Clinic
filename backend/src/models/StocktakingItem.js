const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const StocktakingItem = sequelize.define(
  "StocktakingItem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stocktakingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "stocktakings", key: "id" },
      onDelete: "CASCADE",
    },
    productVariantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "product_variants", key: "id" },
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "batches", key: "id" },
    },
    systemQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    countedQuantity: { type: DataTypes.INTEGER, allowNull: true },
    difference: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "stocktaking_items",
    paranoid: false,
    indexes: [
      { fields: ["stocktakingId"] },
      { fields: ["productVariantId"] },
      { fields: ["batchId"] },
    ],
  }
);

module.exports = StocktakingItem;

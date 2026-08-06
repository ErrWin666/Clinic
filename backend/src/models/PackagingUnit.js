const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const PackagingUnit = sequelize.define(
  "PackagingUnit",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productVariantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "product_variants", key: "id" },
      onDelete: "CASCADE",
    },
    name: { type: DataTypes.STRING(50), allowNull: false },
    shortName: { type: DataTypes.STRING(20), allowNull: false },
    factor: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isBaseUnit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    barcode: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    sellPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "packaging_units",
    paranoid: true,
    indexes: [
      { fields: ["productVariantId"] },
      { unique: true, fields: ["productVariantId", "name"] },
      { fields: ["barcode"] },
      { fields: ["isActive"] },
    ],
  }
);

module.exports = PackagingUnit;

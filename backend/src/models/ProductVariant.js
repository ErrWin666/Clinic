const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "id" } },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    barcode: { type: DataTypes.STRING, allowNull: true, unique: true },
    sellPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    costPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    minQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    maxQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    location: { type: DataTypes.STRING, allowNull: true },
    serialNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
    discountPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    discountValidUntil: { type: DataTypes.DATEONLY, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "product_variants",
    paranoid: true,
    indexes: [
      { fields: ["productId"] },
      { fields: ["sku"] },
      { fields: ["barcode"] },
      { fields: ["serialNumber"] },
      { fields: ["isActive"] },
    ],
    hooks: {},
  }
);

module.exports = ProductVariant;

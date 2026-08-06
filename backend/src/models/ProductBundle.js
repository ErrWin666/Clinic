const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const ProductBundle = sequelize.define(
  "ProductBundle",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "id" } },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "product_bundles",
    paranoid: true,
    indexes: [
      { fields: ["productId"] },
    ],
    hooks: {},
  }
);

module.exports = ProductBundle;

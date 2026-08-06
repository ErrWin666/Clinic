const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const ProductBundleItem = sequelize.define(
  "ProductBundleItem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bundleId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "product_bundles", key: "id" } },
    productVariantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "product_variants", key: "id" } },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: "product_bundle_items",
    paranoid: true,
    indexes: [
      { fields: ["bundleId"] },
      { fields: ["productVariantId"] },
    ],
    hooks: {},
  }
);

module.exports = ProductBundleItem;

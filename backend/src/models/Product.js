const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Product = sequelize.define(
  "Product",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: {
      type: DataTypes.ENUM(...ENUMS.PRODUCT_CATEGORY),
      allowNull: false,
      defaultValue: "other",
    },
    costingMethod: {
      type: DataTypes.ENUM(...ENUMS.COSTING_METHOD),
      allowNull: false,
      defaultValue: "fifo",
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "products",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["category"] },
      { fields: ["isActive"] },
    ],
    hooks: {},
  }
);

module.exports = Product;

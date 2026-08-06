const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const ExamConsumableRule = sequelize.define(
  "ExamConsumableRule",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    examType: { type: DataTypes.STRING, allowNull: false },
    productVariantId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "product_variants", key: "id" } },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "exam_consumable_rules",
    paranoid: true,
    indexes: [
      { fields: ["examType"] },
      { fields: ["productVariantId"] },
      { fields: ["isActive"] },
    ],
    hooks: {},
  }
);

module.exports = ExamConsumableRule;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Stocktaking = sequelize.define(
  "Stocktaking",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM("draft", "in_progress", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" } },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "stocktakings",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["status"] },
      { fields: ["userId"] },
    ],
  }
);

module.exports = Stocktaking;

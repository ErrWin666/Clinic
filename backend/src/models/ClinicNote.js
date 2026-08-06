const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const ClinicNote = sequelize.define(
  "ClinicNote",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
  },
  {
    tableName: "clinic_notes",
    paranoid: true,
    indexes: [{ fields: ["userId"] }, { fields: ["createdAt"] }],
  }
);

module.exports = ClinicNote;

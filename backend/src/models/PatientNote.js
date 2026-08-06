const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const PatientNote = sequelize.define(
  "PatientNote",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "patients", key: "id" } },
    title: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "id" } },
  },
  {
    tableName: "patient_notes",
    paranoid: true,
    indexes: [{ fields: ["patientId"] }, { fields: ["userId"] }, { fields: ["createdAt"] }],
  }
);

module.exports = PatientNote;

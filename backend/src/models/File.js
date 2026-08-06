const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const File = sequelize.define(
  "File",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "patients", key: "id" } },
    folderId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "folders", key: "id" } },
    examinationId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "eye_examinations", key: "id" } },
    clinicNoteId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "clinic_notes", key: "id" } },
    patientNoteId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "patient_notes", key: "id" } },
    type: { type: DataTypes.STRING, allowNull: false },
    size: { type: DataTypes.INTEGER, allowNull: false },
    path: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "files",
    paranoid: true,
    indexes: [{ fields: ["patientId"] }, { fields: ["folderId"] }, { fields: ["examinationId"] }, { fields: ["clinicNoteId"] }, { fields: ["patientNoteId"] }],
  }
);

module.exports = File;

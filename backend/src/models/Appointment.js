const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Appointment = sequelize.define(
  "Appointment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    appointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.STRING, allowNull: false },
    endTime: { type: DataTypes.STRING, allowNull: false },
    appointmentType: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM(...ENUMS.APPOINTMENT_STATUS),
      allowNull: false,
      defaultValue: "upcoming",
    },
    reason: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    patientId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "patients", key: "id" } },
    quickName: { type: DataTypes.STRING, allowNull: true },
    quickPhone: { type: DataTypes.STRING, allowNull: true },
    duration: { type: DataTypes.INTEGER, allowNull: true },
    confirmedAt: { type: DataTypes.DATE, allowNull: true },
    examinationId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "eye_examinations", key: "id" } },
    invoiceId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "invoices", key: "id" } },
  },
  {
    tableName: "appointments",
    paranoid: true,
    indexes: [
      { fields: ["appointmentDate"] },
      { fields: ["status"] },
      { fields: ["patientId"] },
      { fields: ["createdAt"] },
      { fields: ["examinationId"] },
      { fields: ["invoiceId"] },
    ],
    hooks: {},
  }
);

module.exports = Appointment;

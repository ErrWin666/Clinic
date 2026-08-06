const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Patient = sequelize.define(
  "Patient",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    birthDate: { type: DataTypes.DATEONLY, allowNull: false },
    age: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.birthDate) return null;
        const diff = Date.now() - new Date(this.birthDate).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      },
    },
    gender: { type: DataTypes.ENUM(...ENUMS.GENDER), allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true, unique: true },
    address: { type: DataTypes.STRING, allowNull: true },
    patientType: {
      type: DataTypes.ENUM(...ENUMS.PATIENT_TYPE),
      allowNull: false,
      defaultValue: "regular",
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    telegramChatId: { type: DataTypes.STRING, allowNull: true },
    telegramLinkToken: { type: DataTypes.STRING, allowNull: true },
    whatsappOptIn: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    preferredContactMethod: {
      type: DataTypes.ENUM("auto", "whatsapp", "telegram", "sms_mobile", "sms"),
      allowNull: false,
      defaultValue: "auto",
    },
  },
  {
    tableName: "patients",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["fullName"] },
      { fields: ["phoneNumber"] },
      { fields: ["patientType"] },
      { fields: ["gender"] },
      { fields: ["createdAt"] },
    ],
    hooks: {},
  }
);

module.exports = Patient;

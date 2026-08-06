const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");
const CustomError = require("../utils/CustomError");
const MESSAGES = require("../constants/messages");

const PatientRelationship = sequelize.define(
  "PatientRelationship",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    guardianId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "patients", key: "id" } },
    childId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "patients", key: "id" } },
    relationType: { type: DataTypes.ENUM(...ENUMS.RELATION_TYPE), allowNull: false },
  },
  {
    tableName: "patient_relationships",
    paranoid: true,
    indexes: [
      { fields: ["guardianId"] },
      { fields: ["childId"] },
      { unique: true, fields: ["guardianId", "childId"] },
    ],
    hooks: {
      beforeCreate: (rel) => {
        if (rel.guardianId === rel.childId) {
          throw new CustomError(MESSAGES.RELATIONSHIP.SELF_LINK, "SELF_RELATIONSHIP", 400);
        }
      },
    },
  }
);

module.exports = PatientRelationship;

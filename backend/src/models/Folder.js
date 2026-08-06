const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Folder = sequelize.define(
  "Folder",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false, references: { model: "patients", key: "id" } },
    parentFolderId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "folders", key: "id" } },
    path: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "folders",
    paranoid: true,
    indexes: [{ fields: ["patientId"] }, { fields: ["parentFolderId"] }],
  }
);

module.exports = Folder;

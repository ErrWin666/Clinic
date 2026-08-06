const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Settings = sequelize.define(
  "Settings",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.ENUM(...ENUMS.SETTINGS_CATEGORY), allowNull: false },
  },
  {
    tableName: "settings",
    timestamps: true,
    paranoid: false,
    updatedAt: true,
    createdAt: false,
  }
);

module.exports = Settings;

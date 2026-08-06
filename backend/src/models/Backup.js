const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Backup = sequelize.define(
  "Backup",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    filename: { type: DataTypes.STRING, allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM(...ENUMS.BACKUP_TYPE), allowNull: false },
    status: { type: DataTypes.ENUM(...ENUMS.BACKUP_STATUS), allowNull: false },
  },
  {
    tableName: "backups",
    timestamps: true,
    paranoid: false,
    updatedAt: false,
    indexes: [{ fields: ["type"] }, { fields: ["status"] }, { fields: ["createdAt"] }],
  }
);

module.exports = Backup;

const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const Notification = sequelize.define(
  "Notification",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM(...ENUMS.NOTIFICATION_TYPE), allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    entityType: { type: DataTypes.STRING, allowNull: true },
    dispatchChannel: { type: DataTypes.STRING, allowNull: true },
    dispatchedAt: { type: DataTypes.DATE, allowNull: true },
    dispatchError: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "notifications",
    timestamps: true,
    paranoid: false,
    indexes: [{ fields: ["isRead"] }, { fields: ["type"] }, { fields: ["createdAt"] }],
  }
);

module.exports = Notification;

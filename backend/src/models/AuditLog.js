const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const ENUMS = require("../constants/enums");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, references: { model: "users", key: "id" } },
    action: { type: DataTypes.ENUM(...ENUMS.AUDIT_ACTION), allowNull: false },
    entity: { type: DataTypes.STRING, allowNull: false },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    changes: { type: DataTypes.TEXT, allowNull: true },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    paranoid: false,
    updatedAt: false,
    indexes: [{ fields: ["userId"] }, { fields: ["entity"] }, { fields: ["action"] }, { fields: ["createdAt"] }],
  }
);

module.exports = AuditLog;

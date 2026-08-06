const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const RevokedToken = sequelize.define(
  "RevokedToken",
  {
    jti: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "RevokedTokens", timestamps: true, paranoid: false }
);

module.exports = RevokedToken;

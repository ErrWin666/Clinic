const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Supplier = sequelize.define(
  "Supplier",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    displayId: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    contactPerson: { type: DataTypes.STRING, allowNull: true },
    taxNumber: { type: DataTypes.STRING, allowNull: true },
    openingBalance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "suppliers",
    paranoid: true,
    indexes: [
      { fields: ["displayId"] },
      { fields: ["name"] },
      { fields: ["isActive"] },
    ],
    hooks: {},
  }
);

module.exports = Supplier;

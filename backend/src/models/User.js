const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");
const bcrypt = require("bcrypt");
const authConfig = require("../config/auth");
const ENUMS = require("../constants/enums");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    recoveryCodeHash: { type: DataTypes.STRING, allowNull: true },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    role: {
      type: DataTypes.ENUM(...ENUMS.USER_ROLE),
      allowNull: false,
      defaultValue: "admin",
    },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "users",
    paranoid: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, authConfig.bcryptRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, authConfig.bcryptRounds);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;

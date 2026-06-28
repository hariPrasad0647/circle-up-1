const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    fullName: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING, allowNull: false },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isPrivate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    profileImage: { type: DataTypes.STRING, allowNull: true },
    bio: { type: DataTypes.STRING(160), allowNull: true },
    profession: { type: DataTypes.STRING(100), allowNull: true },
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);

module.exports = User;

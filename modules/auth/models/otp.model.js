const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');

const Otp = sequelize.define(
  'Otp',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    email: { type: DataTypes.STRING, allowNull: false },
    codeHash: { type: DataTypes.STRING, allowNull: false },
    purpose: { type: DataTypes.STRING, allowNull: false, defaultValue: 'signup' },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    consumedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'otps',
    timestamps: true,
  }
);

module.exports = Otp;

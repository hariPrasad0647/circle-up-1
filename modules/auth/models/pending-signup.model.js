const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');

const PendingSignup = sequelize.define(
  'PendingSignup',
  {
    id: { type: DataTypes.UUID, defaultValue: uuidv4, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'pending_signups',
    timestamps: true,
    indexes: [{ unique: true, fields: ['email'] }],
  }
);

module.exports = PendingSignup;

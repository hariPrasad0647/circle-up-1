const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('./user.model');

const Interest = sequelize.define(
  'Interest',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    interest: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    tableName: 'user_interests',
    timestamps: false,
  }
);

User.hasMany(Interest, { foreignKey: 'userId', as: 'interests' });
Interest.belongsTo(User, { foreignKey: 'userId' });

module.exports = Interest;

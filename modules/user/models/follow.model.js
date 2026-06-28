const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('./user.model');

const Follow = sequelize.define(
  'Follow',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    followerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    followingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'follows',
    timestamps: true,
    indexes: [{ unique: true, fields: ['followerId', 'followingId'] }],
  }
);

Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

module.exports = Follow;

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const Reel = require('./reel.model');
const User = require('../../user/models/user.model');

const ReelMention = sequelize.define(
  'ReelMention',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    reelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'reels', key: 'id' },
      onDelete: 'CASCADE',
    },
    mentionedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'reel_mentions',
    timestamps: false,
  }
);

Reel.hasMany(ReelMention, { foreignKey: 'reelId', as: 'mentions' });
ReelMention.belongsTo(User, { foreignKey: 'mentionedUserId', as: 'mentionedUser' });

module.exports = ReelMention;

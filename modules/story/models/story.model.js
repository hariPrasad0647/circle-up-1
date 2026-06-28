const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const Story = sequelize.define(
  'Story',
  {
    id: { type: DataTypes.UUID, defaultValue: uuidv4, primaryKey: true },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    mediaUrl: { type: DataTypes.STRING, allowNull: false },
    mediaType: { type: DataTypes.ENUM('image', 'video'), allowNull: false },
    caption: { type: DataTypes.STRING(200), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: 'stories', timestamps: true }
);

Story.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Story, { foreignKey: 'userId', as: 'stories' });

module.exports = Story;

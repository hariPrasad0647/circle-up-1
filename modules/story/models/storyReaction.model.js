const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const Story = require('./story.model');
const User = require('../../user/models/user.model');

const StoryReaction = sequelize.define(
  'StoryReaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    storyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stories', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    emoji: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: 'story_reactions',
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['storyId', 'userId'] }],
  }
);

StoryReaction.belongsTo(Story, { foreignKey: 'storyId' });
StoryReaction.belongsTo(User, { foreignKey: 'userId', as: 'reactor' });
Story.hasMany(StoryReaction, { foreignKey: 'storyId', as: 'reactions' });

module.exports = StoryReaction;

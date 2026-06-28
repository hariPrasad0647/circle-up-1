const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const Story = require('./story.model');
const User = require('../../user/models/user.model');

const StoryView = sequelize.define(
  'StoryView',
  {
    id: { type: DataTypes.UUID, defaultValue: uuidv4, primaryKey: true },
    storyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'stories', key: 'id' },
      onDelete: 'CASCADE',
    },
    viewerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    viewedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'story_views',
    timestamps: false,
    indexes: [{ unique: true, fields: ['storyId', 'viewerId'] }],
  }
);

Story.hasMany(StoryView, { foreignKey: 'storyId', as: 'views' });
StoryView.belongsTo(Story, { foreignKey: 'storyId' });
StoryView.belongsTo(User, { foreignKey: 'viewerId', as: 'viewer' });

module.exports = StoryView;

const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const Post = require('./post.model');
const User = require('../../user/models/user.model');

const PostMention = sequelize.define(
  'PostMention',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'posts', key: 'id' },
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
    tableName: 'post_mentions',
    timestamps: false,
  }
);

Post.hasMany(PostMention, { foreignKey: 'postId', as: 'mentions' });
PostMention.belongsTo(User, { foreignKey: 'mentionedUserId', as: 'mentionedUser' });

module.exports = PostMention;

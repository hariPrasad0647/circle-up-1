const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');
const Comment = require('./comment.model');

const CommentLike = sequelize.define(
  'CommentLike',
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
    commentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'comments', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'comment_likes',
    timestamps: true,
    updatedAt: false,
    indexes: [{ unique: true, fields: ['userId', 'commentId'] }],
  }
);

CommentLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId' });
Comment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'likes' });

module.exports = CommentLike;

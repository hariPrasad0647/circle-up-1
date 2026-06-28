const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const Post = sequelize.define(
  'Post',
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
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'posts',
    timestamps: true,
  }
);

Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });

module.exports = Post;

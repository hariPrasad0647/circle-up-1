const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const Post = require('./post.model');

const PostMedia = sequelize.define(
  'PostMedia',
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
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'post_media',
    timestamps: false,
  }
);

Post.hasMany(PostMedia, { foreignKey: 'postId', as: 'media' });
PostMedia.belongsTo(Post, { foreignKey: 'postId' });

module.exports = PostMedia;

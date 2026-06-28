const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const Post = require('./post.model');
const Hashtag = require('./hashtag.model');

const PostHashtag = sequelize.define(
  'PostHashtag',
  {
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'posts', key: 'id' },
      onDelete: 'CASCADE',
    },
    hashtagId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hashtags', key: 'id' },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'post_hashtags',
    timestamps: false,
  }
);

Post.belongsToMany(Hashtag, { through: PostHashtag, foreignKey: 'postId', as: 'hashtags' });
Hashtag.belongsToMany(Post, { through: PostHashtag, foreignKey: 'hashtagId', as: 'posts' });

module.exports = PostHashtag;

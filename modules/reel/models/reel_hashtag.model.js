const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const Reel = require('./reel.model');
const Hashtag = require('../../post/models/hashtag.model');

const ReelHashtag = sequelize.define(
  'ReelHashtag',
  {
    reelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'reels', key: 'id' },
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
    tableName: 'reel_hashtags',
    timestamps: false,
  }
);

Reel.belongsToMany(Hashtag, { through: ReelHashtag, foreignKey: 'reelId', as: 'hashtags' });
Hashtag.belongsToMany(Reel, { through: ReelHashtag, foreignKey: 'hashtagId', as: 'reels' });

module.exports = ReelHashtag;

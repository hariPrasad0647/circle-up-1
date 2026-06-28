const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const User = require('../../user/models/user.model');

const Reel = sequelize.define(
  'Reel',
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
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
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
    tableName: 'reels',
    timestamps: true,
  }
);

Reel.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Reel, { foreignKey: 'userId', as: 'reels' });

module.exports = Reel;

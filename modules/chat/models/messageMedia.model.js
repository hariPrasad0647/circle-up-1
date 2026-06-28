const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../../../config/db');
const Message = require('./message.model');

const MessageMedia = sequelize.define(
  'MessageMedia',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'messages', key: 'id' },
      onDelete: 'CASCADE',
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'message_media',
    timestamps: true,
  }
);

Message.hasMany(MessageMedia, { foreignKey: 'messageId', as: 'media' });
MessageMedia.belongsTo(Message, { foreignKey: 'messageId' });

module.exports = MessageMedia;

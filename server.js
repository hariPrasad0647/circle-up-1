const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const sequelize = require('./config/db');
const logger = require('./utils/logger');
const registerChatSocket = require('./modules/chat/socket/chat.socket');

// Load all chat models so Sequelize syncs their tables
require('./modules/chat/models/conversation.model');
require('./modules/chat/models/conversationParticipant.model');
require('./modules/chat/models/message.model');
require('./modules/chat/models/messageMedia.model');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

registerChatSocket(io);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info('Database connected');
    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

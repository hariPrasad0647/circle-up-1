const app = require('./app');
const sequelize = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info('Database connected');
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

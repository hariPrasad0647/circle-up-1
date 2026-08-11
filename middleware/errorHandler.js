const logger = require('../utils/logger');
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`${req.method} ${req.originalUrl} ${statusCode} - ${err.message}`, err.stack);
  error(res, statusCode, err.message || 'Internal server error');
};

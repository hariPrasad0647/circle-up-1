const logger = require('../utils/logger');
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  logger.error(err);
  const statusCode = err.statusCode || 500;
  error(res, statusCode, err.message || 'Internal server error');
};

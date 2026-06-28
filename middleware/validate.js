const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 422, 'Validation failed', errors.array());
  }
  next();
};

const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  // Dedupe by field so the frontend gets one message per field, not one per failed rule
  const seen = new Set();
  const errors = [];
  for (const e of result.array()) {
    const field = e.path || e.param || 'field';
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, message: e.msg });
  }

  return error(res, 422, errors[0].message, errors);
};

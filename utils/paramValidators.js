const { param, query } = require('express-validator');

const uuidParam = (name) =>
  param(name).isUUID().withMessage(`"${name}" in the URL must be a valid id`);

const requiredQuery = (name, message) =>
  query(name).trim().notEmpty().withMessage(message || `Query parameter "${name}" is required`);

module.exports = { uuidParam, requiredQuery };

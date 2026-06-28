const { verifyAccessToken } = require('../config/jwt');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, 401, 'Authentication required');
  }

  try {
    req.user = verifyAccessToken(header.split(' ')[1]);
    next();
  } catch (err) {
    return error(res, 401, 'Invalid or expired token');
  }
};

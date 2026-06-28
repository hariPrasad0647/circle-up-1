const bcrypt = require('bcryptjs');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = (code) => bcrypt.hash(code, 10);

const compareOtp = (code, hash) => bcrypt.compare(code, hash);

module.exports = { generateOtp, hashOtp, compareOtp };

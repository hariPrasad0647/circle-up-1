const { Sequelize } = require('sequelize');

const useSSL = (process.env.DB_SSL || '').trim().toLowerCase() === 'true';

console.log(`[db] connecting to ${process.env.DB_HOST}:${process.env.DB_PORT} (ssl=${useSSL})`);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      charset: 'utf8mb4',
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ...(useSSL && {
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        },
      }),
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;

require('dotenv').config();
const sequelize = require('./config/db');

async function fixDb() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    // Update null phones to empty string
    const [results, metadata] = await sequelize.query("UPDATE users SET phone = '' WHERE phone IS NULL;");
    console.log(`Updated ${metadata.affectedRows} rows where phone was NULL.`);

    // If there is any invalid phone that is not varchar compliant (less likely), or something
    process.exit(0);
  } catch (err) {
    console.error('Failed to fix db:', err);
    process.exit(1);
  }
}

fixDb();

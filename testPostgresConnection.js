const db = require('./config/postgres');

async function testConnection() {
  try {
    const res = await db.query('SELECT NOW()');
    console.log('PostgreSQL connection successful. Current time:', res.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error('PostgreSQL connection failed:', err);
    process.exit(1);
  }
}

testConnection();

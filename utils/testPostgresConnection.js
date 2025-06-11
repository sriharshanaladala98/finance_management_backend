const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Sriharsha@98@db.hzjssvozkqrogkmokxih.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: 'require',
});

async function testConnection() {
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log('PostgreSQL connection successful:', res.rows[0]);
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error);
  } finally {
    await client.end();
  }
}

testConnection();

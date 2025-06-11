const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL|| "postgresql://postgres:admin@localhost:5433/finance"
;

const client = new Client({
  connectionString,
  // ssl:{
  //   rejectUnauthorized: false,
  // },
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('PostgreSQL connection error:', err.stack);
  });

module.exports = client;

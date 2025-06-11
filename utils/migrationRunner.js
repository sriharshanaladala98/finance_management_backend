const fs = require('fs');
const path = require('path');
const client = require('../config/postgres');

const migrationsDir = path.join(__dirname, '../migrations');
const migrationsTable = 'migrations';

async function ensureMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      run_on TIMESTAMP NOT NULL DEFAULT now()
    );
  `;
  await client.query(query);
}

async function getAppliedMigrations() {
  const res = await client.query(`SELECT filename FROM ${migrationsTable}`);
  return res.rows.map(row => row.filename);
}

async function runMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf-8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(`INSERT INTO ${migrationsTable} (filename) VALUES ($1)`, [filename]);
    await client.query('COMMIT');
    console.log(`Migration ${filename} applied successfully.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Failed to apply migration ${filename}:`, err);
    throw err;
  }
}

async function runPendingMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const allMigrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  const pending = allMigrations.filter(f => !applied.includes(f)).sort();
  for (const migration of pending) {
    await runMigration(migration);
  }
  if (pending.length === 0) {
    console.log('No pending migrations to run.');
  }
}

module.exports = {
  runPendingMigrations,
};

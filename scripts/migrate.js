const fs = require('fs');
const path = require('path');
const client = require('../config/postgres');

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log(`Running migration: ${file}`);
      await client.query(sql);
      console.log(`Migration ${file} applied successfully.`);
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigrations();

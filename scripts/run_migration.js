const { exec } = require('child_process');

const dbName = process.env.npm_config_db;

if (!dbName) {
  console.error('Error: Please provide the database name with --db=your_database_name');
  process.exit(1);
}

const command = `psql -U postgres -d ${dbName} -f fm_app_backend/migrations/003_full_schema.sql`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(\`Migration error: \${error.message}\`);
    process.exit(1);
  }
  if (stderr) {
    console.error(\`Migration stderr: \${stderr}\`);
  }
  console.log(\`Migration stdout: \${stdout}\`);
});


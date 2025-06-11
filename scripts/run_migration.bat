@echo off
setlocal

if "%npm_config_db%"=="" (
  echo Error: Please provide the database name with --db=your_database_name
  exit /b 1
)

psql -U postgres -d %npm_config_db% -f fm_app_backend\migrations\003_full_schema.sql

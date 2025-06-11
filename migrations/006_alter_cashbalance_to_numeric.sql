-- Migration to alter cashbalance column type to numeric in users table

ALTER TABLE users
ALTER COLUMN cashbalance TYPE numeric USING cashbalance::numeric;

-- Optionally, set default value to 0 if needed
ALTER TABLE users
ALTER COLUMN cashbalance SET DEFAULT 0;

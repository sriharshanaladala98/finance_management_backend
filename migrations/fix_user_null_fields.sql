-- Migration to fix null JSONB fields and cashBalance in users table

-- Set bankaccounts, creditcards, upiaccounts to empty JSON array if null
UPDATE users
SET bankaccounts = '[]'::jsonb
WHERE bankaccounts IS NULL;

UPDATE users
SET creditcards = '[]'::jsonb
WHERE creditcards IS NULL;

UPDATE users
SET upiaccounts = '[]'::jsonb
WHERE upiaccounts IS NULL;

-- Set cashbalance to 0 if null or not a valid number
UPDATE users
SET cashbalance = 0
WHERE cashbalance IS NULL OR cashbalance::text !~ '^\d+(\.\d+)?$';

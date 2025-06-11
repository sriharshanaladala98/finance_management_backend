-- Migration to add is_emi_eligible column to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS is_emi_eligible BOOLEAN DEFAULT FALSE;

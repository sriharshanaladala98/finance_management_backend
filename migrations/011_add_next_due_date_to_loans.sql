-- Migration to add next_due_date column to loans table
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP WITH TIME ZONE;

-- Migration to add upiApp column to transactions table

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS upiApp VARCHAR(255);

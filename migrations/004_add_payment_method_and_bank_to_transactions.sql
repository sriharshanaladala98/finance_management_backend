-- Migration to add payment_method and bank columns to transactions table

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS bank VARCHAR(255);

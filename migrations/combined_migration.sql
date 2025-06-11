-- Combined migration file created by merging 001_create_tables.sql, 002_redesigned_schema.sql, 003_add_user_financial_fields.sql, and 003_full_schema.sql

-- 001_create_tables.sql content
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  lender_name VARCHAR(255),
  loan_name VARCHAR(255),
  loan_amount NUMERIC,
  interest_rate NUMERIC,
  tenure_months INT,
  start_date DATE,
  due_date DATE,
  emi_amount NUMERIC,
  total_interest NUMERIC,
  total_payment NUMERIC,
  amortization_schedule JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  amount NUMERIC,
  category VARCHAR(255),
  type VARCHAR(50),
  date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  asset_name VARCHAR(255),
  description TEXT,
  purchase_value NUMERIC,
  payment_method VARCHAR(100),
  acquired_date DATE,
  audit_frequency VARCHAR(50),
  next_audit_date DATE,
  last_audited_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id),
  user_id UUID REFERENCES public.users(id),
  month INT,
  year INT,
  emi_amount NUMERIC,
  principal_amount NUMERIC,
  interest_amount NUMERIC,
  due_date DATE,
  status VARCHAR(50),
  last_due_amount NUMERIC,
  upcoming_due_amount NUMERIC,
  paid_date DATE,
  overdue_days INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  date DATE,
  balance NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 002_redesigned_schema.sql content
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.lenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_emis_loan_id ON public.emis(loan_id);
CREATE INDEX IF NOT EXISTS idx_emis_user_id ON public.emis(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_balances_user_id ON public.daily_balances(user_id);

-- 003_add_user_financial_fields.sql content
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bankAccounts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS creditCards JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS upiAccounts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cashBalance NUMERIC DEFAULT 0;

-- 003_full_schema.sql content
-- (This file largely overlaps with 001_create_tables.sql and 002_redesigned_schema.sql, so it is omitted to avoid duplication)

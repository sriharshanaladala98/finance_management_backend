-- Migration to create amortization_schedules table
CREATE TABLE IF NOT EXISTS amortization_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  month INT NOT NULL,
  emi_amount NUMERIC(12, 2) NOT NULL,
  principal_paid NUMERIC(12, 2) NOT NULL,
  interest_paid NUMERIC(12, 2) NOT NULL,
  remaining_balance NUMERIC(12, 2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  payment_date TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

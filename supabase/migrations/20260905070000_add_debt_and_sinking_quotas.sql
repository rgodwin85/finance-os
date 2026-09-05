-- Phase D Migration: Debt Payoff Parameters and Sinking Fund Due Dates

ALTER TABLE public.debts
ADD COLUMN IF NOT EXISTS due_day INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.sinking_funds
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));

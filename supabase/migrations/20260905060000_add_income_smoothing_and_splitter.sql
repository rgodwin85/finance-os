-- Phase C Migration: Income Smoothing, Freedom Rate Parameters, and Paycheck Splitter Preferences

ALTER TABLE public.user_income_profiles 
ADD COLUMN IF NOT EXISTS is_variable_income BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS holding_buffer_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS target_monthly_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS work_hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
ADD COLUMN IF NOT EXISTS work_weeks_per_year NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS savings_target_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS paycheck_split_fixed_pct NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS paycheck_split_variable_pct NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS paycheck_split_sinking_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS paycheck_split_waterfall_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00;

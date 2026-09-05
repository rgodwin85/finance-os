-- Phase E Migration: Daily Streaks and 72-Hour Impulse Cooling Locker

-- 1. Extend user_income_profiles with streak and impulse counters
ALTER TABLE public.user_income_profiles
ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date DATE,
ADD COLUMN IF NOT EXISTS total_impulse_saved NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- 2. Create impulse_items table for 72-hour cooling locker
CREATE TABLE IF NOT EXISTS public.impulse_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    unlocks_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '72 hours'),
    status TEXT NOT NULL DEFAULT 'cooling' CHECK (status IN ('cooling', 'purchased', 'cancelled_saved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for user_id on impulse_items
CREATE INDEX IF NOT EXISTS idx_impulse_items_user_id ON public.impulse_items(user_id);

-- Enable RLS
ALTER TABLE public.impulse_items ENABLE ROW LEVEL SECURITY;

-- Policies for impulse_items
CREATE POLICY "Users can view own impulse items" ON public.impulse_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own impulse items" ON public.impulse_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own impulse items" ON public.impulse_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own impulse items" ON public.impulse_items FOR DELETE USING (auth.uid() = user_id);

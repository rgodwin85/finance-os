-- 1. USER INCOME & BUDGET PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_income_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    monthly_gross_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monthly_net_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    pay_frequency TEXT NOT NULL DEFAULT 'bi-weekly' CHECK (pay_frequency IN ('weekly', 'bi-weekly', 'monthly', 'variable')),
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 22.00,
    barebones_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    comfortable_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    wizard_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEX FOR USER_INCOME_PROFILES
CREATE INDEX IF NOT EXISTS idx_user_income_profiles_user_id ON public.user_income_profiles(user_id);

-- ENABLE RLS ON USER_INCOME_PROFILES
ALTER TABLE public.user_income_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income profile" ON public.user_income_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income profile" ON public.user_income_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income profile" ON public.user_income_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income profile" ON public.user_income_profiles FOR DELETE USING (auth.uid() = user_id);

-- 2. EXTEND CATEGORIES TABLE FOR GOVERNANCE & SUBSCRIPTIONS
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS rollover_rule TEXT NOT NULL DEFAULT 'sweep' CHECK (rollover_rule IN ('sweep', 'rollover')),
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_for_cancellation BOOLEAN NOT NULL DEFAULT FALSE;

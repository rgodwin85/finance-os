-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'variable', 'sinking_fund')),
    target_monthly NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. SINKING FUNDS TABLE
CREATE TABLE IF NOT EXISTS public.sinking_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monthly_contribution NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. MILESTONES TABLE (Waterfall Engine)
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    waterfall_stage INT NOT NULL CHECK (waterfall_stage BETWEEN 1 AND 5),
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DEBTS TABLE
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    minimum_payment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    strategy TEXT NOT NULL DEFAULT 'avalanche' CHECK (strategy IN ('avalanche', 'snowball')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. UTILITY BUFFERS TABLE (Smoothing seasonal spikes)
CREATE TABLE IF NOT EXISTS public.utility_buffers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    buffer_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    target_buffer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monthly_estimate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_sinking_funds_user_id ON public.sinking_funds(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON public.milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_stage ON public.milestones(waterfall_stage);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_utility_buffers_user_id ON public.utility_buffers(user_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinking_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_buffers ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR CATEGORIES
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR SINKING FUNDS
CREATE POLICY "Users can view own sinking funds" ON public.sinking_funds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sinking funds" ON public.sinking_funds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sinking funds" ON public.sinking_funds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sinking funds" ON public.sinking_funds FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR MILESTONES
CREATE POLICY "Users can view own milestones" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON public.milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON public.milestones FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR DEBTS
CREATE POLICY "Users can view own debts" ON public.debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- POLICIES FOR UTILITY BUFFERS
CREATE POLICY "Users can view own utility buffers" ON public.utility_buffers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own utility buffers" ON public.utility_buffers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own utility buffers" ON public.utility_buffers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own utility buffers" ON public.utility_buffers FOR DELETE USING (auth.uid() = user_id);

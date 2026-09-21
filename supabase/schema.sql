-- ==========================================
-- Modern Wealth & Balance - Supabase Database Schema
-- Integrity: Relational, Foreign Keys, Indexes, RLS Policies
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) CHECK (type IN ('checking', 'savings', 'investment', 'crypto')),
    account_number_masked VARCHAR(32) NOT NULL,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    apy NUMERIC(5, 2) DEFAULT NULL,
    institution VARCHAR(128) NOT NULL,
    color VARCHAR(32) NOT NULL DEFAULT '#0D5C4D',
    card_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    label VARCHAR(128) NOT NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    period VARCHAR(32) NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly')),
    color VARCHAR(32) NOT NULL DEFAULT '#4F46E5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRANSACTIONS TABLE (Relational with ACCOUNTS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    category VARCHAR(64) NOT NULL,
    account_id VARCHAR(64) NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id VARCHAR(64) REFERENCES public.accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(16) DEFAULT '00:00',
    merchant VARCHAR(128),
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TASKS TABLE (Secretary Agent Module)
CREATE TABLE IF NOT EXISTS public.tasks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    due_date VARCHAR(64),
    priority VARCHAR(16) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(64) NOT NULL DEFAULT 'general',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to VARCHAR(64) DEFAULT 'Secretary Agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. EMAILS & NOTIFICATIONS TABLE (Secretary Agent Module)
CREATE TABLE IF NOT EXISTS public.emails_notifications (
    id VARCHAR(64) PRIMARY KEY,
    sender VARCHAR(128) NOT NULL,
    subject VARCHAR(256) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'inbox' CHECK (category IN ('inbox', 'bank_alert', 'bill', 'receipt', 'reminder')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_taken VARCHAR(256),
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. WEBHOOK EVENTS TABLE (Zero-Friction Payment Automation)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id VARCHAR(64) PRIMARY KEY,
    source VARCHAR(64) NOT NULL DEFAULT 'AppleShortcuts_iOS',
    payload TEXT NOT NULL,
    parsed_amount NUMERIC(14, 2),
    parsed_merchant VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
    transaction_id VARCHAR(64) REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_emails_category ON public.emails_notifications(category);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON public.webhook_events(status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated user / anon client in development
CREATE POLICY "Allow full access for dev app" ON public.accounts FOR ALL USING (true);
CREATE POLICY "Allow full access for dev app" ON public.budgets FOR ALL USING (true);
CREATE POLICY "Allow full access for dev app" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Allow full access for dev app" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow full access for dev app" ON public.emails_notifications FOR ALL USING (true);
CREATE POLICY "Allow full access for dev app" ON public.webhook_events FOR ALL USING (true);

-- ==========================================
-- Modern Wealth & Balance - Python SQLite Relational Schema
-- Integrity: Primary Keys, Foreign Keys, Indexes, Checks
-- ==========================================

PRAGMA foreign_keys = ON;

-- 1. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('checking', 'savings', 'investment', 'crypto')),
    account_number_masked TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    apy REAL DEFAULT NULL,
    institution TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#0D5C4D',
    card_frozen INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    allocated_amount REAL NOT NULL DEFAULT 0.0,
    period TEXT NOT NULL DEFAULT 'monthly' CHECK(period IN ('monthly', 'weekly')),
    color TEXT NOT NULL DEFAULT '#4F46E5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRANSACTIONS TABLE (Relational with ACCOUNTS)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
    category TEXT NOT NULL,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    time TEXT DEFAULT '00:00',
    merchant TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TASKS TABLE (Secretary Agent Module)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    category TEXT NOT NULL DEFAULT 'general',
    completed INTEGER NOT NULL DEFAULT 0,
    assigned_to TEXT DEFAULT 'Secretary Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. EMAILS & NOTIFICATIONS TABLE (Secretary Agent Module)
CREATE TABLE IF NOT EXISTS emails_notifications (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'inbox',
    is_read INTEGER NOT NULL DEFAULT 0,
    action_taken TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. WEBHOOK EVENTS TABLE (Zero-Friction Payment Automation)
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'AppleShortcuts_iOS',
    payload TEXT NOT NULL,
    parsed_amount REAL,
    parsed_merchant TEXT,
    status TEXT NOT NULL DEFAULT 'processed',
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_wh_status ON webhook_events(status);

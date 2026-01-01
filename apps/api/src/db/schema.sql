-- Enable foreign keys (SQLite requires explicit enabling)
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    referral_code TEXT NOT NULL UNIQUE,
    referrer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    -- Prevent self-referral
    CHECK (referrer_id != id)
);

-- Index for fast referral code lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Index for finding users by referrer (important for tree traversal)
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    -- Ensure positive amount with minimum $1
    CHECK (amount >= 1.00)
);

-- Index for user donation lookups
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);

-- Index for donation amount aggregations
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- Migration 0007: Pro Users, Razorpay Transactions, and Bot Subscribers

CREATE TABLE IF NOT EXISTS pro_users (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  first_name TEXT,
  username TEXT,
  plan_type TEXT NOT NULL DEFAULT 'lifetime',
  is_pro INTEGER NOT NULL DEFAULT 1,
  is_banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  last_active_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pro_users_tg_id ON pro_users(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_pro_users_phone ON pro_users(phone_number);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  payment_id TEXT,
  telegram_user_id TEXT NOT NULL,
  phone_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  plan_type TEXT NOT NULL DEFAULT 'lifetime',
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_method TEXT,
  signature TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_tg_id ON payment_transactions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_created ON payment_transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS bot_subscribers (
  telegram_user_id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  subscribed_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_bot_subscribers_active ON bot_subscribers(is_active);

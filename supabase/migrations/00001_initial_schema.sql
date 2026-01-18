-- ============================================
-- Table Connect - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Merchants (가맹점)
-- ============================================
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  phone VARCHAR(50),
  business_hours JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{"fee_rate": 0.15, "currency": "JPY", "timezone": "Asia/Tokyo", "max_tables": 50, "session_ttl_hours": 2}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookup
CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_merchants_is_active ON merchants(is_active);

-- ============================================
-- 2. Menus (메뉴)
-- ============================================
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT,
  category VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for merchant menu lookup
CREATE INDEX idx_menus_merchant_id ON menus(merchant_id);
CREATE INDEX idx_menus_is_available ON menus(is_available);
CREATE INDEX idx_menus_category ON menus(category);

-- ============================================
-- 3. Sessions (세션)
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  nickname VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for active sessions lookup
CREATE INDEX idx_sessions_merchant_id ON sessions(merchant_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_merchant_active ON sessions(merchant_id, is_active);

-- ============================================
-- 4. Messages (메시지)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  receiver_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for message queries
CREATE INDEX idx_messages_sender ON messages(sender_session_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_session_id, receiver_session_id);

-- ============================================
-- 5. Gifts (선물)
-- ============================================
CREATE TYPE gift_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  receiver_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  message TEXT,
  status gift_status DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for gift queries
CREATE INDEX idx_gifts_sender ON gifts(sender_session_id);
CREATE INDEX idx_gifts_receiver ON gifts(receiver_session_id);
CREATE INDEX idx_gifts_status ON gifts(status);
CREATE INDEX idx_gifts_payment_intent ON gifts(stripe_payment_intent_id);

-- ============================================
-- 6. Settlements (정산)
-- ============================================
CREATE TYPE settlement_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,
  fee_amount INTEGER NOT NULL DEFAULT 0,
  net_amount INTEGER NOT NULL DEFAULT 0,
  status settlement_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for settlement queries
CREATE INDEX idx_settlements_merchant ON settlements(merchant_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);

-- ============================================
-- 7. Reports (신고)
-- ============================================
CREATE TYPE report_reason AS ENUM ('harassment', 'inappropriate_content', 'spam', 'impersonation', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reported_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status report_status DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Index for report queries
CREATE INDEX idx_reports_reporter ON reports(reporter_session_id);
CREATE INDEX idx_reports_reported ON reports(reported_session_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reason ON reports(reason);

-- ============================================
-- 8. Blocks (차단)
-- ============================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  blocked_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_session_id, blocked_session_id)
);

-- Index for block queries
CREATE INDEX idx_blocks_blocker ON blocks(blocker_session_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_session_id);

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

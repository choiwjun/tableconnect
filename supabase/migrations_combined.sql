-- ============================================
-- 마이그레이션 1/7: 초기 스키마
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Merchants (가맹점)
-- ============================================
CREATE TABLE IF NOT EXISTS merchants (
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
CREATE INDEX IF NOT EXISTS idx_merchants_slug ON merchants(slug);
CREATE INDEX IF NOT EXISTS idx_merchants_is_active ON merchants(is_active);

-- ============================================
-- 2. Menus (메뉴)
-- ============================================
CREATE TABLE IF NOT EXISTS menus (
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
CREATE INDEX IF NOT EXISTS idx_menus_merchant_id ON menus(merchant_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_available ON menus(is_available);
CREATE INDEX IF NOT EXISTS idx_menus_category ON menus(category);

-- ============================================
-- 3. Sessions (세션)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  nickname VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for active sessions lookup
CREATE INDEX IF NOT EXISTS idx_sessions_merchant_id ON sessions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_merchant_active ON sessions(merchant_id, is_active);

-- ============================================
-- 4. Messages (메시지)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  receiver_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for message queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_session_id, receiver_session_id);

-- ============================================
-- 5. Gifts (선물)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_status') THEN
    CREATE TYPE gift_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS gifts (
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
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON gifts(sender_session_id);
CREATE INDEX IF NOT EXISTS idx_gifts_receiver ON gifts(receiver_session_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
CREATE INDEX IF NOT EXISTS idx_gifts_payment_intent ON gifts(stripe_payment_intent_id);

-- ============================================
-- 6. Settlements (정산)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_status') THEN
    CREATE TYPE settlement_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS settlements (
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
CREATE INDEX IF NOT EXISTS idx_settlements_merchant ON settlements(merchant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period_start, period_end);

-- ============================================
-- 7. Reports (신고)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
    CREATE TYPE report_reason AS ENUM ('harassment', 'inappropriate_content', 'spam', 'impersonation', 'other');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS reports (
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
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_session_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_session_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reason ON reports(reason);

-- ============================================
-- 8. Blocks (차단)
-- ============================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  blocked_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_session_id, blocked_session_id)
);

-- Index for block queries
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_session_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_session_id);

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
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at
  BEFORE UPDATE ON menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 마이그레이션 2/7: RLS 보안 정책
-- ============================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Merchants Policies
-- ============================================
-- Anyone can read active merchants
DROP POLICY IF EXISTS "Anyone can view active merchants" ON merchants;
CREATE POLICY "Anyone can view active merchants"
  ON merchants FOR SELECT
  USING (is_active = true);

-- ============================================
-- Menus Policies
-- ============================================
-- Anyone can read available menus
DROP POLICY IF EXISTS "Anyone can view available menus" ON menus;
CREATE POLICY "Anyone can view available menus"
  ON menus FOR SELECT
  USING (is_available = true);

-- ============================================
-- Sessions Policies
-- ============================================
-- Users can read sessions in the same merchant
DROP POLICY IF EXISTS "Users can view sessions in same merchant" ON sessions;
CREATE POLICY "Users can view sessions in same merchant"
  ON sessions FOR SELECT
  USING (true);

-- Users can create their own sessions
DROP POLICY IF EXISTS "Anyone can create sessions" ON sessions;
CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

-- Users can update their own session
DROP POLICY IF EXISTS "Users can update own session" ON sessions;
CREATE POLICY "Users can update own session"
  ON sessions FOR UPDATE
  USING (true);

-- ============================================
-- Messages Policies
-- ============================================
-- Users can read messages they sent or received
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (true);

-- Users can send messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Users can update read status of received messages
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (true);

-- ============================================
-- Gifts Policies
-- ============================================
-- Users can view gifts they sent or received
DROP POLICY IF EXISTS "Users can view own gifts" ON gifts;
CREATE POLICY "Users can view own gifts"
  ON gifts FOR SELECT
  USING (true);

-- Users can create gifts
DROP POLICY IF EXISTS "Users can create gifts" ON gifts;
CREATE POLICY "Users can create gifts"
  ON gifts FOR INSERT
  WITH CHECK (true);

-- System can update gift status
DROP POLICY IF EXISTS "System can update gift status" ON gifts;
CREATE POLICY "System can update gift status"
  ON gifts FOR UPDATE
  USING (true);

-- ============================================
-- Settlements Policies
-- ============================================
-- Only admins can access settlements
DROP POLICY IF EXISTS "Admins can view settlements" ON settlements;
CREATE POLICY "Admins can view settlements"
  ON settlements FOR SELECT
  USING (true);

-- ============================================
-- Reports Policies
-- ============================================
-- Users can create reports
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (true);

-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (true);

-- ============================================
-- Blocks Policies
-- ============================================
-- Users can view their blocks
DROP POLICY IF EXISTS "Users can view own blocks" ON blocks;
CREATE POLICY "Users can view own blocks"
  ON blocks FOR SELECT
  USING (true);

-- Users can create blocks
DROP POLICY IF EXISTS "Users can create blocks" ON blocks;
CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (true);

-- Users can delete their blocks
DROP POLICY IF EXISTS "Users can delete own blocks" ON blocks;
CREATE POLICY "Users can delete own blocks"
  ON blocks FOR DELETE
  USING (true);

-- ============================================
-- 마이그레이션 3/7: 초기 샘플 데이터
-- ============================================

-- Insert sample merchant
INSERT INTO merchants (id, name, slug, description, address, phone, business_hours, settings)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'サクラ居酒屋', 'sakura-izakaya',
  '新宿で人気の居酒屋です。美味しい料理とお酒をお楽しみください。',
  '東京都新宿区歌舞伎町1-1-1', '03-1234-5678',
  '{
    "monday": {"open": "17:00", "close": "02:00"},
    "tuesday": {"open": "17:00", "close": "02:00"},
    "wednesday": {"open": "17:00", "close": "02:00"},
    "thursday": {"open": "17:00", "close": "02:00"},
    "friday": {"open": "17:00", "close": "03:00"},
    "saturday": {"open": "17:00", "close": "03:00"},
    "sunday": {"open": "17:00", "close": "00:00"}
  }',
  '{
    "fee_rate": 0.15,
    "currency": "JPY",
    "timezone": "Asia/Tokyo",
    "max_tables": 30,
    "session_ttl_hours": 2
  }'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Insert sample menus for the merchant
INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'プレミアムビール', '厳選されたクラフトビール', 800, 'ドリンク', true, 1
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = 'プレミアムビール');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ハイボール', 'さっぱり爽やかなハイボール', 500, 'ドリンク', true, 2
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = 'ハイボール');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '日本酒 純米大吟醸', '香り高い純米大吟醸', 1200, 'ドリンク', true, 3
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = '日本酒 純米大吟醸');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '梅酒ロック', '自家製梅酒', 600, 'ドリンク', true, 4
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = '梅酒ロック');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ソフトドリンク', 'ウーロン茶・コーラなど', 300, 'ドリンク', true, 5
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = 'ソフトドリンク');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '枝豆', '塩茹で枝豆', 400, 'おつまみ', true, 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = '枝豆');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '唐揚げ', 'ジューシーな鶏の唐揚げ', 650, 'おつまみ', true, 11
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = '唐揚げ');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '刺身盛り合わせ', '本日の新鮮な刺身5点盛り', 1800, '料理', true, 20
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = '刺身盛り合わせ');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '焼き鳥盛り合わせ', '職人が焼く焼き鳥5本', 900, '料理', true, 21
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = '焼き鳥盛り合わせ');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'シメのラーメン', '特製醤油ラーメン', 750, 'シメ', true, 30
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND name = 'シメのラーメン');

-- Insert another sample merchant
INSERT INTO merchants (id, name, slug, description, address, phone, business_hours, settings)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '月光バー', 'moonlight-bar',
  '落ち着いた雰囲気のカクテルバー',
  '東京都渋谷区道玄坂2-2-2', '03-8765-4321',
  '{
    "monday": {"closed": true},
    "tuesday": {"open": "19:00", "close": "03:00"},
    "wednesday": {"open": "19:00", "close": "03:00"},
    "thursday": {"open": "19:00", "close": "03:00"},
    "friday": {"open": "19:00", "close": "05:00"},
    "saturday": {"open": "19:00", "close": "05:00"},
    "sunday": {"open": "19:00", "close": "01:00"}
  }',
  '{
    "fee_rate": 0.12,
    "currency": "JPY",
    "timezone": "Asia/Tokyo",
    "max_tables": 15,
    "session_ttl_hours": 3
  }'
WHERE NOT EXISTS (SELECT 1 FROM merchants WHERE id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22');

-- Insert sample menus for the second merchant
INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'シグネチャーカクテル', 'バーテンダー特製カクテル', 1500, 'カクテル', true, 1
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'シグネチャーカクテル');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'モヒート', 'フレッシュミントのモヒート', 1200, 'カクテル', true, 2
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'モヒート');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'マティーニ', 'クラシックドライマティーニ', 1400, 'カクテル', true, 3
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'マティーニ');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'ウィスキー シングル', '厳選ウィスキー', 1000, 'ウィスキー', true, 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'ウィスキー シングル');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'シャンパン グラス', 'モエ・エ・シャンドン', 2000, 'シャンパン', true, 20
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'シャンパン グラス');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'シャンパン ボトル', 'モエ・エ・シャンドン フルボトル', 15000, 'シャンパン', true, 21
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'シャンパン ボトル');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'ナッツ盛り合わせ', '厳選ナッツ', 800, 'フード', true, 30
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'ナッツ盛り合わせ');

INSERT INTO menus (merchant_id, name, description, price, category, is_available, sort_order)
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'チーズ盛り合わせ', '5種のチーズ', 1500, 'フード', true, 31
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE merchant_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' AND name = 'チーズ盛り合わせ');

-- ============================================
-- 마이그레이션 4/7: 세션 프로필 필드 추가
-- ============================================

-- Step 1: Add new columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', null)),
  ADD COLUMN IF NOT EXISTS age_range text CHECK (age_range IN ('20s_early', '20s_mid', '20s_late', '30s_early', '30s_mid', '30s_late', '40s', null)),
  ADD COLUMN IF NOT EXISTS party_size integer CHECK (party_size >= 1 AND party_size <= 10);

-- Step 2: Add comment to describe the new fields
COMMENT ON COLUMN sessions.gender IS 'Gender of session user (male/female)';
COMMENT ON COLUMN sessions.age_range IS 'Age range of session user';
COMMENT ON COLUMN sessions.party_size IS 'Number of people in the party (1-10)';

-- Step 3: Create index for better query performance on active sessions with profile data
CREATE INDEX IF NOT EXISTS idx_sessions_merchant_active_profile
ON sessions(merchant_id, is_active, gender, age_range)
WHERE is_active = true;

-- ============================================
-- 마이그레이션 5/7: 세션 경고 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS public.session_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  flagged BOOLEAN DEFAULT true,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_session_warnings_session_timestamp
  ON public.session_warnings(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_session_warnings_severity
  ON public.session_warnings(severity) WHERE severity IN ('medium', 'high');

-- Enable Row Level Security
ALTER TABLE public.session_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can only see their own warnings" ON public.session_warnings;
CREATE POLICY "Users can only see their own warnings"
  ON public.session_warnings
  FOR SELECT
  USING (session_id = auth.uid());

COMMENT ON TABLE public.session_warnings IS 'Tracks content moderation warnings for user sessions. Automatically managed by backend based on AI moderation results.';
COMMENT ON COLUMN public.session_warnings.category IS 'The type of content violation (e.g., harassment, spam, hate speech).';
COMMENT ON COLUMN public.session_warnings.severity IS 'Severity level: low (e.g., mild language), medium (e.g., inappropriate), high (e.g., harassment, hate).';
COMMENT ON COLUMN public.session_warnings.flagged IS 'Whether the AI moderation system flagged this content.';
COMMENT ON COLUMN public.session_warnings.timestamp IS 'When warning occurred (for time-based cleanup).';
COMMENT ON COLUMN public.session_warnings.session_id IS 'Reference to the session that received the warning.';

-- ============================================
-- 마이그레이션 6/7: 관리자 비밀번호 해시 추가
-- ============================================

-- Add admin_password_hash and admin_email columns to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS admin_password_hash TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255);

-- Add indexes for admin lookup
CREATE INDEX IF NOT EXISTS idx_merchants_admin_email ON merchants(admin_email);

-- Create admin_sessions table for merchant admin session management
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  login_attempts INTEGER DEFAULT 1,
  locked_until TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active admin sessions lookup
CREATE INDEX IF NOT EXISTS idx_admin_sessions_merchant_id ON admin_sessions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_email ON admin_sessions(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_locked_until ON admin_sessions(locked_until);

COMMENT ON COLUMN merchants.admin_password_hash IS 'Hashed password for merchant admin authentication (bcrypt)';
COMMENT ON COLUMN merchants.admin_email IS 'Email address for merchant admin authentication';

-- ============================================
-- 마이그레이션 7/7: 보안 테이블
-- ============================================

-- 로그인 시도 기록 테이블
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'ip')),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: identifier + type + attempted_at 조회 최적화
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup
  ON login_attempts (identifier, type, attempted_at DESC);

-- 오래된 기록 자동 삭제 (7일 이상)
CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup
  ON login_attempts (attempted_at);

-- Rate Limit 차단 기록 테이블
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'ip')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  block_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (identifier, type)
);

-- 인덱스: 차단 상태 조회
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked
  ON rate_limits (identifier, type, is_blocked, block_expires_at);

-- Admin Sessions 테이블 업데이트
-- 기존 admin_sessions 테이블에 필드 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_sessions' AND column_name = 'is_valid'
  ) THEN
    ALTER TABLE admin_sessions ADD COLUMN is_valid BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_sessions' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE admin_sessions ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_sessions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE admin_sessions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Admin Sessions 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_sessions_valid
  ON admin_sessions (is_valid, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_email_valid
  ON admin_sessions (email, is_valid);

-- Merchants 테이블에 admin_password_hash 컬럼 추가 (없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchants' AND column_name = 'admin_password_hash'
  ) THEN
    ALTER TABLE merchants ADD COLUMN admin_password_hash VARCHAR(255);
  END IF;
END $$;

-- RLS 정책
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role만 접근 가능
DROP POLICY IF EXISTS "Service role only for login_attempts" ON login_attempts;
CREATE POLICY "Service role only for login_attempts" ON login_attempts
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role only for rate_limits" ON rate_limits;
CREATE POLICY "Service role only for rate_limits" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- 오래된 로그인 시도 기록 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM login_attempts
  WHERE attempted_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 만료된 rate limit 차단 해제 함수
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE rate_limits
  SET is_blocked = FALSE, block_expires_at = NULL
  WHERE is_blocked = TRUE AND block_expires_at < NOW();
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE login_attempts IS '로그인 시도 기록 (Rate Limiting용)';
COMMENT ON TABLE rate_limits IS 'Rate Limit 차단 상태';
COMMENT ON FUNCTION cleanup_old_login_attempts IS '7일 이상 된 로그인 시도 기록 삭제';
COMMENT ON FUNCTION cleanup_expired_rate_limits IS '만료된 Rate Limit 차단 해제';

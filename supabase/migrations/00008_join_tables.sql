-- Migration: Join Tables (합석) Feature
-- Description: Tables for join request and join session management

-- 1. 합석 요청 테이블
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  from_table_number INTEGER NOT NULL,
  to_table_number INTEGER NOT NULL,
  from_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  to_session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL DEFAULT 'available_now',
  -- template_type options: 'available_now', 'available_soon', 'drink_together'
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes',
  responded_at TIMESTAMPTZ,
  rejection_count INTEGER DEFAULT 0, -- 거절 횟수 추적
  CONSTRAINT different_tables CHECK (from_table_number != to_table_number),
  CONSTRAINT different_sessions CHECK (from_session_id != to_session_id)
);

-- 2. 합석 세션 테이블
CREATE TABLE IF NOT EXISTS join_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  request_id UUID REFERENCES join_requests(id) ON DELETE SET NULL,
  table_a_number INTEGER NOT NULL,
  table_b_number INTEGER NOT NULL,
  session_a_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_b_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  join_code VARCHAR(6) NOT NULL, -- 4~6자리 확인 코드
  status VARCHAR(20) NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation', 'confirmed', 'ended', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  confirmed_at TIMESTAMPTZ, -- 직원 확인 시점
  ended_at TIMESTAMPTZ,
  end_reason VARCHAR(50), -- 'timeout', 'manual', 'staff_ended'
  CONSTRAINT different_join_tables CHECK (table_a_number != table_b_number)
);

-- 3. 합석 쿨다운 추적 (악용 방지)
CREATE TABLE IF NOT EXISTS join_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  target_session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL이면 전체 쿨다운
  cooldown_type VARCHAR(30) NOT NULL CHECK (cooldown_type IN (
    'request_cooldown',      -- 5분 요청 쿨다운
    'rejection_cooldown',    -- 거절 후 30분 재요청 금지
    'multiple_rejection'     -- 3회 거절 시 1시간 잠금
  )),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_join_requests_merchant_status
  ON join_requests(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_from_session
  ON join_requests(from_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_to_session
  ON join_requests(to_session_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_join_requests_expires
  ON join_requests(expires_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_join_sessions_merchant_status
  ON join_sessions(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_join_sessions_code
  ON join_sessions(join_code, merchant_id) WHERE status = 'pending_confirmation';
CREATE INDEX IF NOT EXISTS idx_join_sessions_participants
  ON join_sessions(session_a_id, session_b_id, status);

CREATE INDEX IF NOT EXISTS idx_join_cooldowns_session
  ON join_cooldowns(session_id, cooldown_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_join_cooldowns_target
  ON join_cooldowns(session_id, target_session_id, cooldown_type);

-- RLS Policies
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_cooldowns ENABLE ROW LEVEL SECURITY;

-- join_requests policies
CREATE POLICY "Users can view their own join requests"
  ON join_requests FOR SELECT
  USING (
    from_session_id = auth.uid() OR
    to_session_id = auth.uid()
  );

CREATE POLICY "Users can create join requests"
  ON join_requests FOR INSERT
  WITH CHECK (from_session_id = auth.uid());

CREATE POLICY "Recipients can update join request status"
  ON join_requests FOR UPDATE
  USING (to_session_id = auth.uid())
  WITH CHECK (to_session_id = auth.uid());

-- join_sessions policies
CREATE POLICY "Participants can view their join sessions"
  ON join_sessions FOR SELECT
  USING (
    session_a_id = auth.uid() OR
    session_b_id = auth.uid()
  );

-- join_cooldowns policies
CREATE POLICY "Users can view their own cooldowns"
  ON join_cooldowns FOR SELECT
  USING (session_id = auth.uid());

-- Service role full access (for admin)
CREATE POLICY "Service role full access on join_requests"
  ON join_requests FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on join_sessions"
  ON join_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on join_cooldowns"
  ON join_cooldowns FOR ALL
  USING (auth.role() = 'service_role');

-- Function to generate random join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars VARCHAR(36) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * 36 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire pending requests
CREATE OR REPLACE FUNCTION expire_pending_join_requests()
RETURNS void AS $$
BEGIN
  UPDATE join_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to auto-end timed out join sessions
CREATE OR REPLACE FUNCTION end_expired_join_sessions()
RETURNS void AS $$
BEGIN
  UPDATE join_sessions
  SET status = 'ended',
      ended_at = NOW(),
      end_reason = 'timeout'
  WHERE status IN ('pending_confirmation', 'confirmed')
    AND ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired cooldowns
CREATE OR REPLACE FUNCTION cleanup_expired_cooldowns()
RETURNS void AS $$
BEGIN
  DELETE FROM join_cooldowns WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE join_requests IS '합석 요청 테이블 - 테이블 간 합석 제안 관리';
COMMENT ON TABLE join_sessions IS '합석 세션 테이블 - 수락된 합석의 확정 코드 및 상태 관리';
COMMENT ON TABLE join_cooldowns IS '합석 쿨다운 테이블 - 악용 방지를 위한 요청 제한';
COMMENT ON COLUMN join_requests.template_type IS '합석 제안 템플릿: available_now(지금 가능), available_soon(10분 뒤), drink_together(한잔 더)';
COMMENT ON COLUMN join_sessions.join_code IS '직원에게 보여줄 6자리 확인 코드';

-- Security Tables Migration
-- Rate Limiting 및 Admin Session 테이블

-- 로그인 시도 기록 테이블
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- email 또는 IP
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'ip')),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address VARCHAR(45), -- IPv6 지원
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
  -- is_valid 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_sessions' AND column_name = 'is_valid'
  ) THEN
    ALTER TABLE admin_sessions ADD COLUMN is_valid BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- last_activity_at 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_sessions' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE admin_sessions ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- created_at 컬럼 추가 (없는 경우)
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

CREATE INDEX IF NOT EXISTS idx_admin_sessions_email
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

-- Service role만 접근 가능 (일반 사용자 접근 불가)
CREATE POLICY "Service role only for login_attempts" ON login_attempts
  FOR ALL USING (auth.role() = 'service_role');

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

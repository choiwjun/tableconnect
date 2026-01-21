-- ============================================
-- Age Verification System Migration
-- 연령 확인 시스템 (주류 업장 특성상 필요)
-- ============================================

-- Add age verification fields to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_verified_by_staff BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_verification_staff_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_verification_method VARCHAR(20); -- 'self', 'staff', 'id_check'

-- Index for age verification queries
CREATE INDEX IF NOT EXISTS idx_sessions_age_verified ON sessions(age_verified_at) WHERE age_verified_at IS NOT NULL;

-- Comment explaining the age verification fields
COMMENT ON COLUMN sessions.age_verified_at IS '연령 확인 완료 시간';
COMMENT ON COLUMN sessions.age_verified_by_staff IS '직원에 의한 연령 확인 여부';
COMMENT ON COLUMN sessions.age_verification_staff_id IS '연령 확인을 처리한 직원 ID';
COMMENT ON COLUMN sessions.age_verification_method IS '연령 확인 방법 (self: 자가신고, staff: 직원확인, id_check: 신분증확인)';

-- ============================================
-- Staff Users Table for Admin/Staff Authentication
-- ============================================
CREATE TABLE IF NOT EXISTS staff_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff', -- 'admin', 'manager', 'staff'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_users_merchant ON staff_users(merchant_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);

-- Enable RLS
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Staff users policies
DROP POLICY IF EXISTS "Staff can view their merchant's staff" ON staff_users;
CREATE POLICY "Staff can view their merchant's staff"
  ON staff_users FOR SELECT
  USING (true); -- Filtered by merchant_id in application

-- Comment
COMMENT ON TABLE staff_users IS '매장 직원 정보 테이블';

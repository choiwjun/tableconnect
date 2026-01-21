-- ============================================
-- Gender/Age Filter Settings Migration
-- 성별/연령 필터 기본 OFF + 매장 설정에서만 ON 가능
-- ============================================

-- Add filter settings to merchants settings JSONB column
-- Default values: gender_filter and age_filter are both disabled by default

-- First, ensure merchants table has a settings column
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS filter_settings JSONB DEFAULT '{
  "enable_gender_filter": false,
  "enable_age_filter": false,
  "default_gender_filter": "all",
  "default_age_filter": "all"
}'::jsonb;

-- Update existing merchants to have default filter settings
UPDATE merchants
SET filter_settings = '{
  "enable_gender_filter": false,
  "enable_age_filter": false,
  "default_gender_filter": "all",
  "default_age_filter": "all"
}'::jsonb
WHERE filter_settings IS NULL;

-- Comment explaining the filter settings
COMMENT ON COLUMN merchants.filter_settings IS '성별/연령 필터 설정 (기본 OFF, 매장에서만 ON 가능)';

-- ============================================
-- Session Profile Scope Setting
-- 개인 프로필이 아닌 테이블 단위 프로필만 허용
-- ============================================

-- Add profile scope column to sessions (always 'table', never 'individual')
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS profile_scope VARCHAR(20) DEFAULT 'table' CHECK (profile_scope IN ('table'));

-- Comment
COMMENT ON COLUMN sessions.profile_scope IS '프로필 범위 - table만 허용 (개인 프로필 금지)';

-- Ensure photo uploads are restricted (already handled in storage policies, but document here)
-- Note: Photo uploads for profiles should be blocked at the application level
-- Only menu images should be allowed in the storage bucket

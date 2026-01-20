-- Add profile fields to sessions table
-- This migration adds gender, age_range, and party_size fields to the sessions table

-- Step 1: Add new columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', null)),
  ADD COLUMN IF NOT EXISTS age_range text CHECK (age_range IN ('20s_early', '20s_mid', '20s_late', '30s_early', '30s_mid', '30s_late', '40s', null)),
  ADD COLUMN IF NOT EXISTS party_size integer CHECK (party_size >= 1 AND party_size <= 10);

-- Step 2: Add comment to describe the new fields
COMMENT ON COLUMN sessions.gender IS 'Gender of the session user (male/female)';
COMMENT ON COLUMN sessions.age_range IS 'Age range of the session user';
COMMENT ON COLUMN sessions.party_size IS 'Number of people in the party (1-10)';

-- Step 3: Create index for better query performance on active sessions with profile data
CREATE INDEX IF NOT EXISTS idx_sessions_merchant_active_profile
ON sessions(merchant_id, is_active, gender, age_range)
WHERE is_active = true;

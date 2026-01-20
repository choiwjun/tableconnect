-- ============================================
-- Add admin_password_hash to merchants table
-- ============================================

-- Add admin_password_hash and admin_email columns to merchants table
ALTER TABLE merchants ADD COLUMN admin_password_hash TEXT;
ALTER TABLE merchants ADD COLUMN admin_email VARCHAR(255);

-- Add indexes for admin lookup
CREATE INDEX idx_merchants_admin_email ON merchants(admin_email);

-- ============================================
-- Create admin_sessions table for merchant admin session management
-- ============================================

CREATE TABLE admin_sessions (
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
CREATE INDEX idx_admin_sessions_merchant_id ON admin_sessions(merchant_id);
CREATE INDEX idx_admin_sessions_email ON admin_sessions(email);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_locked_until ON admin_sessions(locked_until);

-- ============================================
-- Add comment to merchants table
-- ============================================

COMMENT ON COLUMN merchants.admin_password_hash IS 'Hashed password for merchant admin authentication (bcrypt)';
COMMENT ON COLUMN merchants.admin_email IS 'Email address for merchant admin authentication';

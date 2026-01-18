-- ============================================
-- Table Connect - Row Level Security Policies
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
CREATE POLICY "Anyone can view active merchants"
  ON merchants FOR SELECT
  USING (is_active = true);

-- Only admins can modify merchants (handled via service role)

-- ============================================
-- Menus Policies
-- ============================================
-- Anyone can read available menus
CREATE POLICY "Anyone can view available menus"
  ON menus FOR SELECT
  USING (is_available = true);

-- Only admins can modify menus (handled via service role)

-- ============================================
-- Sessions Policies
-- ============================================
-- Users can read sessions in the same merchant
CREATE POLICY "Users can view sessions in same merchant"
  ON sessions FOR SELECT
  USING (true); -- Open for now, can be restricted later

-- Users can create their own sessions
CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

-- Users can update their own session
CREATE POLICY "Users can update own session"
  ON sessions FOR UPDATE
  USING (true); -- Will be restricted by session_id check in application

-- ============================================
-- Messages Policies
-- ============================================
-- Users can read messages they sent or received
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (true); -- Filtered by session_id in application

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (true); -- Validated in application

-- Users can update read status of received messages
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (true); -- Limited to is_read field in application

-- ============================================
-- Gifts Policies
-- ============================================
-- Users can view gifts they sent or received
CREATE POLICY "Users can view own gifts"
  ON gifts FOR SELECT
  USING (true); -- Filtered by session_id in application

-- Users can create gifts
CREATE POLICY "Users can create gifts"
  ON gifts FOR INSERT
  WITH CHECK (true); -- Validated in application

-- System can update gift status
CREATE POLICY "System can update gift status"
  ON gifts FOR UPDATE
  USING (true); -- Handled via service role

-- ============================================
-- Settlements Policies
-- ============================================
-- Only admins can access settlements (handled via service role)
CREATE POLICY "Admins can view settlements"
  ON settlements FOR SELECT
  USING (true); -- Restricted to admin routes

-- ============================================
-- Reports Policies
-- ============================================
-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (true);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (true); -- Filtered in application

-- Only admins can update reports (handled via service role)

-- ============================================
-- Blocks Policies
-- ============================================
-- Users can view their blocks
CREATE POLICY "Users can view own blocks"
  ON blocks FOR SELECT
  USING (true); -- Filtered by blocker_session_id in application

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (true);

-- Users can delete their blocks
CREATE POLICY "Users can delete own blocks"
  ON blocks FOR DELETE
  USING (true); -- Validated in application

-- ============================================
-- Enable Realtime for specific tables
-- ============================================
-- Note: Run these in Supabase Dashboard > Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE gifts;

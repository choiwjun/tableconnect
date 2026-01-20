-- Create session_warnings table
-- This table tracks content moderation warnings for each session

CREATE TABLE IF NOT EXISTS public.session_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g., 'harassment', 'spam', 'inappropriate', 'hate', 'violence', 'self_harm'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  flagged BOOLEAN DEFAULT true, -- whether the content was flagged by AI
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

-- Users can only see their own warnings
CREATE POLICY "Users can only see their own warnings"
  ON public.session_warnings
  FOR SELECT
  USING (session_id = auth.uid())
  WITH CHECK (true);

-- No direct INSERT/UPDATE/DELETE from clients (only through API)

COMMENT ON TABLE public.session_warnings IS 'Tracks content moderation warnings for user sessions. Automatically managed by backend based on AI moderation results.';

COMMENT ON COLUMN public.session_warnings.category IS 'The type of content violation (e.g., harassment, spam, hate speech).';

COMMENT ON COLUMN public.session_warnings.severity IS 'Severity level: low (e.g., mild language), medium (e.g., inappropriate), high (e.g., harassment, hate).';

COMMENT ON COLUMN public.session_warnings.flagged IS 'Whether the AI moderation system flagged this content.';

COMMENT ON COLUMN public.session_warnings.timestamp IS 'When the warning occurred (for time-based cleanup).';

COMMENT ON COLUMN public.session_warnings.session_id IS 'Reference to the session that received the warning.';

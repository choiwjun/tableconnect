import { createClient } from '@/lib/supabase/client';

interface WarningRecord {
  sessionId: string;
  category: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

const WARNING_DURATION_MS = 24 * 60 * 1000; // 24 hours
const MAX_WARNINGS = 3;

/**
 * Check if a session has exceeded maximum warnings
 */
export async function isSessionBlocked(sessionId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Get recent warnings for this session
    const { data: warnings, error } = await supabase
      .from('session_warnings')
      .select('*')
      .eq('session_id', sessionId)
      .gte('timestamp', new Date(Date.now() - WARNING_DURATION_MS).toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error checking session warnings:', error);
      return false;
    }

    const highSeverityCount = (warnings || []).filter(w => w.severity === 'high').length;

    return highSeverityCount >= MAX_WARNINGS;
  } catch (err) {
    console.error('Error checking session blocked status:', err);
    return false;
  }
}

/**
 * Record a warning for a session
 */
export async function recordWarning(
  sessionId: string,
  category: string,
  severity: WarningRecord['severity']
): Promise<void> {
  try {
    const supabase = createClient();

    await supabase
      .from('session_warnings')
      .insert({
        session_id: sessionId,
        category,
        severity,
        timestamp: new Date().toISOString(),
      });

    // Clean up old warnings (older than WARNING_DURATION_MS)
    await supabase
      .from('session_warnings')
      .delete()
      .lt('timestamp', new Date(Date.now() - WARNING_DURATION_MS).toISOString());

  } catch (err) {
    console.error('Error recording warning:', err);
  }
}

/**
 * Get warning count for a session
 */
export async function getWarningCount(sessionId: string): Promise<number> {
  try {
    const supabase = createClient();

    const { data: warnings, error } = await supabase
      .from('session_warnings')
      .select('id')
      .eq('session_id', sessionId)
      .gte('timestamp', new Date(Date.now() - WARNING_DURATION_MS).toISOString());

    if (error) {
      console.error('Error getting warning count:', error);
      return 0;
    }

    return warnings?.length || 0;
  } catch (err) {
    console.error('Error getting warning count:', err);
    return 0;
  }
}

/**
 * Check if a session should be temporarily suspended based on recent warnings
 */
export async function shouldBlockSession(sessionId: string): Promise<boolean> {
  const isBlocked = await isSessionBlocked(sessionId);
  return isBlocked;
}

/**
 * Clear warnings for a session (useful for admin actions)
 */
export async function clearWarnings(sessionId: string): Promise<void> {
  try {
    const supabase = createClient();

    await supabase
      .from('session_warnings')
      .delete()
      .eq('session_id', sessionId);

  } catch (err) {
    console.error('Error clearing warnings:', err);
  }
}

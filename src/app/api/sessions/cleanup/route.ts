import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/sessions/cleanup
 * Clean up expired sessions and their messages
 * Can be called via cron job
 */
export async function POST(request: NextRequest) {
  try {
    const { cronSecret } = await request.json();

    // Verify cron secret (optional security measure)
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date();

    // 1. Deactivate expired sessions
    const { error: sessionsError, data: expiredSessions } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .lt('expires_at', now.toISOString())
      .select('id');

    if (sessionsError) {
      console.error('Error deactivating sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to deactivate sessions' },
        { status: 500 }
      );
    }

    // 2. Delete messages from expired sessions (older than 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', oneDayAgo.toISOString());

    if (messagesError) {
      console.error('Error deleting old messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to delete old messages' },
        { status: 500 }
      );
    }

    // 3. Clear old session warnings (older than 24 hours)
    const { error: warningsError } = await supabase
      .from('session_warnings')
      .delete()
      .lt('timestamp', oneDayAgo.toISOString());

    if (warningsError) {
      console.error('Error deleting old warnings:', warningsError);
      // Non-critical, continue
    }

    console.log(`Session cleanup completed at ${now.toISOString()}`, {
      deactivatedSessions: expiredSessions?.length || 0,
    });

    return NextResponse.json({
      success: true,
      deactivatedSessions: expiredSessions?.length || 0,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/cleanup
 * Manual trigger for cleanup (for debugging)
 */
export async function GET() {
  return POST(
    new NextRequest('https://api/sessions/cleanup', {
      method: 'POST',
      body: JSON.stringify({ cronSecret: process.env.CRON_SECRET }),
    })
  );
}

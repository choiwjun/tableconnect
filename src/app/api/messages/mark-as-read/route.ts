import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

/**
 * POST /api/messages/mark-as-read
 * Mark all unread messages from partner as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, partnerId } = body;

    // Validate input
    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    if (!partnerId || !isValidUUID(partnerId)) {
      return NextResponse.json(
        { error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Mark all unread messages from partner as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_session_id', partnerId)
      .eq('receiver_session_id', sessionId)
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message marking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

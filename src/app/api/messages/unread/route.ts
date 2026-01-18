import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

/**
 * GET /api/messages/unread?sessionId=xxx
 * Get unread message counts grouped by sender
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get unread messages grouped by sender
    const { data: messages, error } = await supabase
      .from('messages')
      .select('sender_session_id')
      .eq('receiver_session_id', sessionId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread counts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch unread counts' },
        { status: 500 }
      );
    }

    // Count messages per sender
    const unreadCounts: Record<string, number> = {};
    let totalUnread = 0;

    (messages || []).forEach((msg) => {
      const senderId = msg.sender_session_id;
      unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
      totalUnread++;
    });

    return NextResponse.json({
      totalUnread,
      unreadBySender: unreadCounts,
    });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/unread
 * Mark messages as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, senderSessionId } = body;

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    if (!senderSessionId || !isValidUUID(senderSessionId)) {
      return NextResponse.json(
        { error: 'Invalid sender session ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Mark messages from sender as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_session_id', sessionId)
      .eq('sender_session_id', senderSessionId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

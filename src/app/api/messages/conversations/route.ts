import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/messages/conversations
 * Get all conversations for a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch all unique receiver session IDs
    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('receiver_session_id')
      .eq('sender_session_id', sessionId);

    if (sentError) {
      console.error('Error fetching sent messages:', sentError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    const receiverIds = new Set((sentMessages || []).map(m => m.receiver_session_id));

    // Fetch session info for each receiver
    const conversations = [];
    for (const receiverId of receiverIds) {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', receiverId)
        .single();

      if (!sessionError && session) {
        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_session_id.eq.${sessionId},receiver_session_id.eq.${receiverId}),and(sender_session_id.eq.${receiverId},receiver_session_id.eq.${sessionId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: false })
          .eq('sender_session_id', receiverId)
          .eq('receiver_session_id', sessionId)
          .eq('is_read', false);

        conversations.push({
          partnerSession: session,
          lastMessage: lastMsg,
          unreadCount: unreadCount || 0,
        });
      }
    }

    return NextResponse.json({
      data: conversations,
    });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, isValidMessage } from '@/lib/utils/validators';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * POST /api/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderSessionId, receiverSessionId, content } = body;

    // Validate input
    if (!senderSessionId || !isValidUUID(senderSessionId)) {
      return NextResponse.json(
        { error: 'Invalid sender session ID' },
        { status: 400 }
      );
    }

    if (!receiverSessionId || !isValidUUID(receiverSessionId)) {
      return NextResponse.json(
        { error: 'Invalid receiver session ID' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    if (!isValidMessage(trimmedContent)) {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 400 }
      );
    }

    // Cannot send message to self
    if (senderSessionId === receiverSessionId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify both sessions exist and are active
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, merchant_id, is_active, expires_at')
      .in('id', [senderSessionId, receiverSessionId]);

    if (sessionsError || !sessions || sessions.length !== 2) {
      return NextResponse.json(
        { error: 'One or both sessions not found' },
        { status: 404 }
      );
    }

    const senderSession = sessions.find((s) => s.id === senderSessionId);
    const receiverSession = sessions.find((s) => s.id === receiverSessionId);

    if (!senderSession || !receiverSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check sessions are from same merchant
    if (senderSession.merchant_id !== receiverSession.merchant_id) {
      return NextResponse.json(
        { error: 'Sessions must be from the same merchant' },
        { status: 400 }
      );
    }

    // Check both sessions are active and not expired
    const now = new Date();
    const senderExpired = !senderSession.is_active || new Date(senderSession.expires_at) < now;
    const receiverExpired = !receiverSession.is_active || new Date(receiverSession.expires_at) < now;

    if (senderExpired) {
      return NextResponse.json(
        { error: 'Your session has expired' },
        { status: 410 }
      );
    }

    if (receiverExpired) {
      return NextResponse.json(
        { error: 'Recipient session has expired' },
        { status: 410 }
      );
    }

    // Check if sender is blocked by receiver
    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_session_id', receiverSessionId)
      .eq('blocked_session_id', senderSessionId)
      .single();

    if (block) {
      return NextResponse.json(
        { error: 'You cannot send messages to this user' },
        { status: 403 }
      );
    }

    // Create message
    const { data: message, error: createError } = await supabase
      .from('messages')
      .insert({
        sender_session_id: senderSessionId,
        receiver_session_id: receiverSessionId,
        content: trimmedContent,
        is_read: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating message:', createError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Message creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages?sessionId=xxx&partnerId=xxx
 * Get messages between two sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const partnerId = searchParams.get('partnerId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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

    // Get messages between the two sessions (both directions)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_session_id.eq.${sessionId},receiver_session_id.eq.${partnerId}),and(sender_session_id.eq.${partnerId},receiver_session_id.eq.${sessionId})`
      )
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Mark received messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_session_id', partnerId)
      .eq('receiver_session_id', sessionId)
      .eq('is_read', false);

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

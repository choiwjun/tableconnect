import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { moderateContent, getModerationErrorMessage } from '@/lib/moderation/openai';
import { recordWarning, getSessionWarnings, blockSession } from '@/lib/moderation/warnings';

/**
 * POST /api/messages
 * Send a new message to a partner session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderSessionId, receiverSessionId, content, messageType = 'text' } = body;

    // Validate required fields
    if (!senderSessionId || !receiverSessionId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate message length
    if (content.length > 200) {
      return NextResponse.json(
        { error: 'Message too long (max 200 characters)' },
        { status: 400 }
      );
    }

    if (content.length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // AI Content Moderation
    const moderationResult = await moderateContent(content);

    if (!moderationResult.isAllowed) {
      const errorMessage = getModerationErrorMessage(
        moderationResult.categories,
        'ja'
      );

      // Record warning
      await recordWarning(
        supabase,
        senderSessionId,
        moderationResult.categories,
        moderationResult.categoryScores,
        moderationResult.flagged
      );

      // Check for session block
      const warnings = await getSessionWarnings(supabase, senderSessionId);
      const highSeverityWarnings = warnings.filter((w: { severity: string }) => w.severity === 'high').length;

      if (highSeverityWarnings >= 3) {
        await blockSession(supabase, senderSessionId);
        return NextResponse.json(
          { error: 'Your session has been temporarily blocked due to repeated inappropriate content.' },
          { status: 403 }
        );
      }

      console.log('Content moderation blocked message:', {
        senderSessionId,
        categories: moderationResult.categories,
        flagged: moderationResult.flagged,
      });

      return NextResponse.json(
        {
          error: errorMessage,
          moderationCategories: moderationResult.categories,
        },
        { status: 400 }
      );
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_session_id: senderSessionId,
        receiver_session_id: receiverSessionId,
        content,
        message_type: messageType, // 'text', 'emoji', or 'quick_reply'
        is_read: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Send message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages
 * Get messages between two sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const partnerId = searchParams.get('partnerId');

    if (!sessionId || !partnerId) {
      return NextResponse.json(
        { error: 'Session ID and Partner ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_session_id.eq.${sessionId},receiver_session_id.eq.${partnerId})`,
        `and(sender_session_id.eq.${partnerId},receiver_session_id.eq.${sessionId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: messages || [],
    });
  } catch (error) {
    console.error('Get messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

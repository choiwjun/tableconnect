import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { moderateContent, getModerationErrorMessage } from '@/lib/moderation/openai';
import { recordWarning, getSessionWarnings, blockSession } from '@/lib/moderation/warnings';
import { isMutuallyBlocked, getAllBlockedSessionIds } from '@/lib/security/block-check';
import { detectContactInfo, getContactWarningMessage } from '@/lib/security/contact-filter';
import { checkMessageRateLimit, getMessageRateLimitError } from '@/lib/security/message-rate-limit';
import { containsForbiddenWords } from '@/lib/utils/validators';

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

    // Check message rate limit first (before any DB operations)
    const rateLimitResult = checkMessageRateLimit(senderSessionId, receiverSessionId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: getMessageRateLimitError(
            rateLimitResult.reason || 'cooldown',
            rateLimitResult.retryAfterMs || 3000,
            'ja'
          ),
          retryAfterMs: rateLimitResult.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.retryAfterMs || 3000) / 1000)),
          },
        }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if either user has blocked the other
    const blocked = await isMutuallyBlocked(supabase, senderSessionId, receiverSessionId);
    if (blocked) {
      return NextResponse.json(
        { error: 'Cannot send message to this user' },
        { status: 403 }
      );
    }

    // Quick forbidden words check (faster than AI moderation)
    const forbiddenCheck = containsForbiddenWords(content);
    if (forbiddenCheck.hasForbidden) {
      await recordWarning(senderSessionId, 'forbidden_words', 'medium');

      return NextResponse.json(
        {
          error: '不適切な表現が含まれています',
        },
        { status: 400 }
      );
    }

    // Contact information detection (LINE, Instagram, phone, email, etc.)
    const contactCheck = detectContactInfo(content);
    if (contactCheck.hasContact) {
      // Record warning for contact info sharing attempt
      await recordWarning(senderSessionId, `contact_info:${contactCheck.detectedTypes.join(',')}`, 'medium');

      console.log('Contact info detected in message:', {
        senderSessionId,
        detectedTypes: contactCheck.detectedTypes,
        matches: contactCheck.matches,
      });

      return NextResponse.json(
        {
          error: getContactWarningMessage(contactCheck.detectedTypes, 'ja'),
          detectedTypes: contactCheck.detectedTypes,
        },
        { status: 400 }
      );
    }

    // AI Content Moderation
    const moderationResult = await moderateContent(content);

    if (!moderationResult.isAllowed) {
      const errorMessage = getModerationErrorMessage(
        moderationResult.categories,
        'ja'
      );

      // Record warning - determine severity based on flagged status
      const severity = moderationResult.flagged ? 'high' : 'medium';
      const category = Object.entries(moderationResult.categories || {})
        .filter(([, flagged]) => flagged)
        .map(([cat]) => cat)
        .join(', ') || 'unknown';
      await recordWarning(senderSessionId, category, severity);

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

    // Check if either user has blocked the other
    const blocked = await isMutuallyBlocked(supabase, sessionId, partnerId);
    if (blocked) {
      // Return empty messages for blocked users (don't reveal block status)
      return NextResponse.json({
        data: [],
      });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_session_id.eq.${sessionId},receiver_session_id.eq.${partnerId}),and(sender_session_id.eq.${partnerId},receiver_session_id.eq.${sessionId})`
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

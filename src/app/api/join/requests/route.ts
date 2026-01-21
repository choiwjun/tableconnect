import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  checkJoinRequestAllowed,
  recordJoinRequestCooldown,
  getJoinRateLimitError,
} from '@/lib/security/join-rate-limit';

// 합석 제안 템플릿 메시지
const TEMPLATE_MESSAGES: Record<string, Record<string, string>> = {
  available_now: {
    ja: '今すぐ合席できます！一緒に飲みませんか？',
    ko: '지금 바로 합석 가능해요! 같이 한잔 할까요?',
    en: "We're available right now! Want to join us for a drink?",
    'zh-CN': '现在就可以合桌！一起喝一杯吗？',
    'zh-TW': '現在就可以合桌！一起喝一杯嗎？',
  },
  available_soon: {
    ja: '10分後くらいに合席できます！',
    ko: '10분 뒤에 합석 가능해요!',
    en: "We'll be available in about 10 minutes!",
    'zh-CN': '大约10分钟后可以合桌！',
    'zh-TW': '大約10分鐘後可以合桌！',
  },
  drink_together: {
    ja: 'もう一杯一緒にどうですか？',
    ko: '한잔 더 하면서 이야기할래요?',
    en: 'How about another drink together?',
    'zh-CN': '再来一杯怎么样？',
    'zh-TW': '再來一杯怎麼樣？',
  },
};

/**
 * POST /api/join/requests
 * 합석 요청 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromSessionId, toSessionId, templateType = 'available_now' } = body;

    // Validate required fields
    if (!fromSessionId || !toSessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (fromSessionId === toSessionId) {
      return NextResponse.json(
        { error: 'Cannot send join request to yourself' },
        { status: 400 }
      );
    }

    // Validate template type
    if (!TEMPLATE_MESSAGES[templateType]) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check rate limits and cooldowns
    const cooldownCheck = await checkJoinRequestAllowed(supabase, fromSessionId, toSessionId);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        {
          error: cooldownCheck.message || getJoinRateLimitError(
            cooldownCheck.reason || 'request_cooldown',
            cooldownCheck.retryAfterMs,
            'ja'
          ),
          reason: cooldownCheck.reason,
          retryAfterMs: cooldownCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Get session info for both parties
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id, merchant_id, table_number, nickname')
      .in('id', [fromSessionId, toSessionId]);

    if (sessionError || !sessions || sessions.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid sessions' },
        { status: 400 }
      );
    }

    const fromSession = sessions.find(s => s.id === fromSessionId);
    const toSession = sessions.find(s => s.id === toSessionId);

    if (!fromSession || !toSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Ensure same merchant
    if (fromSession.merchant_id !== toSession.merchant_id) {
      return NextResponse.json(
        { error: 'Sessions must be from the same merchant' },
        { status: 400 }
      );
    }

    // Create join request
    const { data: joinRequest, error: insertError } = await supabase
      .from('join_requests')
      .insert({
        merchant_id: fromSession.merchant_id,
        from_table_number: fromSession.table_number,
        to_table_number: toSession.table_number,
        from_session_id: fromSessionId,
        to_session_id: toSessionId,
        template_type: templateType,
        status: 'pending',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 후 만료
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating join request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create join request' },
        { status: 500 }
      );
    }

    // Record cooldown
    await recordJoinRequestCooldown(supabase, fromSessionId);

    return NextResponse.json({
      success: true,
      joinRequest: {
        ...joinRequest,
        templateMessage: TEMPLATE_MESSAGES[templateType],
      },
    });
  } catch (error) {
    console.error('Join request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/join/requests
 * 받은/보낸 합석 요청 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') || 'received'; // 'received' or 'sent'

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Expire old pending requests first
    try {
      await supabase.rpc('expire_pending_join_requests');
    } catch {
      // Ignore if function doesn't exist yet
    }

    let query = supabase
      .from('join_requests')
      .select(`
        *,
        from_session:sessions!join_requests_from_session_id_fkey(
          id, nickname, table_number, gender, age_range, party_size
        ),
        to_session:sessions!join_requests_to_session_id_fkey(
          id, nickname, table_number, gender, age_range, party_size
        )
      `)
      .order('created_at', { ascending: false });

    if (type === 'received') {
      query = query.eq('to_session_id', sessionId).eq('status', 'pending');
    } else {
      query = query.eq('from_session_id', sessionId);
    }

    const { data: requests, error } = await query.limit(20);

    if (error) {
      console.error('Error fetching join requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch join requests' },
        { status: 500 }
      );
    }

    // Add template messages
    const requestsWithMessages = (requests || []).map(req => ({
      ...req,
      templateMessage: TEMPLATE_MESSAGES[req.template_type] || TEMPLATE_MESSAGES['available_now'],
    }));

    return NextResponse.json({
      data: requestsWithMessages,
    });
  } catch (error) {
    console.error('Get join requests API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

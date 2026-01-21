import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * POST /api/join/sessions/[sessionId]/verify
 * 스태프가 합석 세션을 확인하고 인증하는 엔드포인트
 * - 스태프 ID와 확인 코드를 검증
 * - 세션 상태를 confirmed로 업데이트
 * - 감사 로그를 위해 staffId 기록
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { staffId, confirmationCode, merchantId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required for verification' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the join session with related session info
    const { data: joinSession, error: fetchError } = await supabase
      .from('join_sessions')
      .select(`
        *,
        session_a:sessions!join_sessions_session_a_id_fkey(
          id, nickname, table_number, merchant_id
        ),
        session_b:sessions!join_sessions_session_b_id_fkey(
          id, nickname, table_number, merchant_id
        )
      `)
      .eq('id', sessionId)
      .single();

    if (fetchError || !joinSession) {
      return NextResponse.json(
        { error: 'Join session not found' },
        { status: 404 }
      );
    }

    // Verify merchant if provided
    if (merchantId) {
      const sessionMerchantId = joinSession.session_a?.merchant_id || joinSession.session_b?.merchant_id;
      if (sessionMerchantId !== merchantId) {
        return NextResponse.json(
          { error: 'Session does not belong to this merchant' },
          { status: 403 }
        );
      }
    }

    // Verify confirmation code if provided
    if (confirmationCode && joinSession.confirmation_code !== confirmationCode) {
      return NextResponse.json(
        { error: 'Invalid confirmation code' },
        { status: 400 }
      );
    }

    // Check if session is in pending_confirmation status
    if (joinSession.status !== 'pending_confirmation') {
      if (joinSession.status === 'confirmed') {
        return NextResponse.json(
          {
            error: 'Session already confirmed',
            data: {
              id: joinSession.id,
              status: joinSession.status,
              confirmed_at: joinSession.confirmed_at,
              confirmed_by: joinSession.confirmed_by,
            }
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Session cannot be confirmed. Current status: ${joinSession.status}` },
        { status: 400 }
      );
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(joinSession.expires_at);
    if (now > expiresAt) {
      // Update status to expired
      await supabase
        .from('join_sessions')
        .update({
          status: 'expired',
          ended_at: now.toISOString(),
          end_reason: 'expired',
        })
        .eq('id', sessionId);

      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      );
    }

    // Update session with confirmation and staff info
    const { error: updateError } = await supabase
      .from('join_sessions')
      .update({
        status: 'confirmed',
        confirmed_at: now.toISOString(),
        confirmed_by: staffId,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error confirming join session:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm join session' },
        { status: 500 }
      );
    }

    // Get table numbers for response
    const tableA = joinSession.session_a?.table_number;
    const tableB = joinSession.session_b?.table_number;
    const nicknameA = joinSession.session_a?.nickname;
    const nicknameB = joinSession.session_b?.nickname;

    return NextResponse.json({
      success: true,
      message: '合席が確認されました',
      data: {
        id: sessionId,
        status: 'confirmed',
        confirmed_at: now.toISOString(),
        confirmed_by: staffId,
        tables: {
          tableA: { number: tableA, nickname: nicknameA },
          tableB: { number: tableB, nickname: nicknameB },
        },
      },
    });
  } catch (error) {
    console.error('Staff verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

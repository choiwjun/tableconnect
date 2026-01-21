import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/join/sessions/[sessionId]
 * 특정 합석 세션 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: joinSession, error } = await supabase
      .from('join_sessions')
      .select(`
        *,
        session_a:sessions!join_sessions_session_a_id_fkey(
          id, nickname, table_number, gender, age_range, party_size
        ),
        session_b:sessions!join_sessions_session_b_id_fkey(
          id, nickname, table_number, gender, age_range, party_size
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !joinSession) {
      return NextResponse.json(
        { error: 'Join session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: joinSession,
    });
  } catch (error) {
    console.error('Get join session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/join/sessions/[sessionId]
 * 합석 세션 상태 업데이트 (직원 확인, 종료)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { action, staffId } = body;

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['confirm', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be confirm or end' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the join session
    const { data: joinSession, error: fetchError } = await supabase
      .from('join_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !joinSession) {
      return NextResponse.json(
        { error: 'Join session not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'confirm') {
      if (joinSession.status !== 'pending_confirmation') {
        return NextResponse.json(
          { error: 'Session is not pending confirmation' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('join_sessions')
        .update({
          status: 'confirmed',
          confirmed_at: now,
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error confirming join session:', updateError);
        return NextResponse.json(
          { error: 'Failed to confirm join session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'confirmed',
        message: '合席が確認されました',
      });
    } else {
      // End session
      if (!['pending_confirmation', 'confirmed'].includes(joinSession.status)) {
        return NextResponse.json(
          { error: 'Session cannot be ended' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('join_sessions')
        .update({
          status: 'ended',
          ended_at: now,
          end_reason: staffId ? 'staff_ended' : 'manual',
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error ending join session:', updateError);
        return NextResponse.json(
          { error: 'Failed to end join session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'ended',
        message: '合席セッションが終了しました',
      });
    }
  } catch (error) {
    console.error('Join session update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

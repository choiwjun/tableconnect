import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/join/verify
 * 합석 코드 검증 (직원용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { joinCode, merchantId } = body;

    if (!joinCode || !merchantId) {
      return NextResponse.json(
        { error: 'Join code and merchant ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find the join session by code
    const { data: joinSession, error } = await supabase
      .from('join_sessions')
      .select(`
        *,
        session_a:sessions!join_sessions_session_a_id_fkey(
          id, nickname, table_number
        ),
        session_b:sessions!join_sessions_session_b_id_fkey(
          id, nickname, table_number
        )
      `)
      .eq('merchant_id', merchantId)
      .eq('join_code', joinCode.toUpperCase())
      .eq('status', 'pending_confirmation')
      .single();

    if (error || !joinSession) {
      return NextResponse.json(
        { error: '無効な合席コードです', valid: false },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(joinSession.ends_at) < new Date()) {
      return NextResponse.json(
        { error: '合席コードの有効期限が切れています', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      joinSession: {
        id: joinSession.id,
        tableA: joinSession.table_a_number,
        tableB: joinSession.table_b_number,
        sessionA: joinSession.session_a,
        sessionB: joinSession.session_b,
        joinCode: joinSession.join_code,
        startedAt: joinSession.started_at,
        endsAt: joinSession.ends_at,
      },
    });
  } catch (error) {
    console.error('Verify join code API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

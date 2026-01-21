import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/join/sessions
 * 활성 합석 세션 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const merchantId = searchParams.get('merchantId');

    const supabase = getSupabaseAdmin();

    // Expire timed out sessions first
    try {
      await supabase.rpc('end_expired_join_sessions');
    } catch {
      // Ignore if function doesn't exist yet
    }

    let query = supabase
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
      .in('status', ['pending_confirmation', 'confirmed'])
      .order('started_at', { ascending: false });

    if (sessionId) {
      query = query.or(`session_a_id.eq.${sessionId},session_b_id.eq.${sessionId}`);
    }

    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data: sessions, error } = await query.limit(20);

    if (error) {
      console.error('Error fetching join sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch join sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: sessions || [],
    });
  } catch (error) {
    console.error('Get join sessions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

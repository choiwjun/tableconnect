import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/join
 * 관리자용 합석 이벤트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const status = searchParams.get('status'); // 'active', 'pending', 'all'

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch join requests
    let requestsQuery = supabase
      .from('join_requests')
      .select(`
        id,
        from_table_number,
        to_table_number,
        template_type,
        status,
        created_at,
        responded_at,
        from_session:sessions!join_requests_from_session_id_fkey(
          nickname, party_size
        ),
        to_session:sessions!join_requests_to_session_id_fkey(
          nickname, party_size
        )
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status === 'pending') {
      requestsQuery = requestsQuery.eq('status', 'pending');
    }

    // Fetch join sessions
    let sessionsQuery = supabase
      .from('join_sessions')
      .select(`
        id,
        table_a_number,
        table_b_number,
        join_code,
        status,
        started_at,
        ends_at,
        confirmed_at,
        ended_at,
        end_reason,
        session_a:sessions!join_sessions_session_a_id_fkey(
          nickname, party_size
        ),
        session_b:sessions!join_sessions_session_b_id_fkey(
          nickname, party_size
        )
      `)
      .eq('merchant_id', merchantId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (status === 'active') {
      sessionsQuery = sessionsQuery.in('status', ['pending_confirmation', 'confirmed']);
    }

    const [requestsResult, sessionsResult] = await Promise.all([
      requestsQuery,
      sessionsQuery,
    ]);

    if (requestsResult.error) {
      console.error('Error fetching join requests:', requestsResult.error);
    }

    if (sessionsResult.error) {
      console.error('Error fetching join sessions:', sessionsResult.error);
    }

    // Calculate stats
    const requests = requestsResult.data || [];
    const sessions = sessionsResult.data || [];

    const stats = {
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      activeJoinSessions: sessions.filter(s => s.status === 'pending_confirmation' || s.status === 'confirmed').length,
      todayRequests: requests.filter(r => {
        const createdAt = new Date(r.created_at);
        const today = new Date();
        return createdAt.toDateString() === today.toDateString();
      }).length,
      todayAccepted: requests.filter(r => {
        const respondedAt = r.responded_at ? new Date(r.responded_at) : null;
        const today = new Date();
        return r.status === 'accepted' && respondedAt?.toDateString() === today.toDateString();
      }).length,
    };

    // Helper to safely get nickname from joined data
    const getNickname = (session: unknown): string | undefined => {
      if (!session) return undefined;
      if (Array.isArray(session)) {
        return (session[0] as { nickname?: string })?.nickname;
      }
      return (session as { nickname?: string })?.nickname;
    };

    // Format events for dashboard
    const events = [
      ...requests.map(r => ({
        type: 'request' as const,
        id: r.id,
        tableFrom: r.from_table_number,
        tableTo: r.to_table_number,
        status: r.status,
        createdAt: r.created_at,
        respondedAt: r.responded_at,
        fromNickname: getNickname(r.from_session),
        toNickname: getNickname(r.to_session),
        templateType: r.template_type,
      })),
      ...sessions.map(s => ({
        type: 'session' as const,
        id: s.id,
        tableA: s.table_a_number,
        tableB: s.table_b_number,
        joinCode: s.join_code,
        status: s.status,
        startedAt: s.started_at,
        endsAt: s.ends_at,
        confirmedAt: s.confirmed_at,
        endedAt: s.ended_at,
        endReason: s.end_reason,
        nicknameA: getNickname(s.session_a),
        nicknameB: getNickname(s.session_b),
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.type === 'request' ? a.createdAt : a.startedAt);
      const dateB = new Date(b.type === 'request' ? b.createdAt : b.startedAt);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      stats,
      events,
      requests,
      sessions,
    });
  } catch (error) {
    console.error('Admin join API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

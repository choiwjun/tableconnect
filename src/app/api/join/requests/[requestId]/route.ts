import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  recordRejectionCooldown,
  generateJoinCode,
} from '@/lib/security/join-rate-limit';

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

/**
 * PATCH /api/join/requests/[requestId]
 * 합석 요청 응답 (수락/거절/보류)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const body = await request.json();
    const { action, sessionId } = body;

    if (!requestId || !action || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept, reject, or cancel' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the join request
    const { data: joinRequest, error: fetchError } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Verify authorization
    if (action === 'cancel') {
      // Only sender can cancel
      if (joinRequest.from_session_id !== sessionId) {
        return NextResponse.json(
          { error: 'Only the sender can cancel this request' },
          { status: 403 }
        );
      }
    } else {
      // Only recipient can accept/reject
      if (joinRequest.to_session_id !== sessionId) {
        return NextResponse.json(
          { error: 'Only the recipient can respond to this request' },
          { status: 403 }
        );
      }
    }

    // Check if request is still pending
    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${joinRequest.status}` },
        { status: 400 }
      );
    }

    // Check if request has expired
    if (new Date(joinRequest.expires_at) < new Date()) {
      await supabase
        .from('join_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      return NextResponse.json(
        { error: 'Request has expired' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // Update request status
      await supabase
        .from('join_requests')
        .update({
          status: 'accepted',
          responded_at: now,
        })
        .eq('id', requestId);

      // Create join session with confirmation code
      const joinCode = generateJoinCode();
      const { data: joinSession, error: sessionError } = await supabase
        .from('join_sessions')
        .insert({
          merchant_id: joinRequest.merchant_id,
          request_id: requestId,
          table_a_number: joinRequest.from_table_number,
          table_b_number: joinRequest.to_table_number,
          session_a_id: joinRequest.from_session_id,
          session_b_id: joinRequest.to_session_id,
          join_code: joinCode,
          status: 'pending_confirmation',
          ends_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30분 후 만료
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating join session:', sessionError);
        return NextResponse.json(
          { error: 'Failed to create join session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'accepted',
        joinSession: {
          id: joinSession.id,
          joinCode: joinSession.join_code,
          tableA: joinRequest.from_table_number,
          tableB: joinRequest.to_table_number,
          endsAt: joinSession.ends_at,
        },
      });
    } else if (action === 'reject') {
      // Update request status
      await supabase
        .from('join_requests')
        .update({
          status: 'rejected',
          responded_at: now,
          rejection_count: (joinRequest.rejection_count || 0) + 1,
        })
        .eq('id', requestId);

      // Record rejection cooldown for the sender
      await recordRejectionCooldown(
        supabase,
        joinRequest.from_session_id,
        joinRequest.to_session_id
      );

      return NextResponse.json({
        success: true,
        action: 'rejected',
      });
    } else {
      // Cancel
      await supabase
        .from('join_requests')
        .update({
          status: 'cancelled',
          responded_at: now,
        })
        .eq('id', requestId);

      return NextResponse.json({
        success: true,
        action: 'cancelled',
      });
    }
  } catch (error) {
    console.error('Join request response API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/join/requests/[requestId]
 * 특정 합석 요청 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: joinRequest, error } = await supabase
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
      .eq('id', requestId)
      .single();

    if (error || !joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: joinRequest,
    });
  } catch (error) {
    console.error('Get join request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

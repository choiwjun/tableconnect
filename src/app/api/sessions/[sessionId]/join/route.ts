import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID, isValidNickname } from '@/lib/utils/validators';
import { MIN_PARTY_SIZE, MAX_PARTY_SIZE } from '@/lib/utils/constants';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * POST /api/sessions/[sessionId]/join
 * Join a session with profile data (nickname, gender, ageRange, partySize)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nickname, gender, ageRange, partySize } = body;

    // Validate nickname
    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    const trimmedNickname = nickname.trim();

    if (!isValidNickname(trimmedNickname)) {
      return NextResponse.json(
        { error: 'Invalid nickname' },
        { status: 400 }
      );
    }

    // Validate profile data
    if (!gender || !['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender is required' },
        { status: 400 }
      );
    }

    if (!ageRange || ![
      '20s_early', '20s_mid', '20s_late',
      '30s_early', '30s_mid', '30s_late',
      '40s'
    ].includes(ageRange)) {
      return NextResponse.json(
        { error: 'Age range is required' },
        { status: 400 }
      );
    }

    if (!partySize || typeof partySize !== 'number') {
      return NextResponse.json(
        { error: 'Party size is required' },
        { status: 400 }
      );
    }

    if (partySize < MIN_PARTY_SIZE || partySize > MAX_PARTY_SIZE) {
      return NextResponse.json(
        { error: `Party size must be between ${MIN_PARTY_SIZE} and ${MAX_PARTY_SIZE}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify session exists and is valid
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session is expired or inactive
    const isExpired = new Date(existingSession.expires_at) < new Date();
    if (isExpired || !existingSession.is_active) {
      return NextResponse.json(
        { error: 'Session is no longer active' },
        { status: 410 }
      );
    }

    // Check for duplicate nickname in same merchant (only for same age range and gender to allow more flexibility)
    const { data: duplicateNickname } = await supabase
      .from('sessions')
      .select('id')
      .eq('merchant_id', existingSession.merchant_id)
      .eq('nickname', trimmedNickname)
      .eq('gender', gender)
      .eq('age_range', ageRange)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .neq('id', sessionId)
      .limit(1);

    if (duplicateNickname) {
      return NextResponse.json(
        { error: 'このニックネームは既に使用されています' },
        { status: 409 }
      );
    }

    // Update session with profile data
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        nickname: trimmedNickname,
        gender,
        age_range: ageRange,
        party_size: partySize,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Session update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to join session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Session join error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID, isValidNickname } from '@/lib/utils/validators';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * POST /api/sessions/[sessionId]/join
 * Join a session with a nickname
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
    const { nickname } = body;

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

    // Check for duplicate nickname in same merchant
    const { data: duplicateNickname } = await supabase
      .from('sessions')
      .select('id')
      .eq('merchant_id', existingSession.merchant_id)
      .eq('nickname', trimmedNickname)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .neq('id', sessionId)
      .single();

    if (duplicateNickname) {
      return NextResponse.json(
        { error: 'このニックネームは既に使用されています' },
        { status: 409 }
      );
    }

    // Update session with nickname
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({ nickname: trimmedNickname })
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

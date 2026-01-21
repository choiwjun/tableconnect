import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

/**
 * POST /api/sessions/[sessionId]/verify-age
 * Verify age for a session
 * 세션의 연령 확인 처리
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { method, staffId, merchantId } = body;

    // Validate session ID
    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Validate method
    const validMethods = ['self', 'staff', 'id_check'];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid verification method. Must be: self, staff, or id_check' },
        { status: 400 }
      );
    }

    // Staff verification requires staffId
    if ((method === 'staff' || method === 'id_check') && !staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required for staff/id_check verification' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify session exists and is active
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('id, merchant_id, is_active, age_verified_at')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: 'Session is no longer active' },
        { status: 410 }
      );
    }

    // Check if already verified
    if (session.age_verified_at) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        verifiedAt: session.age_verified_at,
      });
    }

    // Verify merchant match for staff verification
    if (merchantId && session.merchant_id !== merchantId) {
      return NextResponse.json(
        { error: 'Session does not belong to this merchant' },
        { status: 403 }
      );
    }

    // Update session with age verification
    const updateData: Record<string, unknown> = {
      age_verified_at: new Date().toISOString(),
      age_verification_method: method,
    };

    if (method === 'staff' || method === 'id_check') {
      updateData.age_verified_by_staff = true;
      updateData.age_verification_staff_id = staffId;
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .is('age_verified_at', null); // Only update if not yet verified

    if (updateError) {
      console.error('Error updating age verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify age' },
        { status: 500 }
      );
    }

    console.log(`Session ${sessionId} age verified with method: ${method}`);

    return NextResponse.json({
      success: true,
      verifiedAt: updateData.age_verified_at,
      method,
      verifiedByStaff: method === 'staff' || method === 'id_check',
    });
  } catch (error) {
    console.error('Age verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[sessionId]/verify-age
 * Get age verification status for a session
 * 세션의 연령 확인 상태 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: session, error } = await supabase
      .from('sessions')
      .select(`
        id,
        age_verified_at,
        age_verified_by_staff,
        age_verification_method,
        is_active
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      isVerified: !!session.age_verified_at,
      verifiedAt: session.age_verified_at,
      verifiedByStaff: session.age_verified_by_staff,
      verificationMethod: session.age_verification_method,
      isActive: session.is_active,
    });
  } catch (error) {
    console.error('Get age verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

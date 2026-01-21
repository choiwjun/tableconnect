import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

/**
 * POST /api/gifts/[giftId]/redeem
 * Redeem a gift (staff only)
 * 선물 상환 처리 (직원 전용)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ giftId: string }> }
) {
  try {
    const { giftId } = await params;
    const body = await request.json();
    const { staffId, rollingCode, merchantId } = body;

    // Validate gift ID
    if (!giftId || !isValidUUID(giftId)) {
      return NextResponse.json(
        { error: 'Invalid gift ID' },
        { status: 400 }
      );
    }

    // Validate staff authentication (simplified - in production use proper auth)
    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get gift with its current state
    const { data: gift, error: fetchError } = await supabase
      .from('gifts')
      .select(`
        id,
        status,
        gift_token,
        token_redeemed,
        rolling_code,
        rolling_code_expires_at,
        menu:menus (
          merchant_id
        )
      `)
      .eq('id', giftId)
      .single();

    if (fetchError || !gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    // Verify gift is completed (paid)
    if (gift.status !== 'completed') {
      return NextResponse.json(
        { error: 'Gift payment not completed' },
        { status: 400 }
      );
    }

    // Verify gift hasn't been redeemed
    if (gift.token_redeemed) {
      return NextResponse.json(
        { error: 'Gift has already been redeemed' },
        { status: 409 }
      );
    }

    // Verify merchant match (staff can only redeem gifts for their merchant)
    const menuData = Array.isArray(gift.menu) ? gift.menu[0] : gift.menu;
    if (merchantId && menuData?.merchant_id !== merchantId) {
      return NextResponse.json(
        { error: 'Gift does not belong to this merchant' },
        { status: 403 }
      );
    }

    // Verify rolling code if provided (optional but recommended)
    if (rollingCode) {
      if (gift.rolling_code !== rollingCode) {
        return NextResponse.json(
          { error: 'Invalid rolling code' },
          { status: 400 }
        );
      }

      // Check if rolling code has expired (30 second window)
      if (gift.rolling_code_expires_at) {
        const expiresAt = new Date(gift.rolling_code_expires_at);
        if (new Date() > expiresAt) {
          return NextResponse.json(
            { error: 'Rolling code has expired. Please request a new code.' },
            { status: 400 }
          );
        }
      }
    }

    // Redeem the gift (idempotent update)
    const { error: updateError, count } = await supabase
      .from('gifts')
      .update({
        token_redeemed: true,
        token_redeemed_at: new Date().toISOString(),
        redeemed_by_staff_id: staffId,
      })
      .eq('id', giftId)
      .eq('status', 'completed')
      .eq('token_redeemed', false); // Only update if not yet redeemed

    if (updateError) {
      console.error('Error redeeming gift:', updateError);
      return NextResponse.json(
        { error: 'Failed to redeem gift' },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: 'Gift could not be redeemed (already redeemed or status changed)' },
        { status: 409 }
      );
    }

    console.log(`Gift ${giftId} redeemed by staff ${staffId}`);

    return NextResponse.json({
      success: true,
      giftId,
      redeemedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Gift redemption error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gifts/[giftId]/redeem
 * Get gift redemption status and generate rolling code
 * 선물 상환 상태 조회 및 회전 코드 생성
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ giftId: string }> }
) {
  try {
    const { giftId } = await params;

    if (!giftId || !isValidUUID(giftId)) {
      return NextResponse.json(
        { error: 'Invalid gift ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get gift status
    const { data: gift, error } = await supabase
      .from('gifts')
      .select(`
        id,
        status,
        gift_token,
        token_redeemed,
        token_redeemed_at,
        rolling_code,
        rolling_code_expires_at,
        amount,
        message,
        created_at,
        menu:menus (
          id,
          name,
          price,
          image_url
        ),
        sender:sessions!gifts_sender_session_id_fkey (
          nickname,
          table_number
        ),
        receiver:sessions!gifts_receiver_session_id_fkey (
          nickname,
          table_number
        )
      `)
      .eq('id', giftId)
      .single();

    if (error || !gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    // Generate new rolling code if not redeemed and status is completed
    let rollingCode = gift.rolling_code;
    let rollingCodeExpiresAt = gift.rolling_code_expires_at;

    if (
      gift.status === 'completed' &&
      !gift.token_redeemed &&
      (!gift.rolling_code_expires_at || new Date() > new Date(gift.rolling_code_expires_at))
    ) {
      // Generate new 6-digit rolling code
      rollingCode = Math.floor(100000 + Math.random() * 900000).toString();
      rollingCodeExpiresAt = new Date(Date.now() + 30000).toISOString(); // 30 seconds

      // Update in database
      await supabase
        .from('gifts')
        .update({
          rolling_code: rollingCode,
          rolling_code_expires_at: rollingCodeExpiresAt,
        })
        .eq('id', giftId);
    }

    // Transform the data
    const senderData = Array.isArray(gift.sender) ? gift.sender[0] : gift.sender;
    const receiverData = Array.isArray(gift.receiver) ? gift.receiver[0] : gift.receiver;
    const menuData = Array.isArray(gift.menu) ? gift.menu[0] : gift.menu;

    return NextResponse.json({
      id: gift.id,
      status: gift.status,
      giftToken: gift.gift_token,
      tokenRedeemed: gift.token_redeemed,
      tokenRedeemedAt: gift.token_redeemed_at,
      rollingCode: gift.token_redeemed ? null : rollingCode,
      rollingCodeExpiresAt: gift.token_redeemed ? null : rollingCodeExpiresAt,
      amount: gift.amount,
      message: gift.message,
      createdAt: gift.created_at,
      menu: menuData,
      sender: senderData,
      receiver: receiverData,
      canRedeem: gift.status === 'completed' && !gift.token_redeemed,
    });
  } catch (error) {
    console.error('Get gift redemption status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

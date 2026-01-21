import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createPaymentIntent } from '@/lib/stripe/server';
import { isValidUUID } from '@/lib/utils/validators';
import { isMutuallyBlocked } from '@/lib/security/block-check';

/**
 * POST /api/payments/intent
 * Create a Stripe payment intent for a gift
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menuId, senderSessionId, receiverSessionId, message } = body;

    // Validate input
    if (!menuId || !isValidUUID(menuId)) {
      return NextResponse.json(
        { error: 'Invalid menu ID' },
        { status: 400 }
      );
    }

    if (!senderSessionId || !isValidUUID(senderSessionId)) {
      return NextResponse.json(
        { error: 'Invalid sender session ID' },
        { status: 400 }
      );
    }

    if (!receiverSessionId || !isValidUUID(receiverSessionId)) {
      return NextResponse.json(
        { error: 'Invalid receiver session ID' },
        { status: 400 }
      );
    }

    if (senderSessionId === receiverSessionId) {
      return NextResponse.json(
        { error: 'Cannot send gift to yourself' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if either user has blocked the other
    const blocked = await isMutuallyBlocked(supabase, senderSessionId, receiverSessionId);
    if (blocked) {
      return NextResponse.json(
        { error: 'Cannot send gift to this user' },
        { status: 403 }
      );
    }

    // Verify menu exists and is available
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('id, price, merchant_id, is_available')
      .eq('id', menuId)
      .single();

    if (menuError || !menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    if (!menu.is_available) {
      return NextResponse.json(
        { error: 'Menu is not available' },
        { status: 400 }
      );
    }

    // Verify both sessions exist and are active
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, merchant_id, is_active, expires_at')
      .in('id', [senderSessionId, receiverSessionId]);

    if (sessionsError || !sessions || sessions.length !== 2) {
      return NextResponse.json(
        { error: 'One or both sessions not found' },
        { status: 404 }
      );
    }

    const senderSession = sessions.find((s) => s.id === senderSessionId);
    const receiverSession = sessions.find((s) => s.id === receiverSessionId);

    if (!senderSession || !receiverSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check sessions are from same merchant as menu
    if (
      senderSession.merchant_id !== menu.merchant_id ||
      receiverSession.merchant_id !== menu.merchant_id
    ) {
      return NextResponse.json(
        { error: 'Sessions and menu must be from the same merchant' },
        { status: 400 }
      );
    }

    // Check both sessions are active and not expired
    const now = new Date();
    if (
      !senderSession.is_active ||
      new Date(senderSession.expires_at) < now ||
      !receiverSession.is_active ||
      new Date(receiverSession.expires_at) < now
    ) {
      return NextResponse.json(
        { error: 'One or both sessions have expired' },
        { status: 410 }
      );
    }

    // Create pending gift record FIRST (so we have gift_id for payment intent metadata)
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        sender_session_id: senderSessionId,
        receiver_session_id: receiverSessionId,
        menu_id: menuId,
        amount: menu.price,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (giftError) {
      console.error('Error creating gift:', giftError);
      return NextResponse.json(
        { error: 'Failed to create gift' },
        { status: 500 }
      );
    }

    // Create payment intent with gift_id in metadata
    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      amount: menu.price,
      giftId: gift.id,
      menuId,
      senderSessionId,
      receiverSessionId,
      merchantId: menu.merchant_id,
    });

    // Update gift with payment intent ID
    const { error: updateError } = await supabase
      .from('gifts')
      .update({ stripe_payment_intent_id: paymentIntentId })
      .eq('id', gift.id);

    if (updateError) {
      console.error('Error updating gift with payment intent ID:', updateError);
      // Gift was created, payment intent was created, but linking failed
      // This is not critical - webhook can still process using gift_id from metadata
    }

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
      giftId: gift.id,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

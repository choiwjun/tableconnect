import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/gifts/auto-thank-you
 * Automatically send thank you message from gift receiver to sender
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderSessionId, receiverSessionId, giftId, locale = 'ja' } = body;

    if (!senderSessionId || !receiverSessionId || !giftId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get gift details
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select(`
        id,
        sender_session_id,
        receiver_session_id,
        merchant_id,
        gift_type,
        menu_item_id,
        amount
      `)
      .eq('id', giftId)
      .single();

    if (giftError || !gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      );
    }

    // Get menu item details if it's a menu gift
    let giftDescription = '';
    if (gift.gift_type === 'menu_item' && gift.menu_item_id) {
      const { data: menuItem } = await supabase
        .from('menus')
        .select('name, price')
        .eq('id', gift.menu_item_id)
        .single();

      giftDescription = menuItem ? `¥${menuItem.price} ${menuItem.name}` : 'Unknown menu item';
    } else if (gift.gift_type === 'point') {
      giftDescription = `¥${gift.amount} ポイント`;
    }

    // Generate thank you message (in the receiver's language)
    const thankYouMessages: Record<string, string> = {
      'ja': `ありがとうございます！\n${giftDescription}をいただきました！`,
      'ko': `감사합니다!\n${giftDescription}을 받았습니다!`,
      'en': `Thank you!\nI received ${giftDescription}!`,
      'zh': `谢谢!\n我收到了${giftDescription}!`,
    };

    const thankYouMessage = thankYouMessages[locale] || thankYouMessages['ja'];

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_session_id: receiverSessionId,
        receiver_session_id: senderSessionId,
        content: thankYouMessage,
        message_type: 'gift',
        is_read: false,
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error('Error creating thank you message:', messageError);
      return NextResponse.json(
        { error: 'Failed to create thank you message' },
        { status: 500 }
      );
    }

    console.log('Auto thank you message sent:', {
      from: receiverSessionId,
      to: senderSessionId,
      giftId,
      content: thankYouMessage,
    });

    return NextResponse.json({
      success: true,
      message,
      thankYouMessage,
    });
  } catch (error) {
    console.error('Auto thank you API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

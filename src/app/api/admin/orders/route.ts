import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/orders
 * Get all orders (gifts) for the merchant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch all gifts for the merchant
    const { data: gifts, error } = await supabase
      .from('gifts')
      .select(`
        id,
        sender_session_id,
        receiver_session_id,
        gift_type,
        menu_item_id,
        amount,
        status,
        created_at
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Fetch menu items for displaying menu names
    interface GiftItem {
      gift_type: string;
      menu_item_id: string;
    }
    const { data: menuItems } = await supabase
      .from('menus')
      .select('id, name, price')
      .in('id', gifts
        .filter((gift: GiftItem) => gift.gift_type === 'menu_item')
        .map((gift: GiftItem) => gift.menu_item_id)
      );

    return NextResponse.json({
      data: gifts || [],
      menuItems: menuItems || [],
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

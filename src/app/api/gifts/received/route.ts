import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('*')
      .eq('receiver_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (giftsError) {
      console.error('Error fetching gifts:', giftsError);
      return NextResponse.json(
        { error: 'Failed to fetch gifts' },
        { status: 500 }
      );
    }

    const menuItemIds = (gifts || [])
      .filter(gift => gift.gift_type === 'menu_item' && gift.menu_item_id)
      .map(gift => gift.menu_item_id);

    let menuItems: { id: string; name: string; price: number }[] = [];
    if (menuItemIds.length > 0) {
      const { data: items, error: menuError } = await supabase
        .from('menus')
        .select('id, name, price')
        .in('id', menuItemIds);

      if (!menuError) {
        menuItems = items || [];
      }
    }

    return NextResponse.json({
      data: gifts || [],
      menuItems,
    });
  } catch (error) {
    console.error('Received gifts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

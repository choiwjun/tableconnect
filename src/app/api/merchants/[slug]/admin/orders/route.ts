import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/merchants/[slug]/admin/orders
 * Get all orders for a merchant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const supabase = getSupabaseAdmin();

    // Get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Get gifts with menu items
    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (giftsError) {
      console.error('Error fetching gifts:', giftsError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Get unique menu item IDs
    const menuItemIds = Array.from(
      new Set((gifts || []).filter((g) => g.gift_type === 'menu_item').map((g) => g.menu_item_id))
    );

    // Fetch menu items
    let menuItems: { id: string; name: string }[] = [];
    if (menuItemIds.length > 0) {
      const { data: items, error: menuError } = await supabase
        .from('menus')
        .select('id, name')
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
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

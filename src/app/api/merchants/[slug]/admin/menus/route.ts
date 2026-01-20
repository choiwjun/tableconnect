import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/merchants/[slug]/admin/menus
 * Get all menus for a merchant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    // Get menus
    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (menusError) {
      console.error('Error fetching menus:', menusError);
      return NextResponse.json(
        { error: 'Failed to fetch menus' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: menus || [] });
  } catch (error) {
    console.error('Menus API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchants/[slug]/admin/menus
 * Create a new menu
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, price, description, is_available } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Create menu
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .insert({
        merchant_id: merchant.id,
        name,
        price,
        description: description || null,
        is_available: is_available !== undefined ? true : is_available,
      })
      .select()
      .single();

    if (menuError || !menu) {
      console.error('Error creating menu:', menuError);
      return NextResponse.json(
        { error: 'Failed to create menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: menu }, { status: 201 });
  } catch (error) {
    console.error('Menu creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

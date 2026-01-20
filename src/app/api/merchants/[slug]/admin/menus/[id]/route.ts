import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * PUT /api/merchants/[slug]/admin/menus/[id]
 * Update a menu item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id } = params;
    const body = await request.json();
    const { name, price, description, is_available } = body;

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

    // Update menu
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .update({
        name,
        price,
        description: description || null,
        is_available: is_available !== undefined ? true : is_available,
      })
      .eq('id', id)
      .eq('merchant_id', merchant.id)
      .select()
      .single();

    if (menuError || !menu) {
      console.error('Error updating menu:', menuError);
      return NextResponse.json(
        { error: 'Failed to update menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: menu });
  } catch (error) {
    console.error('Menu update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchants/[slug]/admin/menus/[id]
 * Delete a menu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id } = params;

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

    // Delete menu
    const { error: menuError } = await supabase
      .from('menus')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchant.id);

    if (menuError) {
      console.error('Error deleting menu:', menuError);
      return NextResponse.json(
        { error: 'Failed to delete menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Menu delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

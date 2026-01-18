import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser, hasAccessToMerchant } from '@/lib/auth';
import { isValidUUID } from '@/lib/utils/validators';

interface RouteParams {
  params: Promise<{ merchantId: string; menuId: string }>;
}

// GET /api/admin/merchants/[merchantId]/menus/[menuId] - Get menu details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { merchantId, menuId } = await params;
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isValidUUID(merchantId) || !isValidUUID(menuId)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await hasAccessToMerchant(merchantId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    const { data: menu, error } = await supabase
      .from('menus')
      .select('*')
      .eq('id', menuId)
      .eq('merchant_id', merchantId)
      .single();

    if (error || !menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Get gift count for this menu
    const { count: giftCount } = await supabase
      .from('gifts')
      .select('*', { count: 'exact', head: true })
      .eq('menu_id', menuId);

    return NextResponse.json({
      menu: {
        ...menu,
        giftCount: giftCount || 0,
      },
    });
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/merchants/[merchantId]/menus/[menuId] - Update menu
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { merchantId, menuId } = await params;
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isValidUUID(merchantId) || !isValidUUID(menuId)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await hasAccessToMerchant(merchantId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { name, description, price, imageUrl, category, isAvailable, sortOrder } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return NextResponse.json(
          { error: 'price must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.price = price;
    }
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (category !== undefined) updateData.category = category;
    if (isAvailable !== undefined) updateData.is_available = isAvailable;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data: menu, error } = await supabase
      .from('menus')
      .update(updateData)
      .eq('id', menuId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu:', error);
      return NextResponse.json(
        { error: 'Failed to update menu' },
        { status: 500 }
      );
    }

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ menu });
  } catch (error) {
    console.error('Menu update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/merchants/[merchantId]/menus/[menuId] - Delete menu
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { merchantId, menuId } = await params;
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isValidUUID(merchantId) || !isValidUUID(menuId)) {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await hasAccessToMerchant(merchantId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    // Check if menu has any gifts (don't delete if it does)
    const { count: giftCount } = await supabase
      .from('gifts')
      .select('*', { count: 'exact', head: true })
      .eq('menu_id', menuId);

    if (giftCount && giftCount > 0) {
      // Soft delete - just make unavailable
      const { error } = await supabase
        .from('menus')
        .update({
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', menuId)
        .eq('merchant_id', merchantId);

      if (error) {
        console.error('Error soft-deleting menu:', error);
        return NextResponse.json(
          { error: 'Failed to delete menu' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: 'Menu has associated gifts and was marked as unavailable instead of deleted',
      });
    }

    // Hard delete if no gifts
    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId)
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('Error deleting menu:', error);
      return NextResponse.json(
        { error: 'Failed to delete menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Menu delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

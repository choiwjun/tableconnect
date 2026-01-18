import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isValidUUID } from '@/lib/utils/validators';

interface RouteParams {
  params: Promise<{ merchantId: string }>;
}

/**
 * GET /api/merchants/[merchantId]/menus
 * Get menu list for a merchant
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { merchantId } = await params;

    if (!isValidUUID(merchantId)) {
      return NextResponse.json(
        { error: 'Invalid merchant ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const availableOnly = searchParams.get('available') !== 'false';

    const supabase = getSupabaseAdmin();

    // Verify merchant exists
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, is_active')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (!merchant.is_active) {
      return NextResponse.json(
        { error: 'Merchant is not active' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('menus')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (availableOnly) {
      query = query.eq('is_available', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: menus, error } = await query;

    if (error) {
      console.error('Error fetching menus:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menus' },
        { status: 500 }
      );
    }

    // Get unique categories
    const categories = Array.from(new Set((menus || []).map((m) => m.category).filter(Boolean)));

    return NextResponse.json({
      menus: menus || [],
      categories,
    });
  } catch (error) {
    console.error('Menus fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

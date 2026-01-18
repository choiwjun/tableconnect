import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser, hasAccessToMerchant } from '@/lib/auth';
import { isValidUUID } from '@/lib/utils/validators';

interface RouteParams {
  params: Promise<{ merchantId: string }>;
}

// GET /api/admin/merchants/[merchantId]/menus - Get all menus for a merchant
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { merchantId } = await params;
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isValidUUID(merchantId)) {
    return NextResponse.json(
      { error: 'Invalid merchant ID' },
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
  const searchParams = request.nextUrl.searchParams;

  const category = searchParams.get('category');
  const isAvailable = searchParams.get('isAvailable');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('menus')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchantId);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (isAvailable !== null) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    // Apply pagination and ordering
    query = query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: menus, error, count } = await query;

    if (error) {
      console.error('Error fetching menus:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menus' },
        { status: 500 }
      );
    }

    // Get unique categories
    const { data: allMenus } = await supabase
      .from('menus')
      .select('category')
      .eq('merchant_id', merchantId);

    const categories = Array.from(
      new Set((allMenus || []).map(m => m.category).filter(Boolean))
    );

    return NextResponse.json({
      menus: menus || [],
      categories,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Menus API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/merchants/[merchantId]/menus - Create a new menu
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { merchantId } = await params;
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!isValidUUID(merchantId)) {
    return NextResponse.json(
      { error: 'Invalid merchant ID' },
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

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'name and price are required' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'price must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get max sort order if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const { data: maxOrderResult } = await supabase
        .from('menus')
        .select('sort_order')
        .eq('merchant_id', merchantId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      finalSortOrder = (maxOrderResult?.sort_order || 0) + 1;
    }

    const { data: menu, error } = await supabase
      .from('menus')
      .insert({
        merchant_id: merchantId,
        name,
        description: description || null,
        price,
        image_url: imageUrl || null,
        category: category || null,
        is_available: isAvailable !== false,
        sort_order: finalSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating menu:', error);
      return NextResponse.json(
        { error: 'Failed to create menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error('Menu creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

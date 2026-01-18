import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser, isSuperAdmin } from '@/lib/auth';

// GET /api/admin/merchants - Get all merchants
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const isActive = searchParams.get('isActive');
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('merchants')
      .select('*', { count: 'exact' });

    // Merchant admin can only see their own merchant
    if (admin.role === 'merchant_admin' && admin.merchantId) {
      query = query.eq('id', admin.merchantId);
    }

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: merchants, error, count } = await query;

    if (error) {
      console.error('Error fetching merchants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch merchants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      merchants: merchants || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Merchants API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/merchants - Create a new merchant (super admin only)
export async function POST(request: NextRequest) {
  const superAdmin = await isSuperAdmin();

  if (!superAdmin) {
    return NextResponse.json(
      { error: 'Forbidden. Super admin access required.' },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { name, slug, description, address, phone, businessHours, settings } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const { data: existing } = await supabase
      .from('merchants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const { data: merchant, error } = await supabase
      .from('merchants')
      .insert({
        name,
        slug,
        description: description || null,
        address: address || null,
        phone: phone || null,
        business_hours: businessHours || null,
        settings: settings || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating merchant:', error);
      return NextResponse.json(
        { error: 'Failed to create merchant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant }, { status: 201 });
  } catch (error) {
    console.error('Merchant creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

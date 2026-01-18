import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser, hasAccessToMerchant, isSuperAdmin } from '@/lib/auth';
import { isValidUUID } from '@/lib/utils/validators';

interface RouteParams {
  params: Promise<{ merchantId: string }>;
}

// GET /api/admin/merchants/[merchantId] - Get merchant details
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

  try {
    const { data: merchant, error } = await supabase
      .from('merchants')
      .select(`
        *,
        menus:menus(count),
        sessions:sessions(count)
      `)
      .eq('id', merchantId)
      .single();

    if (error || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Get additional stats
    const { count: activeSessionsCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('is_active', true);

    // Get session IDs for this merchant
    const { data: merchantSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('merchant_id', merchantId);

    const sessionIds = (merchantSessions || []).map(s => s.id);

    let totalGiftsCount = 0;
    if (sessionIds.length > 0) {
      const { count } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .in('sender_session_id', sessionIds);
      totalGiftsCount = count || 0;
    }

    return NextResponse.json({
      merchant: {
        ...merchant,
        stats: {
          totalMenus: Array.isArray(merchant.menus) ? merchant.menus[0]?.count || 0 : 0,
          totalSessions: Array.isArray(merchant.sessions) ? merchant.sessions[0]?.count || 0 : 0,
          activeSessions: activeSessionsCount || 0,
          totalGifts: totalGiftsCount,
        },
      },
    });
  } catch (error) {
    console.error('Merchant fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/merchants/[merchantId] - Update merchant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { name, description, address, phone, businessHours, settings, isActive } = body;

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (businessHours !== undefined) updateData.business_hours = businessHours;
    if (settings !== undefined) updateData.settings = settings;

    // Only super admin can change is_active
    if (isActive !== undefined) {
      const superAdmin = await isSuperAdmin();
      if (superAdmin) {
        updateData.is_active = isActive;
      }
    }

    const { data: merchant, error } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('id', merchantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating merchant:', error);
      return NextResponse.json(
        { error: 'Failed to update merchant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ merchant });
  } catch (error) {
    console.error('Merchant update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/merchants/[merchantId] - Delete merchant (super admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { merchantId } = await params;
  const superAdmin = await isSuperAdmin();

  if (!superAdmin) {
    return NextResponse.json(
      { error: 'Forbidden. Super admin access required.' },
      { status: 403 }
    );
  }

  if (!isValidUUID(merchantId)) {
    return NextResponse.json(
      { error: 'Invalid merchant ID' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    // Soft delete - just set is_active to false
    const { error } = await supabase
      .from('merchants')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', merchantId);

    if (error) {
      console.error('Error deleting merchant:', error);
      return NextResponse.json(
        { error: 'Failed to delete merchant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Merchant delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

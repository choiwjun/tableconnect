import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/merchants/[slug]/admin/settings
 * Get merchant settings
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
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: merchant });
  } catch (error) {
    console.error('Settings GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchants/[slug]/admin/settings
 * Update merchant settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const {
      name,
      description,
      address,
      phone,
      business_hours,
      settings: { max_tables, fee_percentage, auto_settlement },
    } = body;

    const supabase = getSupabaseAdmin();

    // Get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, settings')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Update merchant settings
    const updateData: Record<string, string | number | boolean | object | null> = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (business_hours !== undefined) updateData.business_hours = business_hours;
    
    if (max_tables !== undefined || fee_percentage !== undefined || auto_settlement !== undefined) {
      updateData.settings = {
        ...merchant.settings,
        ...(max_tables !== undefined && { max_tables }),
        ...(fee_percentage !== undefined && { fee_percentage }),
        ...(auto_settlement !== undefined && { auto_settlement }),
      };
    }

    const { data: updatedMerchant, error: updateError } = await supabase
      .from('merchants')
      .update(updateData)
      .eq('id', merchant.id)
      .select()
      .single();

    if (updateError || !updatedMerchant) {
      console.error('Error updating merchant:', updateError);
      return NextResponse.json(
        { error: 'Failed to update merchant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedMerchant,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Settings PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

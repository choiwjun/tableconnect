import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/merchants/[slug]/admin/settlements
 * Get all settlements for a merchant
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

    // Get settlements
    const { data: settlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('month', { ascending: false });

    if (settlementsError) {
      console.error('Error fetching settlements:', settlementsError);
      return NextResponse.json(
        { error: 'Failed to fetch settlements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: settlements || [] });
  } catch (error) {
    console.error('Settlements API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchants/[slug]/admin/settlements
 * Request a new settlement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { month } = body;

    if (!month) {
      return NextResponse.json(
        { error: 'Month is required' },
        { status: 400 }
      );
    }

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

    // Check if settlement already exists for this month
    const { data: existingSettlement } = await supabase
      .from('settlements')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('month', month)
      .single();

    if (existingSettlement) {
      return NextResponse.json(
        { error: 'Settlement already exists for this month' },
        { status: 400 }
      );
    }

    // Calculate totals for the month
    const startDate = new Date(month + '-01');
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);

    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select('amount, status, created_at')
      .eq('merchant_id', merchant.id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString())
      .eq('status', 'completed');

    if (giftsError) {
      console.error('Error fetching gifts for settlement:', giftsError);
    }

    const totalRevenue = (gifts || []).reduce((sum, gift) => sum + (gift.amount || 0), 0);
    const totalGifts = (gifts || []).length;
    const feePercentage = merchant.settings?.fee_percentage || 10;
    const totalFees = totalRevenue * (feePercentage / 100);
    const netAmount = totalRevenue - totalFees;

    // Create settlement
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .insert({
        merchant_id: merchant.id,
        month,
        total_revenue: totalRevenue,
        total_gifts: totalGifts,
        total_fees: totalFees,
        net_amount: netAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (settlementError || !settlement) {
      console.error('Error creating settlement:', settlementError);
      return NextResponse.json(
        { error: 'Failed to create settlement' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: settlement, message: 'Settlement requested successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Settlement creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/settlements/generate
 * Generate monthly settlements for a merchant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, month, year } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Default to current month/year
    const now = new Date();
    const settlementMonth = month || (now.getMonth() + 1);
    const settlementYear = year || now.getFullYear();

    const supabase = getSupabaseAdmin();

    // Get merchant fee rate
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, created_at')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Calculate fee rate (first 3 months: 12%, after: 17.5%)
    const monthsSinceCreation = Math.floor(
      (now.getTime() - new Date(merchant.created_at).getTime()) /
        (30 * 24 * 60 * 60 * 1000)
    );
    const feeRate = monthsSinceCreation < 3 ? 12.00 : 17.50;

    // Aggregate completed gifts for the month
    const startDate = new Date(settlementYear, settlementMonth - 1, 1);
    const endDate = new Date(settlementYear, settlementMonth, 0);

    const { data: gifts, error: giftsError } = await supabase
      .from('gifts')
      .select(`
        id,
        merchant_id,
        amount
      `)
      .eq('merchant_id', merchantId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    if (giftsError) {
      return NextResponse.json(
        { error: 'Failed to aggregate gifts' },
        { status: 500 }
      );
    }

    // Calculate totals
    const transactionCount = gifts.length;
    const totalAmount = gifts.reduce((sum, gift) => sum + (gift.amount || 0), 0);
    const platformFee = Math.floor(totalAmount * (feeRate / 100));
    const merchantAmount = totalAmount - platformFee;

    // Check if settlement already exists
    const { data: existingSettlement } = await supabase
      .from('settlements')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('settlement_date', `${settlementYear}-${settlementMonth.toString().padStart(2, '0')}-01`)
      .single();

    if (existingSettlement) {
      return NextResponse.json({
        success: false,
        message: 'Settlement already exists for this month',
        data: existingSettlement,
      });
    }

    // Insert or update settlement
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .upsert({
        merchant_id: merchantId,
        settlement_date: `${settlementYear}-${settlementMonth.toString().padStart(2, '0')}-01`,
        transaction_count: transactionCount,
        total_amount: totalAmount,
        platform_fee_rate: feeRate,
        platform_fee: platformFee,
        merchant_amount: merchantAmount,
        status: 'pending',
      })
      .select();

    if (settlementError) {
      console.error('Error creating settlement:', settlementError);
      return NextResponse.json(
        { error: 'Failed to create settlement' },
        { status: 500 }
      );
    }

    console.log(`Settlement generated for merchant ${merchantId}`, {
      month: settlementMonth,
      year: settlementYear,
      transactionCount,
      totalAmount,
      platformFee,
      merchantAmount,
    });

    return NextResponse.json({
      success: true,
      settlement,
      transactionCount,
      totalAmount,
      platformFee,
      merchantAmount,
    });
  } catch (error) {
    console.error('Generate settlement API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

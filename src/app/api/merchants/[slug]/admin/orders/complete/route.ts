import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/merchants/[slug]/admin/orders/complete
 * Mark an order as completed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Update gift status to completed
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .update({ status: 'completed' })
      .eq('id', orderId)
      .eq('merchant_id', merchant.id)
      .select()
      .single();

    if (giftError || !gift) {
      console.error('Error updating gift:', giftError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: gift,
      message: 'Order completed successfully',
    });
  } catch (error) {
    console.error('Complete order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

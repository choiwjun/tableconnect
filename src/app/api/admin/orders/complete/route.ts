import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/admin/orders/complete
 * Complete an order (change gift status to completed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update gift status to completed
    const { error } = await supabase
      .from('gifts')
      .update({ status: 'completed' })
      .eq('id', orderId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error completing order:', error);
      return NextResponse.json(
        { error: 'Failed to complete order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
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

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/merchants/[slug]/admin/stats
 * Get merchant dashboard stats
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

    // Get today's revenue and gifts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayGifts, error: todayGiftsError } = await supabase
      .from('gifts')
      .select('amount, status, created_at')
      .eq('merchant_id', merchant.id)
      .gte('created_at', today.toISOString())
      .eq('status', 'completed');

    if (todayGiftsError) {
      console.error('Error fetching today gifts:', todayGiftsError);
    }

    const todayRevenue = (todayGifts || []).reduce((sum, gift) => sum + (gift.amount || 0), 0);
    const todayGiftsCount = (todayGifts || []).length;

    // Get today's orders
    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('gifts')
      .select('id, status')
      .eq('merchant_id', merchant.id)
      .gte('created_at', today.toISOString());

    if (todayOrdersError) {
      console.error('Error fetching today orders:', todayOrdersError);
    }

    const todayOrdersCount = (todayOrders || []).length;

    // Get active sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    const activeSessionsCount = (sessions || []).length;

    // Get pending orders
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('gifts')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('Error fetching pending orders:', pendingError);
    }

    const pendingOrdersCount = (pendingOrders || []).length;

    // Get this month's revenue
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const { data: thisMonthGifts, error: thisMonthError } = await supabase
      .from('gifts')
      .select('amount, status')
      .eq('merchant_id', merchant.id)
      .gte('created_at', thisMonth.toISOString())
      .eq('status', 'completed');

    const { data: lastMonthGifts, error: lastMonthError } = await supabase
      .from('gifts')
      .select('amount, status')
      .eq('merchant_id', merchant.id)
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', thisMonth.toISOString())
      .eq('status', 'completed');

    const monthlyRevenue = (thisMonthGifts || []).reduce((sum, gift) => sum + (gift.amount || 0), 0);
    const lastMonthRevenue = (lastMonthGifts || []).reduce((sum, gift) => sum + (gift.amount || 0), 0);

    const monthOverMonthGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    return NextResponse.json({
      todayRevenue,
      todayOrders: todayOrdersCount,
      todayGifts: todayGiftsCount,
      activeSessions: activeSessionsCount,
      pendingOrders: pendingOrdersCount,
      monthlyRevenue,
      lastMonthRevenue,
      monthOverMonthGrowth,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

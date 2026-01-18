import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser, hasAccessToMerchant } from '@/lib/auth';

// GET /api/admin/settlements/summary - Get settlement summary statistics
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

  const merchantId = searchParams.get('merchantId');

  // Check merchant access for merchant_admin
  if (merchantId && admin.role === 'merchant_admin') {
    const hasAccess = await hasAccessToMerchant(merchantId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }

  try {
    // Build base query conditions
    const targetMerchantId = merchantId || (admin.role === 'merchant_admin' ? admin.merchantId : null);

    // Get current month date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get last month date range
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Get all settlements for this merchant/all merchants
    let settlementsQuery = supabase.from('settlements').select('*');
    if (targetMerchantId) {
      settlementsQuery = settlementsQuery.eq('merchant_id', targetMerchantId);
    }
    const { data: allSettlements } = await settlementsQuery;

    // Calculate totals
    const settlements = allSettlements || [];

    const totalRevenue = settlements.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalFees = settlements.reduce((sum, s) => sum + (s.fee_amount || 0), 0);
    const totalPaid = settlements
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.net_amount || 0), 0);
    const pendingAmount = settlements
      .filter(s => s.status === 'pending' || s.status === 'processing')
      .reduce((sum, s) => sum + (s.net_amount || 0), 0);

    // Get current month gifts count and amount
    const { data: currentMonthGifts } = await supabase
      .from('gifts')
      .select('id, amount, sender_session_id')
      .eq('status', 'completed')
      .gte('created_at', currentMonthStart)
      .lte('created_at', currentMonthEnd);

    // Get last month gifts for comparison
    const { data: lastMonthGifts } = await supabase
      .from('gifts')
      .select('id, amount')
      .eq('status', 'completed')
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd);

    const currentMonthTotal = (currentMonthGifts || []).reduce((sum, g) => sum + g.amount, 0);
    const lastMonthTotal = (lastMonthGifts || []).reduce((sum, g) => sum + g.amount, 0);

    const monthOverMonthGrowth = lastMonthTotal > 0
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Get settlement status breakdown
    const statusBreakdown = {
      pending: settlements.filter(s => s.status === 'pending').length,
      processing: settlements.filter(s => s.status === 'processing').length,
      completed: settlements.filter(s => s.status === 'completed').length,
      failed: settlements.filter(s => s.status === 'failed').length,
    };

    // Get recent transactions for charts (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentGifts } = await supabase
      .from('gifts')
      .select('created_at, amount')
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true });

    // Group by day
    const dailyData: Record<string, number> = {};
    (recentGifts || []).forEach(gift => {
      const day = gift.created_at.split('T')[0];
      dailyData[day] = (dailyData[day] || 0) + gift.amount;
    });

    const chartData = Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalFees,
        totalPaid,
        pendingAmount,
        currentMonthRevenue: currentMonthTotal,
        lastMonthRevenue: lastMonthTotal,
        monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 10) / 10,
        giftsThisMonth: (currentMonthGifts || []).length,
      },
      statusBreakdown,
      chartData,
    });
  } catch (error) {
    console.error('Settlement summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

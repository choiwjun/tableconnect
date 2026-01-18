import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminUser } from '@/lib/auth';

// GET /api/admin/reports/stats - Get report statistics
export async function GET() {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  try {
    // For merchant_admin, filter reports to their merchant's sessions
    let allReports: { status: string; reason: string; created_at: string }[] = [];

    if (admin.role === 'merchant_admin' && admin.merchantId) {
      // Get sessions for this merchant
      const { data: merchantSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('merchant_id', admin.merchantId);

      const sessionIds = (merchantSessions || []).map(s => s.id);

      if (sessionIds.length > 0) {
        // Get reports where reporter or reported session belongs to this merchant
        const { data: reports, error } = await supabase
          .from('reports')
          .select('status, reason, created_at, reporter_session_id, reported_session_id');

        if (error) {
          console.error('Error fetching report stats:', error);
          return NextResponse.json(
            { error: 'Failed to fetch report statistics' },
            { status: 500 }
          );
        }

        // Filter reports to only those involving merchant's sessions
        allReports = (reports || []).filter(
          r => sessionIds.includes(r.reporter_session_id) || sessionIds.includes(r.reported_session_id)
        );
      }
    } else {
      // Super admin sees all reports
      const { data: reports, error } = await supabase
        .from('reports')
        .select('status, reason, created_at');

      if (error) {
        console.error('Error fetching report stats:', error);
        return NextResponse.json(
          { error: 'Failed to fetch report statistics' },
          { status: 500 }
        );
      }

      allReports = reports || [];
    }

    // Calculate status breakdown
    const statusBreakdown = {
      pending: allReports.filter(r => r.status === 'pending').length,
      reviewing: allReports.filter(r => r.status === 'reviewing').length,
      resolved: allReports.filter(r => r.status === 'resolved').length,
      dismissed: allReports.filter(r => r.status === 'dismissed').length,
    };

    // Calculate reason breakdown
    const reasonBreakdown = {
      harassment: allReports.filter(r => r.reason === 'harassment').length,
      spam: allReports.filter(r => r.reason === 'spam').length,
      inappropriate: allReports.filter(r => r.reason === 'inappropriate').length,
      other: allReports.filter(r => r.reason === 'other').length,
    };

    // Calculate reports over time (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentReports = allReports.filter(
      r => new Date(r.created_at) >= thirtyDaysAgo
    );

    // Group by day
    const dailyData: Record<string, number> = {};
    recentReports.forEach(report => {
      const day = report.created_at.split('T')[0];
      dailyData[day] = (dailyData[day] || 0) + 1;
    });

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count,
      }));

    // Calculate trend
    const thisWeek = recentReports.filter(
      r => new Date(r.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const lastWeek = recentReports.filter(r => {
      const date = new Date(r.created_at);
      return date >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
        date < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).length;

    const weekOverWeekChange = lastWeek > 0
      ? ((thisWeek - lastWeek) / lastWeek) * 100
      : 0;

    return NextResponse.json({
      total: allReports.length,
      pendingCount: statusBreakdown.pending,
      resolvedToday: allReports.filter(r =>
        r.status === 'resolved' &&
        r.created_at.startsWith(now.toISOString().split('T')[0])
      ).length,
      weekOverWeekChange: Math.round(weekOverWeekChange * 10) / 10,
      statusBreakdown,
      reasonBreakdown,
      chartData,
    });
  } catch (error) {
    console.error('Report stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
